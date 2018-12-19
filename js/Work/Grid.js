define(['Class',
'jquery',
'TweenLite',
'TimelineLite',
'Global',
'Modernizr',
'swipe',
'jquery.hoverdir',
'jquery.hammer',
'underscore',
'ui/GridManager',
'Work/Cell',
'Work/SpinnersManager',
'ui/RotateHandler',
'libjs/utils/Util',
'utils/GA', 'utils/raf'],
function(Class,
    $,
    TweenLite,
    TimelineLite,
    Global,
    Modernizr,
    Swipe,
    hoverdir,
    Hammer,
    _,
    GridManager,
    Cell,
    SpinnersManager,
    RotateHandler,
    Util,
    GA) {

    var _this = null;

    var Grid = new Class({

        // Timelines
        categoryNavTimeline: null,

        // Element properties
        navWidth: null,
        gridContainerElement: null,
        isSetup: false,
        allowFiveCols: true,
        totalPosts: null,
        numOfCols: null,
        prevMobileFilter: 'mix_all',

        initialize: function(featuredURL){
            _this = this;

            this.featuredURL = featuredURL;

            this.gridContainerElement = $('.grid-container');
            this.gridEl = $('ul.content.grid');
            this.categoryNav = $('#category-nav');

            // Bind stuff
            this.animateCategoryNav = this.animateCategoryNav.bind(this);
            this.introGrid = this.introGrid.bind(this);
            this.navRespond = this.navRespond.bind(this);
            this.animateInGrid = this.animateInGrid.bind(this);
            this.resizeWorkGrid = this.resizeWorkGrid.bind(this);
            this.initWorkHoverEffects = this.initWorkHoverEffects.bind(this);
            this.onResizeHandler = this.onResizeHandler.bind(this);
            this.loopCheckScrollDelta = this.loopCheckScrollDelta.bind(this);
            this.openMobileCategoryNav = this.openMobileCategoryNav.bind(this);
            this.closeMobileCategoryNav = this.closeMobileCategoryNav.bind(this);

            if (Global.isMobile) {
              this.toggleScrollTouch();

              // set 'load more' button events
              this.mobileLoadMoreBtn = $('.grid-container .loadMore');
              this.mobileLoadMoreBtn.click(function() {
                this.animateOutMobileLoadBtn();
              }.bind(this));

              this.spinnersManager = new SpinnersManager(1);
              TweenLite.set(this.spinnersManager.spinners[0], {position: 'fixed',left: window.innerWidth/2-20});
              this.spinnersManager.spinners[0].addClass('is-spinning');
            }

            // load initial set of posts
            this.resetGridData();
            this.getCellsData();

            TweenLite.to($(window), 0, {scrollTo: 0});
        },

        toggleScrollTouch: function() { //also used by router on hash change
          // Set dimension of the main container
          // TO fix some scrolling issues
          if (Global.isMobile){
            $('body > .container, #content-wrap, main.front-page').css({
              width: Global.width,
              height: Global.windowHeight,
              overflowX: 'hidden'
            });
            var frontPageCSS = {
              position: 'absolute',
              overflowY: 'scroll',
              top: 0,
              left: 0
            };
            // For some reason chrome on android stopped supporting webkit-overflow-scroll
            // http://stackoverflow.com/questions/15906508/chrome-browser-for-android-no-longer-supports-webkit-overflow-scrolling-is-the
            if (!Util.support.isAndroid){
              frontPageCSS.webkitOverflowScrolling = location.hash ? 'touch' : 'auto';
            }
            $('main.front-page').css(frontPageCSS);
            // prevent touc move on menu
            $('#category-nav, header').on('touchmove', function(e){
              e.preventDefault();
            });
          }
        },

        checkIfNeedsLoadPosts: function() {
          requestAnimationFrame(this.checkIfNeedsLoadPosts.bind(this));

          if (this.spinnersManager) this.spinnersManager.animateInViewport();

          var gridBottomPos = this.gridEl.height() + this.gridEl.offset().top - Global.windowHeight;
          var offset = this.gridManager.itemHeight*(this.numOfCols > 3 ? 1 : 3);

          if ($(window).scrollTop() >= (gridBottomPos - offset) && !this.isLoadingGridData && !this.isFilteredByCategory) {
            // make sure not to load more posts when scrolling project pages
            if (!location.hash && !this.featuredURL) this.getCellsData(++this.currPage, true);
          }
        },

        resetGridData: function() {
          this.currPage = 1;
          this.isInitGridLoad = true;
          this.isLoadingGridData = false;
          this.isFilteredByCategory = false;
          this.noMorePostsToLoad = false;
          this.isSetup = false;

          if (Global.isMobile) {
            this.postsPerPage = 10;
          } else {
            this.postsPerPage = (window.innerWidth > 1800 && this.allowFiveCols) ? 10 : 12;
          }
        },

        getCellsData: function(pageNum, loadMore, filterCondition) {

          // check if all posts data is already loaded or no need to load more
          if (this.noMorePostsToLoad && !filterCondition) {
            return;
          }

          this.isLoadingGridData = true;

          this.topFeaturedItems = []; // items that will go upfront for sales custom link

          if (!Global.isMobile) {
            pageNum = (!pageNum || pageNum == 1) ? 1 : pageNum + 1;
          }

          filterCondition = filterCondition || '';

          console.log('getting grid data for page: ',pageNum);

          var numOfPostsToLoad;
          if (Global.isMobile) {
            numOfPostsToLoad = (filterCondition || this.featuredURL) ? -1 : this.postsPerPage;
          } else {
            numOfPostsToLoad = (filterCondition || this.featuredURL) ? -1 : (this.isInitGridLoad ? this.postsPerPage * 2 : this.postsPerPage);
          }

          var query = '/wp-json/posts?type=work&post_status=publish&page=' + pageNum + '&filter[term]=' + filterCondition;

          var filterObject = {
            'posts_per_page': numOfPostsToLoad,
            'taxonomy': 'work-category',
            'term': filterCondition
          }

          if(this.featuredURL == ''){
            filterObject.meta_key = 'include_in_grid_dropdown';
            filterObject.meta_value = 'Yes';
          }

          console.log(filterObject);


          $.ajax({
            url: query,
            data: {
              filter: filterObject
            },
            cache: !Global.isMobile,
            dataType: 'json',
            type: 'GET',
            success: function(data, status, request) {
              console.log(data)

              var filteredData = [];
              for (var i = 0 ; i < data.length; i++) {
                   filteredData.push(data[i]);
              }

              console.log('Filtered Data', filteredData)

              if (this.featuredURL) this.sortItemsForSalesURL(filteredData);

              if (this.isInitGridLoad) {
                this.totalPosts = request.getResponseHeader('X-WP-Total');
                this.totalPages = request.getResponseHeader('X-WP-TotalPages');
                console.log('total posts:', request.getResponseHeader('X-WP-Total'));
              }

              this.curNumOfPosts = filteredData.length;

              if (!filteredData.length) {
                // no more posts to load
                this.isLoadingGridData = false;
                this.noMorePostsToLoad = true;
                return;
              }

              this.appendCells(filteredData, loadMore, filterCondition);
              this.isLoadingGridData = false;

              if (this.isInitGridLoad) this.isInitGridLoad = false;

            }.bind(this),
            error: function() {
              console.warn('Error while getting posts data via WP REST API');
            }
          });
        },

        sortItemsForSalesURL: function(data) {
          var filterData

          data.slice().forEach(function(d, i){
            var tags = d.terms['post_tag'];
            if (tags) {
              tags.forEach(function(t) {
                if (t.slug == this.featuredURL) {
                  this.topFeaturedItems.push(d);
                  data.splice(i,1);
                }
              }.bind(this));
            }
          }.bind(this));
          //console.log(this.topFeaturedItems);

          // add items to beginning of the grid
          Array.prototype.unshift.apply(data, this.topFeaturedItems);


          // data.sort(function(a, b){
          //   var tags = a.terms['post_tag'];
          //   var value = -1;

          //   if(tags){
          //     tags.forEach(function(t){
          //       if (t.slug == this.featuredURL) {
          //         value = 1;
          //       }
          //     });
          //   }

          //   return value;

          // });


        },

        appendCells: function(data, loadMore, filterCondition) {
          // append new range of cells
          var frag = document.createDocumentFragment();
          var cell;
          var currCellsArray = [];
          data.forEach(function(d) {
            cell = new Cell(d);
            frag.appendChild(cell.dom[0]);
            currCellsArray.push(cell.dom);
          }.bind(this));

          this.gridEl.append($(frag));

          // basic grid setup & resize
          this.setupGrid(loadMore, filterCondition);
          this.resizeWorkGrid();
          this.navRespond();
          this.setupClickEvents();
          this.setupMobile();
          Global.imgRespond(); // important to call after appending cells to load right size of the image!

          console.log(data.length + ' posts appended');

          if (!Global.isMobile) {
            //DESKTOP
            var startNum = (filterCondition || this.isInitGridLoad) ? 0 : this.postsPerPage * this.currPage;

            // run raf loop for checking scroll position to load more and update spinners state
            if (this.isInitGridLoad) this.checkIfNeedsLoadPosts();

            if (loadMore || filterCondition) {
              this.gridManager.animateIn(0, startNum, filterCondition);
              if (filterCondition) TweenLite.to($(window), 0, {scrollTo: 0});


            } else if (this.isFilteredAll && !loadMore) {
              // this is the case when filtering data by 'ALL' after using other filters i.e. 'installation' or initial grid load
              this.introGrid();
            }

            // hide spinners for loaded items
            this.spinnersManager.hideRangeOnLoad(startNum, startNum + data.length);

          } else {
            // MOBILE
            TweenLite.set(currCellsArray, {autoAlpha: 1, y: $('.content.grid')[0].getBoundingClientRect().height});
            TweenLite.to(this.spinnersManager.spinners[0], 0.1,{opacity: 0});

            var delay = 0.2;
            for (var i = 0; i < currCellsArray.length; i++) {
              TweenLite.to(currCellsArray[i], 0.6, {y: 0, delay: delay += 0.1, ease: Expo.easeOut,
                onComplete: function(i) {
                  if (i == currCellsArray.length - 1) this.setMobileLoadButton();
                }.bind(this, i)
              });
            }

            // close nav when filtered items start animating
            //TweenLite.to($('#category-nav ul.sub-menu'),0.6, {height: 0, ease: Expo.easeInOut});
          }
        },

        animateOutMobileLoadBtn: function() {
          var items = $('li.mix');
          var scrollPos = (items.length + 1) * items.height();
          TweenLite.set(this.gridEl, {height: scrollPos});

          TweenLite.to(this.mobileLoadMoreBtn, 0.1, {autoAlpha: 0, ease: Linear.easeNone});
          TweenLite.to(this.gridContainerElement, 1.5, {scrollTo: scrollPos, delay: 0.1});
          TweenLite.delayedCall(0, function() {
            this.getCellsData(++this.currPage, true);
            this.showMobileSpinner((items.height() / 2 - 20), 0);
          }.bind(this));
        },

        setMobileLoadButton: function() {
          this.resizeWorkGrid();
          if (this.currPage >= this.totalPages && !this.isFilteredByCategory) {
            // do not add button to the last set of posts
            return;
          }

          var grid = $('ul.content.grid');
          var items = $('ul.content.grid li.mix');
          grid.css('height', 'auto');

          var topPos = (!this.isFilteredByCategory) ? items.height()*items.length : 0;
          TweenLite.set(this.mobileLoadMoreBtn, {autoAlpha: (topPos ? 1 : 0), y: topPos});
        },

        setupMobile: function(){
          if (Global.isMobile) {
            // Show swipe animation
            this.firstSwipeArrow = $('.content.grid > li:first').find('.swipe-arrow:first');
            this.firstSwipeArrowAnimation = new TimelineLite({paused: true});
            this.firstSwipeArrowAnimation.to(this.firstSwipeArrow, 1, {width: 95, ease: Expo.easeInOut});
            this.firstSwipeArrowAnimation.to(this.firstSwipeArrow.find('.swipe-text'), 0.5, {autoAlpha: 1, ease: Linear.easeNone}, '-=0.8');
            this.playSwipeAnimationTimeout = setTimeout(this.playSwipeAnimation.bind(this), 2000);

            this.loopCheckScrollDelta();
          }
        },

        setupClickEvents: function(){

            var _this = this;

            // Set the click events for the Work Grid Links.
            $(".content.grid .image-wrapper > a").on('click', function(e){

                e.preventDefault();

                var $this = $(this);

                var $header = $this.find('header h2');
                var projectTitle = $header.text().replace(/^\s+|\s+$/g, '');

                if (_this.catNavOpen){
                    return;
                }

                // If loading content, return
                if (_this.isLoadingWorkPage){
                    return;
                }

                // Only open project if it's opened
                if (Global.isMobile && !$this.hasClass('animating')){
                    // Mobile
                    if ($this.hasClass('opened')){
                        GA.trackWorkItem(projectTitle);
                        window.location.hash = $this.data('postslug');
                        _this.closeMobieGridItem($this);
                    } else {
                        _this.swipeGridLeft.apply(this);

                        var dur = 0.3;
                        TweenLite.to($this, dur, {
                            alpha: 0.5
                            // ease: Expo.easeOut,
                        });
                        TweenLite.to($this, dur, {
                            delay: dur,
                            // ease: Expo.easeIn,
                            alpha: 1.0
                        })
                    }
                } else {
                    // Desktop
                    $('body').removeClass('cover-closed').addClass('cover-open');
                    GA.trackWorkItem(projectTitle);
                    window.location.hash = $this.data('postslug');
                }

            });

        },


        /* =================
         * Resizer functions
         * =================
         */

        onResizeHandler: function(){
            this.resizeWorkGrid();
            this.initWorkHoverEffects();
            this.navRespond();

            if(Global.isMobile){
                this.setupMobileGrid();
            }
        },

        resizeWorkGrid: function(){

            if (!Global.isMobile) {
              // DESKTOP
              if (!this.gridManager) {
                return;
              }

              var numOfCols = 3;
              if (Global.width > 1800 && this.allowFiveCols) {
                numOfCols = 5;
              } else if (Global.width > 1400) {
                numOfCols = 4;
              }

              this.numOfCols = numOfCols;

              this.gridManager.setupSize(numOfCols, 100 / numOfCols + '%');
              this.gridManager.update();

              if (Global.width !== this.lastWinWindth || this.isFilteredAll) {
                // set container height to max size to fit all existing posts
                var maxHeight = Math.ceil(this.totalPosts / numOfCols) * this.gridManager.itemHeight + $('#category-nav').height();
                this.gridContainerElement.height(maxHeight);
                console.log('set grid height:', maxHeight);
              }

              if (this.isInitGridLoad && !this.isFilteredAll) {
                // create new spinners
                this.spinnersManager = new SpinnersManager(this.totalPosts);
              } else if (this.isFilteredByCategory || this.isFilteredAll) {
                // reattach detached spinners

                if ( this.isFilteredAll) {
                  this.spinnersManager.reattach(this.totalPosts);
                }
                //this.spinnersManager.reattach(this.isFilteredAll ? this.totalPosts : this.curNumOfPosts);
              }

              if (!this.isFilteredByCategory) {
                this.spinnersManager.resize(this.gridManager.itemWidth, this.gridManager.itemHeight, numOfCols);
                this.spinnersManager.animateInViewport();
              }

              this.lastWinWindth = Global.width;

            } else {
                var imageHeight = this.getWorkItemHeight();
                var itemHeight = (Global.currentWidthType === 'tabletPortrait') ? 300 : imageHeight;

                // Set grid height
                this.gridContainerElement.css({
                    width: Global.width,
                    height: Global.windowHeight - this.gridContainerElement.offset().top
                });

                $('ul.content.grid > li a .overlay.panel header').each(function(id,item) {
                    var $item = $(item);
                    // console.log('itemHeight: ', itemHeight);
                    // console.log('$item.height(): ', $item.height());
                    // console.log('------');
                    var top = (itemHeight*0.5)-($item.height()*0.5);
                    $item.css('top', top);
                }.bind(this));

                var imgItem = $('ul.content.grid > li a img');
                if (Global.currentWidthType === 'tabletPortrait'){
                  imgItem.each(function(id,item) {
                        $(item).css({
                            position: 'relative',
                            top: -(imageHeight-itemHeight)/2
                        });
                    }.bind(this));
                }

                // if it's featured/sales URL then make non-featured items less visible
                if (this.featuredURL) {
                  imgItem.each(function(id, item) {
                    if (id > this.topFeaturedItems.length && !this.isFilteredByCategory) {
                      $(item).css({opacity: 0.2});
                    }
                  }.bind(this));
                }
            }
        },

        getWorkItemHeight: function(){
            if (Global.currentWidthType === 'tabletPortrait'){
                return (Global.width/1000)*566;
            } else {
                return (Global.width/640)*308;
            }
        },

        // Builds the nav depending on screen size
        navRespond: function() {
            var $nav = $('#category-nav.work-sorter');
            var $mainNavUl = $nav.find('ul:first');
            var $categoriesLi = $mainNavUl.find('li').filter(function() {
                var $a = $(this).children('a:first');
                return $a.length && $a.attr('href') === '#categories';
            });

            if (Global.isMobile) {
                // MOBILE
                if ($categoriesLi.length === 0) {
                    // remove the items which were spilled out from the categories
                    // menu
                    $mainNavUl.find('.fromCategoriesMenu').remove();
                    // restore the full categories item from the stored copy
                    $mainNavUl.prepend($mainNavUl.data('categoriesLi'));
                }
            } else {
                // DESKTOP
                if ($categoriesLi.length) {
                    // clone the category item's child items, give them a class so
                    // we can refer to them later and add them after the categories
                    // item
                    $categoriesLi.after($categoriesLi.children('ul:first').children().clone().addClass('fromCategoriesMenu'));
                    // remove and store the categories item
                    $mainNavUl.data('categoriesLi', $categoriesLi.remove());
                }
                if (this.gridManager){
                    $nav.css('width', this.gridManager.gridWidth);
                    // $nav.find('.dark-back:first').css('width', this.gridManager.itemWidth*3);
                }
            }

            if (Global.isMobile){
                // MOBILE
                var width = Global.width;

                $('ul.content.grid > li a').width(width*2);

                //HACK for iPad. For some reason the height needs to be set explicitly, only on iPad though.
                //If this is done on iPhone then the last element gets cut off
                if (Global.currentWidthType === 'tabletPortrait') {
                    this.gridEl.width(width).css("height", Global.height);
                    this.gridContainerElement.width(width).css("height", Global.height);
                }

            }
        },


        /* =================
         * Desktop functions
         * =================
         */


        // See: setupMobileGrid
        setupGrid: function(loadMore, filteringCondition){
            if (this.isSetup && !loadMore && !filteringCondition) {
              return;
            }

            this.gridItems = $('.content.grid li.mix');

            $('header.main-header').removeClass('cloak');

            this.gridItems
                .css("display", "block")
                .css("position", "absolute");

            if (!Global.isMobile) {
                //Desktop
                this.gridManager = new GridManager(this.gridEl, this.gridItems);

                Global.onGridFilter.add(function(filterCondition) {
                    this.isFilteredByCategory = (filterCondition !== 'mix_all');
                    this.isFilteredAll = !this.isFilteredByCategory;

                    this.gridEl.empty();
                    this.spinnersManager.detach();
                    TweenLite.to($(window), 0, {scrollTo: 0});

                  if (!this.isFilteredByCategory) {
                      // filtered by 'ALL' or init posts loading
                      this.resetGridData();
                      this.getCellsData();
                    } else {
                      // fill up the grid with filtered items
                      this.gridContainerElement.css('height', 'auto');

                      // as long as we do not know how many posts will be in the response yet
                      // we create only one (first) loader for filtering
                      //this.spinnersManager.reattach(1, true);
                      //this.spinnersManager.spinners[0].css({left: 10, top: 100});
                      //this.spinnersManager.spinners[0].addClass('is-spinning');

                      this.getCellsData(1, false, filterCondition);
                    }
                  }.bind(this));
            }

            this.navRespond();
            this.initWorkHoverEffects();

            // Play the Navigation Intro Animation
            if (!loadMore && !filteringCondition && !this.isFilteredAll) this.introNav();

            // HANDLE RESIZE
            // This gets called on resize, after Global sets up the correct responsive image URLs
            // make sure to add this listener only once to avoid extra calls
            if (!this.respImgListenerSet) {

              this.respImgListenerSet = true;

              Global.onResponsiveImgsSrcSet.add(function() {
                console.log('onResponsiveImgsSrcSet');
                if (!Global.isMobile && this.gridManager){
                  // DESKTOP ONLY
                  this.gridManager.update();
                } else {
                  this.gridItems.css('opacity', 1);
                }
                _.defer( this.onResizeHandler );
              }.bind(this));
            }

            this.isSetup = true;
        },

        animateInGrid: function() {
            //this.gridItems.css({opacity:1});
            if (!Global.isMobile) {
                // Desktop INITIAL LOAD or FILTER 'ALL'
                this.gridManager.update();
                this.gridManager.animateIn(0, 0, false, this.topFeaturedItems.length);
            }
        },

        animateCategoryNav: function(onCompleteThis){
            var _this = this;

            this.categoryNavTimeline = new TimelineLite({paused:true, delay:0.5, onComplete:onCompleteThis});

            var dark = $('.dark-back:first');

            this.categoryNavTimeline.add( TweenLite.fromTo(dark, 0.7, {scaleX:0, transformOrigin:"top left"}, {scaleX:1, transformOrigin:"top left", ease: Expo.easeInOut } ) );

            var liHeight = $('#category-nav ul li:first').height();
            $('#category-nav ul li').each(function(){
                var $that = $(this);
                _this.categoryNavTimeline.fromTo($that, 0.5, {y:-liHeight, opacity:0}, {y:0, opacity:1, ease: Expo.easeOut}, "-=0.4");
            });

            this.categoryNavTimeline.play();
        },

        introGrid: function(){
            // Animate the grid
            this.animateInGrid();

            // Enable filters
            $('li > a.filter').on('click', function(e){
                if(!$(this).hasClass('active')){
                    if (_this.gridManager.animatingGrid){
                        return;
                    }
                    var filterName = $(this).attr('data-filter');
                    _this.onFilter(filterName);

                    $(this).parent().siblings().find('a.filter').removeClass('active');
                    $(this).addClass('active');
                }

                e.preventDefault();
            });

            _this.navWidth = $('#category-nav ul').width();
        },

        initWorkHoverEffects: function(){
            //Direction Aware Hover
            if (Global.isMobile){

                this.gridItems.removeData('mousedirection');
                $('.content.grid > li .image-wrapper').off('mouseenter.hoverdir, mouseleave.hoverdir');
                //Load panel drag if tabletPortrait or smaller
            } else {
                //Load mouser enter direction code if larger than tabletPortrait
                var wrapperHeight = 0;
                $('.content.grid > li .image-wrapper').each(function(index, el) {
                    var $this = jQuery(el);
                    if (index === 0){
                        wrapperHeight = $this.height();
                    }
                    $this.hoverdir();
                    $this.find('.panel,a').css("width", "");
                    var header = $this.find('.panel header');
                    var headerHeight = header.height();
                    header.css({
                        height: headerHeight,
                        marginTop: -headerHeight*0.5
                    });
                });
            }
        },

        onFilter: function(filter) {
            if (!Global.isMobile) {
                // DESKTOP
                //resize the grid, incase something else has changed the thumb size
                //(like the left-side menu)
                this.gridManager.update();
                //now filter it
                this.gridManager.filter(filter);
            }
        },




        /* ================
         * Mobile functions
         * ================
         */

        setupMobileGrid: function(first) {
            this.categoryNav.off('click').on('click', 'a[href="#categories"]', this.openMobileCategoryNav.bind(this) );
            $('#category-nav .sub-menu a').off('click').on('click', this.clickMobileCategoryNav.bind(this) );
            //var itemHeight = $('ul.content.grid > li').outerHeight();

            $('ul.content.grid > li').each(function(index, item) {
                var a = $(item).find('a:first-child');
                // OFF
                //var dragMinDistance = 40;
                //if (Util.support.isAndroid){
                //    dragMinDistance = 10;
                //}

                $(item).on('click',this.swipeGridLeft.bind(this, a[0]));
                this.hammertime = Hammer(a[0]);
                this.hammertime.on('swipeleft', this.swipeGridLeft.bind(this, a[0]));
                this.hammertime.on('swiperight', this.swipeGridRight.bind(this, a[0]));
                // var header = a.find('.overlay.panel header');
                // var headerHeight = header.outerHeight();
                // header.css('top', _this.getWorkItemHeight()*0.5-headerHeight*0.5);
                // Fade in work items
                if (first && !Global.newHash){
                    TweenLite.to(item,0.4,{opacity: 1, delay: 0.1*index, ease: Linear.easeNone});
                }
            }.bind(this));

            // make the ALL filter selected
            if (!this.isFilteredByCategory) this.categoryNav.find('a[data-filter="mix_all"]').parent().addClass('active');
        },

        swipeGridLeft: function(target) {

            var target = $(target);
            if (target.hasClass('opened') || target.hasClass('animating')){
                return;
            }

            console.log('swipeGridLeft');

            // Find open sibilings
            var $openSiblings = $('.content.grid li a.opened');
            target.addClass('opened');

            // Cancel swipe animation timeout
            if (_this.playSwipeAnimationTimeout){
                clearTimeout( _this.playSwipeAnimationTimeout );
            }
            var delay = 0;
            if ($openSiblings.length > 0){
                delay = 0.1;
            }
            // close siblings
            $openSiblings.each(function(index, el){
                if (this != el){
                    _this.closeMobieGridItem( $(el) );
                }
            }.bind(this) );
            TweenLite.delayedCall(delay, _this.openMobileGridItem, [target]);
        },

        swipeGridRight: function(target) {
            var target = $(target);
            _this.closeMobieGridItem(target);
        },

        closeMobieGridItem: function($this){
            if (!$this.hasClass('opened')) return;
            var $img = $this.find('img');
            var time = 0.4;
            TweenLite.to($this, time, {x: 0, ease: Expo.easeIn, onComplete:function(){
                 $this.removeClass('opened');
                 $this.removeClass('animating');
            }});

            // iOS8 seems to fail flipping the image while animating it on swipe through transform matrix
            // at least on some devices (iPad mini, 4S)
            if (Global.isIOS8) {
                console.log('iOS8 closeMobieGridItem()');
                TweenLite.to($img, 0.3, {left: 0, ease: Expo.easeIn});
            } else {
                TweenLite.to($img, 0.3, {x: 0, ease: Expo.easeIn});
            }

            //TweenLite.to($img, 0.3, {x: 0, ease: Expo.easeIn});
            var arrow = $this.find('.swipe-arrow:first');
            TweenLite.to(arrow, 0.2, {width: 45, overwrite:1});
            TweenLite.to(arrow, time, {x: 0, ease: Expo.easeIn});
        },

        openMobileGridItem: function($this){
            var $img = $this.find('img');
            var time = 0.4;
            $this.addClass('animating');
            TweenLite.to($this, time, {x: -Global.width, ease: Expo.easeIn, onComplete: function(){
                $this.removeClass('animating');
            } });
            var arrow = $this.find('.swipe-arrow:first');
            TweenLite.to(arrow, time, {x: -Global.width, ease: Expo.easeIn});
            //TweenLite.to($img, time-0.1, {x: 30, delay: 0, ease: Expo.easeIn});

            // iOS8 seems to fail flipping the image while animating it on swipe through transform matrix
            // at least on some devices (iPad mini, 4S)
            if (Global.isIOS8) {
                console.log('iOS8 openMobileGridItem()');
                TweenLite.to($img, time-0.1, {left: 30, delay: 0, ease: Expo.easeIn});
            } else {
                TweenLite.to($img, time-0.1, {x: 30, delay: 0, ease: Expo.easeIn});
            }

            TweenLite.to(arrow, time, {width: 200, ease: Expo.easeOut});
            if (arrow.hasClass('swipe-text-visible')){
                TweenLite.to( arrow.find('.swipe-text'), 0.5, {autoAlpha:0, overwrite:1} );
                arrow.removeClass('swipe-text-visible');
            }
        },


        loopCheckScrollDelta: function(){

            setTimeout( this.loopCheckScrollDelta, 1000 );
            var scroll = this.gridContainerElement.scrollTop();
            if (Math.abs(this.lastScrollTop - scroll) > 30){
                var $openSiblings = $('.content.grid li a.opened');
                if ($openSiblings.length){
                    // close all open items
                    $openSiblings.each(function(index, el){
                        _this.closeMobieGridItem( $(el) );
                    } );
                }
            }
            this.lastScrollTop = scroll;
        },


        playSwipeAnimation: function() {
            this.firstSwipeArrow.addClass('swipe-text-visible');
            this.firstSwipeArrowAnimation.play();
        },

        hideFirstSwipeCTA: function() {
            this.firstSwipeArrowAnimation.reverse();
            this.firstSwipeArrowAnimation.play();
        },

        introNav: function(){
            if (!Global.isMobile){
                // DESKTOP
                TweenLite.set( $('#category-nav ul:first'), {opacity:1} );
                this.animateCategoryNav(this.introGrid);
            } else {
                // MOBILE
                this.setupMobileGrid(true);
            }
        },

        openMobileCategoryNav: function(e) {

            e.preventDefault();
            //if (this.isLoadingGridData) {
            //  return;
            //}

            if (this.catNavOpen){
                // close this mofo
                this.closeMobileCategoryNav();
                return false;
            }
            this.catNavOpen = true;

            this.gridContainerElement.on('click', this.closeMobileCategoryNav.bind(this));
            var ul = $('#category-nav ul.sub-menu');
            ul.css({'height': 0, 'max-height': 'none'});

            // Get needed height
            var liHeight = ul.find('> li:first').outerHeight();
            var numMenuItems = ul.find('> li').length;
            var fullHeight = numMenuItems*liHeight;

            // Menu height
            var menuButOffset = this.categoryNav.offset().top;
            var menuButHeight = this.categoryNav.height();
            var availableWindowHeight = Global.windowHeight - menuButHeight - menuButOffset;

            var shortestHeight = Math.min(fullHeight, availableWindowHeight);
            // Animate
            TweenLite.to(ul, 0.5,{height: shortestHeight, ease: Expo.easeInOut});
            TweenLite.to(this.gridContainerElement, 0.5, {y: shortestHeight, ease: Expo.easeInOut, overwrite: true});

            // Add a touchstart listener to ul.content.grid so that it closes the menu
            if (Global.isMobile){
                this.gridEl.on('touchstart', this.closeMobileCategoryNav);
            }

            return false;
        },

        clickMobileCategoryNav: function(e) {
          e.preventDefault();

          var $item = $(e.currentTarget);
          var filter = $item.attr('data-filter');
          this.isFilteredByCategory = (filter && filter !== 'mix_all');
          this.isFilteredAll = !this.isFilteredByCategory;

          if (this.prevMobileFilter != filter) {
            // Scroll to top
            TweenLite.to(this.gridContainerElement, 0.5, {scrollTop: 0, ease: Expo.easeOut});
            TweenLite.set(this.mobileLoadMoreBtn, {autoAlpha: 0});

            this.gridEl.empty();
            if (!this.isFilteredByCategory) this.resetGridData();
            this.getCellsData(1, false, (!this.isFilteredByCategory ? false : filter));
            this.prevMobileFilter = filter;
          } else {
            this.prevMobileFilter = filter;
            this.closeMobileCategoryNav();
            return;
          }

          // Show hide work items based on filter
          /*this.gridItems.each(function() {
           if (filter=='mix_all' || $(this).hasClass(filter)){
           $(this).show();
           } else {
           $(this).hide();
           }
           });
           */
          console.log('FILTER', filter);

          // Set active filter in menu
          $('ul.sub-menu li').each(function(index, el) {
            var $li = $(el);
            var $a = $li.find('a:first');
            var thisFilter = $a.attr('data-filter');
            if (thisFilter == filter) {
              $li.addClass('active');
            } else {
              $li.removeClass('active');
            }
          });

          this.closeMobileCategoryNav();
          // Scroll to top
          TweenLite.to($('main.front-page')[0], 0.7, {scrollTop: 0, ease: Expo.easeInOut});
          return false;
        },

        closeMobileCategoryNav: function(e) {
            if (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
            // Turn off touchstart event
            if (Global.isMobile){
                this.gridEl.off('touchstart', _this.closeMobileCategoryNav);
            }

            this.gridContainerElement.off('click');
            TweenLite.to($('#category-nav ul.sub-menu'),0.5, {height: 0, ease: Expo.easeInOut});
            TweenLite.to(this.gridContainerElement, 0.5, {y: 0, ease: Expo.easeInOut, onComplete: function() {
              this.gridContainerElement.css('transform','');
              this.showMobileSpinner(($(window).height()/2 - 30), 0.1);
            }.bind(this) });
            this.catNavOpen = false;
        },

        showMobileSpinner: function(pos, delay) {
          TweenLite.set(this.spinnersManager.spinners[0], {bottom: pos});
          TweenLite.to(this.spinnersManager.spinners[0], 0.3, {opacity: 1, delay: delay||0});
        }

    });

    return Grid;
});
