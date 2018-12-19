define(['Class', 'jquery', 'pace', 'Global', 'Work/Grid', 'Work/Project', 'utils/GA', 'TweenLite', 'Signal'],function(Class, $, Pace, Global, Grid, Project, GA, TweenLite, Signal){

    var _this = null;

    var Grid;
    var Project;

    var Router = new Class({

        newHash: null,
        currentHash: null,
        path: null,
        startMobile: false,

        initialize: function(){
            // Redirect to project page with hash instead of second level url.
            // solves grid not existing when navigation to project without hash.
            if(Global.secondLevelLocation) {
                location.replace('/work/#' + Global.secondLevelLocation);
            }

            // check if current url as a 'sales link' and grid is in 'featured mode',
            // meaning work grid has custom sorting and look
            var param = location.search.split('?')[1];
            var featuredURL = (param && param.indexOf('featured-for') !== -1) ? param : false;
            this.featuredURL = featuredURL;

            Grid = new Grid(featuredURL);
            Project = new Project(featuredURL);

            if (featuredURL) {
              Project.onProjectShown.add(this.toggleFeaturedTitle.bind(this,false));
              this.toggleFeaturedTitle(true);
            }

            GA.setPageID('work');

            _this = this;

            this.currentHash = window.location.hash;
            this.path = window.location.pathname.split( '/' );

            // Listen for the hashghange event and change the Work Project based on the hash.
            this.changePage();
            $(window).on('hashchange', this.changePage.bind(this));

            // Get hash value for use in the code.
			if ( this.currentHash.length > 1 ){
				Global.newHash = this.currentHash.replace('#','');
			} else if(Global.secondLevelLocation !== '' && Global.secondLevelLocation !== undefined){
				// No grid setup on work particles
			} else {
				//Grid.setupGrid();
		    }

            var scrollStop = function(e){
				e.stopPropagation();
				e.preventDefault();
				//return false;
			};

            if(Global.isMobile){
                this.startMobile = true;

                $window = $(window);

                $window.on('resize', function(e){
                    if($window.width() >= 1020 && this.startMobile === true){

                        window.location.reload();
                    }
                }.bind(this));

            }

            // Pace functions
            Pace.start({
                document: false
            });

            Pace.on('start', function(){
                Global.isLoading = true;
            });

            Pace.on('done', function(){
                Global.isLoading = false;
            });

            // Project loading cover
            Global.loadingFinishedSignal.add(function(){
                $(window).off("mousewheel DOMMouseScroll",scrollStop);
                TweenLite.to($('#menu-content-overlay'), 0.4, {autoAlpha: 0, ease: Linear.easeNone});
            });
            Global.loadingStartedSignal.add(function(){
                TweenLite.to($('#menu-content-overlay'), 0.3, {autoAlpha: 1, ease: Linear.easeNone});
                $(window).off( "mousewheel DOMMouseScroll");
                $(window).on("mousewheel DOMMouseScroll",scrollStop);
            });

        },

        toggleFeaturedTitle: function(showClient, delay) {
          if (!this.featuredURL) {
            return;
          }

          TweenLite.delayedCall(delay || 0, function() {
            var txt = showClient ? ('WORK / ' + this.featuredURL.replace(/-/g, ' ')) : 'WORK';
            var title = $(".nav-button-text span:contains('WORK')");
            title.text(txt);
          }.bind(this));
        },

        // Fires when the hash is changed.
        changePage: function(e) {
            var initial = (!e);
            var hash = window.location.hash.replace("#","");

            if (hash !== '') {
                // have hash
                if (initial) {
                    // Hide content until work loads, since the url could contain a project /work/ad-blitz/#concerto
                    $('main.single-work article:first').css('visibility', 'hidden');
                    $('.rightNav').remove();

                }
                if ($(".loadedContent article").length === 0){
                    $('main.single-work').append('<div class="loadedContent onTheWayIn"></div>');

                    $('.rightNav').remove();
                }

                if($('.onTheWayIn section.cover.open').length == 0){
                    TweenLite.to($('.onTheWayIn'), 0.3, {opacity: 0});
                    //console.log('cover is not open');
                }
                TweenLite.set($(window), {delay: 0.3, scrollTo: {y: 0, x: 0, autoKill: true}});

                Project.loadWorkContent(hash);

                if (Global.isMobile) {
                  Grid.toggleScrollTouch();
                }

            } else {
                // Hash is empty

                GA.setPageID('work');

                // remove scroll blocker on going back to grid after project
                $(window).off('mousewheel DOMMouseScroll', Project.mouseWheelHandlerDebounced);

                $('header.main-header').removeClass('cloak');

                if ($("main.single-work .loadedContent.onTheWayIn article").length){

                    var toY = (!Global.isMobile) ? -100 : 0;

                    var $loadedContentOnTheWayIn = $('.loadedContent.onTheWayIn');
                    TweenLite.set($loadedContentOnTheWayIn, {x: Global.width, y: toY});
                    TweenLite.set($loadedContentOnTheWayIn, {"z-index": 1030, overflow: "visible"});

                    // Setup the Project Cover
                    Project.setupWorkIntro($loadedContentOnTheWayIn);

                } else if ($(".loadedContent article").length) {

                	// Show grid

                    // Make sure the back arrow doesn't show up in the nav
                    $('header.main-header .nav-button-text').removeClass('clickable');
                    // Remove slash after WORK
                    // $('header.main-header .work-title-slash').css('visibility', 'hidden');
                    // Remove work title
                    // $('header.main-header .work-title .inner-holder').html('');
                    Global.animateHeaderTitle(0,true);

                    this.toggleFeaturedTitle(true, 1.7);

                    // SHow categories
                    $('#category-nav').css('visibility', 'visible');

                    var $loadedContentOnTheWayIn = $('.loadedContent.onTheWayIn');

                    // fix for flashing grid behind the project on animate out
                    var del = (!Global.isMobile  && window.innerWidth < 1280) ? 1.2 : 0;
                    TweenLite.to(('.grid-container, #category-nav'), 0.1,{'opacity': 1, 'display': 'block', visibility: 'visible', delay: del});

                    $(".content.grid .image-wrapper > a").each(function() {
                        $(this).css('transform','');
                    });

                    $loadedContentOnTheWayIn.addClass("onTheWayOut");
                    $loadedContentOnTheWayIn.removeClass("onTheWayIn");

                    TweenLite.killTweensOf($('.rightNav'));

                    if (!Global.isMobile) {
                      TweenLite.set($('.rightNav'), {autoAlpha: 0});
                      TweenLite.to($('.post-navigation-wrap'), 0.2, {autoAlpha: 0, delay: 0.8});
                    }

                    var $loadedContentOnTheWayOut = $('.loadedContent.onTheWayOut');

                    $loadedContentOnTheWayOut.after('<div class="loadedContent onTheWayIn"></div>');

                    $('.content.grid li.mix').css({opacity:1});

                    TweenLite.to($loadedContentOnTheWayOut, 0.5, {x: -$(window).width(), delay: 1, ease: Expo.easeInOut, onComplete: function() {
                        $loadedContentOnTheWayOut.remove();
                        // Reset cover-open
                        $('body').removeClass('cover-closed').addClass('cover-open');
                    }});

                    if (Global.isMobile) {
                        // MOBILE
                        TweenLite.set($('.grid-container, #category-nav'), {autoAlpha: 1});
                        $('.grid-container ul.grid li.mix').css('visibility','visible');

                        Grid.toggleScrollTouch();
                        Grid.gridContainerElement.css('height', 'auto');

                    } else {
                        // DESKTOP
                        $('.grid-container ul.grid li.mix').css('visibility','visible');
                        Grid.setupGrid();
                        Grid.gridManager.update();
                    }
                }
            }
        }

    });

    return Router;


});