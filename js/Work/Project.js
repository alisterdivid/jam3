define(['Class', 'jquery', 'TweenLite', 'TimelineLite', 'Global', 'ui/FadeIn', 'Modernizr', 'swipe', 'jquery.hoverdir', 'jquery.hammer', 'pace', 'ui/VideoControls', 'underscore', 'ui/RotateHandler', 'libjs/utils/Util', 'utils/GA', 'Work/Gallery', 'Work/FullscreenGallery', 'Signal'],
function(Class, $, TweenLite, TimelineLite, Global, FadeIn, Modernizr, Swipe, hoverdir, Hammer, Pace, VideoControls, _, RotateHandler, Util, GA, Gallery, FullscreenGallery, Signal) {

    _this = null;

    var Project = new Class({


        scrollingDistance: null,

        coverColour: "#ffffff",
        isLoadingWorkPage: null,

        // Timelines
        toolScrollTimeline: null,
        posterTimeline: null,

        // Element properties
        posterHeight: null,
        posterWidth: null,
        posterContainerHeight: null,
        posterContainerWidth: null,

        rightNavHeight: null,

        titleOffset: null,

        previousIsMobile: false,
        isPosterMode: true,

        postNavShiftValue: 100,

        gallery: null,

        initialize: function(featuredURL){

            _this = this;

            this.featuredURL = featuredURL;
            if (featuredURL) {
              this.onProjectShown = new Signal();
            }

            $('html').css("overflow-y", "scroll");

            FullscreenGallery.init();

            // Bind some functions to this Class
            this.resizePoster = this.resizePoster.bind(this);
            this.mouseWheelHandler = this.mouseWheelHandler.bind(this);
            this.setupWorkIntro = this.setupWorkIntro.bind(this);
            this.setupCoverScrollUp = this.setupCoverScrollUp.bind(this);
            this.setNavPosition = this.setNavPosition.bind(this);
            this.posterImageLoaded = this.posterImageLoaded.bind(this);
            this.mainResizeHandler = this.mainResizeHandler.bind(this);
            this.pauseVideo = this.pauseVideo.bind(this);

            this.mouseWheelHandlerDebounced = this.mouseWheelHandler; // _.debounce(this.mouseWheelHandler, 100); No reason to debounce since we have to preventDefault on mouse wheel

            // Track the last Global.isMobile to determine if there is a change from mobile to desktop or the other way around
            this.previousIsMobile = Global.isMobile;

            // Setup JS functionality for the Project
            this.setupSmoothScroll();

            // RESIZE handlers

            if (!Global.isMobile) $(window).on('resize', this.resizePoster);
            // Main resize handler
            $(window).on('resize', this.mainResizeHandler);

            // Fixing some issues with Posters between breakpoints
            //$(window).on('resize', this.switchToMobile.bind(this));

            this.setupClickEvents();

            // jQuery Plugins
            // Utility function that calulates width of Text - using it for animation of keyline
            $.fn.textWidth = function(){
                var html_org = $(this).html();
                var html_calc = '<span>' + html_org + '</span>';
                $(this).html(html_calc);
                var width = $(this).find('span:first').width();
                $(this).html(html_org);
                return width;
            };


            // If Project is loaded directly from WordPress
            if($('main.single-work').length>0){
                if (Global.isMobile){
                    $('#posterContainer video').remove();
                }
            }

            // If a Video exists setup the Controls for it.
            if ($('.video-player').length > 0) {
                new VideoControls($('.video-player').last());
            }

        },

        mainResizeHandler: function(){
            if (this.previousIsMobile != Global.isMobile){
                // AHA changed width
                if (Global.isMobile) {
                    // MOBILE
                    //console.log('Changed to MOBILE');
                    if (this.isPosterMode){
                        // Refresh the page
                        window.location.reload(false);
                    } else {
                        this.posterTimeline.progress(1);
                        $(window).off('scroll', this.setupCoverScrollUp);
                    }
                } else {
                    // DESKTOP
                    //console.log('Changed to DESKTOP');
                }
            }

            $windowWidth = $(window).width();
            $postNavigationWidth = $('.post-navigation-wrap').width();
            this.setNavPosition($windowWidth, $postNavigationWidth);

            if (!Global.isMobile){
                // DESKTOP

            } else {
                // MOBILE
            }
            // Need to change if this ahs changed
            this.previousIsMobile = Global.isMobile;
        },

        // Utils
        setHeight: function(selector, padding, centered){
            var height = Math.max($(window).height(), 400);
            selector.height(height - padding);

            if(centered == 'centered'){
                selector.find('div:first-child').css({top: '50%', bottom: "auto", position: "absolute", marginTop: -selector.first().height()*0.5});
            }
        },

        scrollStop: function(e){
            e.stopPropagation();
            e.preventDefault();
            //return false;
        },

        centerCoverTitle: function($target){

            //console.log(parseInt($target.find('.content').css('padding-top')));

            // Centers the Cover Title
            var $entryTitle = $target.find('.entry-title');
            var titleY = parseInt($target.find('.content').css('padding-top')) + ($target.find('.poster-image').height() + $target.find('.big-header').height())*0.5;

            //console.log(!Global.isMobile,$('body').hasClass('cover-open') );

            if(!Global.isMobile && !$('body').hasClass('cover-closed')){
                //console.log('BING');
                TweenLite.set($entryTitle, {y: -titleY});
            }

        },

        // INIT functions
        setupClickEvents: function(){
            $('body').on('click','.post-nav a', function(e){
                // _this.loadWorkContent($(this).parent(), 'animate');
                _this.toggleMainHeaderVisibility(false, 0.5);
                window.location.hash = $(this).parent().data('postslug');
                e.preventDefault();
            });
        },
        setupFadeIn: function(){
            //FadeIn accepts multiple jQuery selectors as arguments
            var faders = new FadeIn($('div.module-item'), $('.module-item li').not('.multiple_images li, .seamless-images li'), $('.multiple_images:first li, .seamless-images li:first'), $('.module h2.callout'), $('.module header h3.has-icon'), $('.image-gallery'), $('.gallery-lower'), $('a.btn'), $('.module .line'));
        },

        setupSmoothScroll: function() {
            // Smooth scroll to links
            $('main').on('click', 'a.smooth-scroll', function(e) {
                e.preventDefault();
                var target = $(this.hash);
                if (target.length === 0){
                    target = $('html');
                }
                $('html, body, main').animate({ scrollTop: target.offset().top }, 500);
            });

            $('main').on('click','a.scroll-top', function(e) {
                e.preventDefault();
                $('html, body, main').animate({ scrollTop: 0 }, 500);
            });

            // Smooth scroll for single work nav
            $('main').on('click', 'a.nav-scroll', function(e) {
                var target = $(this.hash);
                if (target.length === 0){
                    target = $('html');
                }
                if (Global.isMobile) {
                    _this.hideMobilePoster();
                    $('html, body, main').animate({ scrollTop: target.position().top }, 500);
                } else {
                    $('html, body').animate({ scrollTop: target.find('h3.has-icon').offset().top - ($(window).height() * 0.2) }, 500);
                }
                $('.loadedContent article').removeClass('blurred');
                e.preventDefault();
            });
        },

        setupToolScroll: function(){

            if (Global.isMobile) return;
            // DESKTOP ONLY

            this.toolScrollTimeline = new TimelineLite({paused:true});
            var $rightNav = $('.rightNav');
            var $body = $('body');
            var scrollHeight = $body[0].scrollHeight;
            var iconHeight = $('.rightNav ul li:not(.close)').height();
            var initialScrollTop = $('body').scrollTop();
            var animatingRightNav = false;
            var iconSpacing = 40;
            var $allNavIcons = $('.rightNav ul li:not(.close)');

            this.rightNavHeight = (($allNavIcons.length-1) * iconSpacing) + (iconHeight * $allNavIcons.length);
            console.log('this.rightNavHeight: ', this.rightNavHeight);

            // Offsets the expanded nav from top
            var minY = 150;
            // Calculated the expanded nav height
            var expandedHeight = Global.windowHeight - minY*2;

            // Set the height/top of right nav
            TweenLite.set($rightNav, {height: this.rightNavHeight, top:(Global.windowHeight/2-this.rightNavHeight/2), onComplete: function(){
                TweenLite.to($rightNav, 0.5, {autoAlpha: 1});
                console.log('WOAH?')

                if (this.featuredURL) {
                  // hide prev/next navigation because it won't follow custom/featured order
                  $('.post-navigation-wrap').hide();
                }
            }.bind(this)});

            var lastScrollPosTitle = '';

            // Get the y position of section headers
            var scrollIconPercentages = [];
            var sectionOffsets = [];
            var sectionHeaders = [];
            var sectionTitles = [];
            var sectionIcons = [];
            var firstOffsetY = 0;
            var articleHeight = $('article.work:has(section)').outerHeight();
            $('section.module.has-header').each(function(i){
                var $this = $(this);
                //var $section = $this.closest('section');
                //if ($section.hasClass('related-posts')) return; // Skip if related projects
                // Get section ID
                var id = $this.attr('id');
                $this.data('id', id);
                sectionHeaders[i] = $this;
                sectionTitles[i] = $this.data('title');
                sectionIcons[i] = $('.nav-scroll[href="#' + id + '"]');
                sectionOffsets[i] = $this.offset().top;
                scrollIconPercentages[i] = sectionOffsets[i] / articleHeight;
                if (i === 0){
                    // Make sure the first offset is always 0
                    firstOffsetY = scrollIconPercentages[i];
                    scrollIconPercentages[i] = 0;
                } else {
                    // Correct the offset
                    scrollIconPercentages[i] -= firstOffsetY;
                }
            });
            // Normalize percentages, last percentage is probably around 0.8, we need it to be 1
            // So scale up all the percentages
            var percentageScale = 1/scrollIconPercentages[scrollIconPercentages.length-1];
            scrollIconPercentages = scrollIconPercentages.map(function(val){
                return val*percentageScale;
            });

            // Setup initial spacing
            $allNavIcons.each(function(i){
                var $this = $(this);
                TweenLite.set($this, { y:(iconSpacing*i)});
            });

            // Animates the Scrolling Nav Items back to default.
            var scrollEnd = function(){
                //console.log('vingoheight',_this.rightNavHeight);
                $('.rightNav ul li:not(.close):not(first-child)').each(function(i){
                    var $this = $(this);
                    TweenLite.to($this, 0.8, { y: iconSpacing*i, ease: Expo.easeInOut, delay: 0.1  });
                });
                $('.nav-scroll').removeClass('over');
                TweenLite.to($rightNav, 0.8, {height: _this.rightNavHeight, delay:0.1, top:(Global.windowHeight/2-_this.rightNavHeight/2), ease:Expo.easeInOut, onComplete:function(){
                    animatingRightNav = false;
                }});
            };
            var scrollEndTimeout = null;

            // Animates the position of the Scrolling Nav items
            var scrollToolPosition = function(){

                // If the user stopped scrolling, call scrollEnd
                if (scrollEndTimeout){
                    clearTimeout(scrollEndTimeout);
                }
                scrollEndTimeout = setTimeout( scrollEnd, 2000 );

                // If already animating, return
                //if (animatingRightNav) return;

                _this.scrollingDistance = $(document).scrollTop();
                var windowHeight = Global.windowHeight;
                // Calculate expanded height of the right nav
                expandedHeight = windowHeight - minY*2 - (($allNavIcons.length-1)*iconHeight);

                // Roll out
                var rollOutTime = 0.8;
                animatingRightNav = true;
                $allNavIcons.each(function(i){
                    var $this = $(this);
                    TweenLite.to($this, rollOutTime, { y:scrollIconPercentages[i] * expandedHeight, ease:Expo.easeOut});
                });
                TweenLite.set($('.rightNav'), {height: "100%"});
                TweenLite.to($rightNav, rollOutTime, { top:minY, ease:Expo.easeOut, onComplete:function(){
                    animatingRightNav = false;
                }});

                // console.log('------');
                var adjustedScrollingDistance = _this.scrollingDistance+150; // Adjust the scrolling trigger
                // console.log('adjustedScrollingDistance: ', adjustedScrollingDistance);
                var marked = false;
                var $markedSectionIcon = null;
                for (var i = sectionHeaders.length-1; i >= 0; i -= 1) {
                    // console.log('sectionOffsets['+i+']: ', sectionOffsets[i]);
                    var $sectionHeader = sectionHeaders[i];
                    var id = $sectionHeader.data('id');
                    var $icon = sectionIcons[i];
                    if (marked){
                        $icon.removeClass('over');
                        continue;
                    }
                    if (_this.scrollingDistance + windowHeight >= scrollHeight){
                        // If we can't scroll anymore mark the last element
                        if (!$icon.hasClass('over')){
                            $icon.addClass('over');
                            $markedSectionIcon = $icon;
                        }
                        marked = true;
                        continue;
                    }
                    if (adjustedScrollingDistance >= sectionOffsets[i]){
                        if (!$icon.hasClass('over')){
                            $icon.addClass('over');
                            $markedSectionIcon = $icon;
                        }
                        marked = true;
                    } else {
                        $icon.removeClass('over');
                    }
                }

                if ($markedSectionIcon){
                    var title = $markedSectionIcon.data('title');
                    if (lastScrollPosTitle != title){
                        GA.trackEvent('ScrollTools', _this.projectTitle.toLowerCase(), title);
                    }
                }

                // console.log('--------');

            };

            // There's no OFF for these but there's a check for Global.isMobile in each of these callbacks
            $(window).on('scroll', _.debounce(scrollToolPosition, 20));

            $(window).on('resize', function(){
                TweenLite.to($rightNav, 0.5, {top:(Global.windowHeight/2-_this.rightNavHeight/2), ease:Expo.easeInOut});
            });

        },

        /* ================
         * RESIZE functions
         * ================
         */

        tabletRotated: function(landscape) {
            console.log("HANDLING ROTATE");
            if (!landscape){
                this.resizePoster();
            }
        },

        resizePoster: function() {

            // var windowHeight = $(window).height();

            this.posterSubContainer = $('.loadedContent.onTheWayIn section.cover.open #posterContainer');
            this.posterContainer = $('.loadedContent.onTheWayIn .poster-image');


            if (Global.isMobile){
                // MOBILE
                $('.loadedContent.onTheWayIn #posterContainer, .loadedContent.onTheWayIn #posterContainer img').css('width','100%');

                this.setHeight($('.loadedContent.onTheWayIn .poster-image'), 0.65 * $(window).height(), 'centered');

                $(window).off('scroll', _this.setupCoverScrollUp );

            } else {
                // DESKTOP POSTER CONTAINER
                var $body = $('body');

                if(!$body.hasClass('cover-closed')){

                    this.posterContainerWidth = $body.width();

                    this.setHeight($('.loadedContent.onTheWayIn .poster-image'), 80);

                    this.posterContainerHeight = $('.loadedContent.onTheWayIn .poster-image').height();

                    if (this.posterContainerWidth / 1.76678445229682 <= this.posterContainerHeight){
                        this.posterWidth =  (this.posterContainerHeight * (1.76678445229682));
                        this.posterHeight = (this.posterWidth / (1.76678445229682));
                    } else {
                        this.posterHeight = (this.posterContainerWidth / (1.76678445229682));
                        this.posterWidth =  (this.posterHeight * (1.76678445229682));
                    }


                    $('.loadedContent.onTheWayIn #posterContainer, .loadedContent.onTheWayIn #posterContainer img').height(this.posterHeight);
                    $('.loadedContent.onTheWayIn #posterContainer').width(this.posterWidth);

                    this.posterContainer.has('open').css({
                        marginRight: -100,
                        marginLeft: -100,
                        width: "auto",
                        display: "block"
                    });


                    // Vertically center title on .poster-image
                    this.centerCoverTitle($('.loadedContent.onTheWayIn'));

                }
            }

        },

        hideMobilePoster: function() {
            if (Global.isMobile) return;

            if (this.mobilePosterHidden) return;
            this.mobilePosterHidden = true;
            var h = $('#posterContainer img').height();
            TweenLite.to($('.poster-image'),0.8,{height: 0, ease: Expo.easeIn, overwrite: true});
            TweenLite.to($('#posterContainer img'),0.8,{marginTop: -h*0.5, ease: Expo.easeIn, overwrite: true});
            // TweenLite.to($('.loadedContent#onTheWayIn .content, main.article .content').first(),0.8,{'margin-top': 0, ease: Expo.easeIn, overwrite: true});
            TweenLite.to($('a.down-arrow'),0.5,{autoAlpha: 0, overwrite: true});
        },

        showMobilePoster: function() {
            if (Global.isMobile) return;

            if (!this.mobilePosterHidden || $('main').scrollTop()>0) return;
            this.mobilePosterHidden = false;
            var h = $('#posterContainer img').height();
            TweenLite.to($('.poster-image'),0.8,{height: h, ease: Expo.easeIn, overwrite: true});
            TweenLite.to($('#posterContainer img'),0.8,{marginTop: 0, ease: Expo.easeIn, overwrite: true});
            // TweenLite.to($('.loadedContent#onTheWayIn .content, main.article .content').first(),0.8,{'margin-top': toHeight+20, ease: Expo.easeIn, overwrite: true});
            TweenLite.to($('a.down-arrow'),0.5,{autoAlpha: 1, delay: 0.1, overwrite: true});
        },


        toggleMainHeaderVisibility: function(isVisible, duration) {
            duration = duration || 0;
            TweenLite.to($('.main-header'), duration, {autoAlpha: isVisible ? 1: 0});
        },


        /* ========================
         * CONTENT LOADING FUNCTION
         * ========================
         */

        setupWorkIntro: function($loadedContentOnTheWayIn){

            console.log('Project.setupWorkIntro');

            var $loadedContent = $('.loadedContent');

            // Set LoadedContent to Top
            if (Global.isMobile) $loadedContentOnTheWayIn.css('top',$('main').scrollTop());

            this.projectTitle = $loadedContentOnTheWayIn.find('h1.big-header').text().replace(/^\s+|\s+$/g, '');

            Global.initResponsiveImages();
            Global.widthRespond();



            this.resizePoster();

            $loadedContentOnTheWayIn.find('section.cover').addClass('open');

            // Setup next/previous button gogole analytics
            $loadedContentOnTheWayIn.find('.post-nav').on('click touchstart', function(e){
                var projectName = this.dataset.postTitle;
                GA.trackEvent('Navigation', 'WorkClick', projectName.toLowerCase());
            });

            if (!Global.isMobile) {
                // DESKTOP

                // Thsi should only happen for desktop
                $loadedContentOnTheWayIn.css('overflow', 'visible');

                // Set height
                // console.log($loadedContentOnTheWayIn.find('.content').innerHeight());
                // $loadedContentOnTheWayIn.css('height', $loadedContentOnTheWayIn.find('.content').height());

                // set up Poster animation timeline
                this.setupPosterAnimation();

                $('html').css('overflow-x', 'hidden');
                $('body').addClass('cover-open');
                $('body').removeClass('cover-closed');

                this.titleOffset = null;

                this.coverColour = $loadedContentOnTheWayIn.find('section.cover').data('colour');

                $loadedContentOnTheWayIn.css("opacity", 0);

                TweenLite.set($('.main-header' ),{ clearProps: "zIndex" });
                TweenLite.set($('.rightNav'), {autoAlpha: 0, position: 'fixed'});

                var $fauxHeader = $loadedContentOnTheWayIn.find('#fauxHeader');
                TweenLite.set($fauxHeader.find('#header-inner'), {x: -$(window).width()-100});

                // Set the color according to the CMS
                TweenLite.set($fauxHeader.find('h4'), {color: _this.coverColour});
                TweenLite.set($fauxHeader.find('.nav-back-arrow i'), {color: _this.coverColour});
                TweenLite.set([$fauxHeader.find('.hamburger .line'), $fauxHeader.find('.nav-vertical-line')], {backgroundColor: ((_this.coverColour == '#ffffff')? "#f2f2f2" : _this.coverColour)});
                TweenLite.set([$loadedContentOnTheWayIn.find('.big-header'), $loadedContentOnTheWayIn.find('.entry-title h2')],{ color: _this.coverColour});
                TweenLite.set($loadedContentOnTheWayIn.find('.entry-title'),{color: _this.coverColour});

                // If the color is black then add a class to .blog-title
                if(this.coverColour == "#000000") $fauxHeader.find('.blog-title a').addClass('black');


                    // Remove grey from .content
                TweenLite.set([$loadedContentOnTheWayIn.find('.content'), $loadedContentOnTheWayIn.find('article.work')], {backgroundColor: "#fff"});

                // Vertically center title on .poster-image
                // this.centerCoverTitle($loadedContentOnTheWayIn);

                _this.setupFadeIn(); // setup listener on scroll event, to fade in elements as they reach above the fold

                $loadedContentOnTheWayIn.find('.down-arrow').off('click').on('click', function(){
                    
                    this.arrowLocked = true;
                    TweenLite.set($('.down-arrow span i.white'), {autoAlpha: 0, delay: 0.5, display: 'none'});
                    TweenLite.set($('.down-arrow span i.icon-caret-down, .down-arrow span i.icon-caret-up'), {y: 0});
                    
                    setTimeout(function() {
                        this.arrowLocked = false;
                        $(this).removeClass('hover');
                        TweenLite.set($('.down-arrow span i.white'), {autoAlpha: 0, delay: 0, display: 'none'});
                        TweenLite.set($('.down-arrow span i.icon-caret-down, .down-arrow span i.icon-caret-up'), {clearProps: 'all'});
                    }.bind(this), 1200);

                    if ( _this.posterTimeline.progress() === 0){
                        _this.setForwardArrowAnimation();
                        _this.posterTimeline.play();
                        GA.trackEvent('Page View', 'WorkClick', _this.projectTitle.toLowerCase());
                    } else if (_this.posterTimeline.progress() == 1){
                      // REVERSE POSTER ANIMATION

                      // toggle classes now. doing it on complete causes animation bugs
                      $('body').addClass('cover-open');
                      $('body').removeClass('cover-closed');
                      $('section.cover').toggleClass('open');

                      // scroll to top and lock to avoid weird poster scale
                      TweenLite.to($('body'), 0, {scrollTo:0});
                      $(window).off('mousewheel DOMMouseScroll', _this.mouseWheelHandlerDebounced).on('mousewheel DOMMouseScroll', _this.mouseWheelHandlerDebounced);

                      TweenLite.killTweensOf($('.rightNav'));
                      TweenLite.set($('.rightNav'), {right: -63, y: -100});
                      TweenLite.to($('.rightNav'), 0.5, {autoAlpha: 0});

                      _this.setReverseArrowAnimation();
                      _this.posterTimeline.reverse(0, true);
                    }
                });


                // Sets the position of the Next/Prev nav buttons at window widths below 1280.

                $windowWidth = $(window).width();
                $postNavigationWidth = $('.post-navigation-wrap').width();

                // Post navigation mouse over analytics
                // Just do this once since mouse over is called many times because of children elements, those pesky children!
                $loadedContentOnTheWayIn.find('.post-nav').one('mouseover', function(e){
                    var projectName = this.dataset.postTitle;
                    GA.trackEvent('Interaction', 'PrevNextWorkHover', projectName.toLowerCase());
                });

                // Track tool scroll clicks
                $loadedContentOnTheWayIn.find('.rightNav').on('click', 'a.nav-scroll', function(e){
                    GA.trackEvent('ScrollTools', this.dataset.title, _this.projectTitle.toLowerCase());
                });

                // Track related projects click
                $loadedContentOnTheWayIn.find('.related-posts').on('click', 'a.related-post-link', function(e){
                    var title = this.dataset.title;
                    GA.trackEvent('Navigation', 'RelatedWorkClick', title.toLowerCase() + ' from ' + _this.projectTitle.toLowerCase());
                });

                // Track related projects hover
                $loadedContentOnTheWayIn.find('.related-posts a.related-post-link').one('mouseover', function(e){
                    var title = this.dataset.title;
                    GA.trackEvent('Interaction', 'RelatedWorkHover', title.toLowerCase());
                });

                // Track see all awards
                $loadedContentOnTheWayIn.find('.awards-btn').on('click', function(e){
                    GA.trackEvent('Navigation', 'SeeAllAwards', _this.projectTitle.toLowerCase());
                });

                // Track visit site link
                $loadedContentOnTheWayIn.find('.site-link').on('click', function(e){
                    GA.trackEvent('ExternalLink', 'ViewSite', _this.projectTitle.toLowerCase());
                });

                this.setNavPosition($windowWidth, $postNavigationWidth);

                $(window).off('mousewheel DOMMouseScroll', _this.mouseWheelHandlerDebounced).on('mousewheel DOMMouseScroll', _this.mouseWheelHandlerDebounced);

                $(window).on('keydown', function(e){
                    if( e.keyCode == 40 || e.keyCode == 38 || e.keyCode == 32 || e.keyCode == 33 || e.keyCode == 34 || e.keyCode == 35){
                        e.preventDefault();
                        return false;
                    }
                });


            } else {
                // Mobile
                TweenLite.set($loadedContentOnTheWayIn, {x: Global.width});

                _this.gallery = new Gallery($loadedContentOnTheWayIn, _this);

                _this.mobilePosterHidden = false;
                // $('.loadedContent#onTheWayIn .content, main.article .content').first().css('margin-top',20+$('#posterContainer img').height());
                $loadedContentOnTheWayIn.find('a.down-arrow').click(_this.hideMobilePoster.bind(_this));

                // var hammer = new Hammer($loadedContentOnTheWayIn.add('main.single-work')[0]);
                // hammer.on('swipeup',_this.hideMobilePoster.bind(_this));
                // hammer.on('swipedown',_this.showMobilePoster.bind(_this));
                // hammer.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
                //
                // $('.loadedContent#onTheWayIn').css('left',Global.width);
                // TweenLite.to($('.loadedContent#onTheWayIn'),0.5,{left: 0, ease: Expo.easeOut});

                $('body').addClass('cover-closed');
                $('body').removeClass('cover-open');

                // Hide looping Video in Work content if on mobile.
                $('#posterContainer video').remove();
                var videoHeight = $loadedContentOnTheWayIn.find('.video-player').width() / 1.76678445229682;
                $loadedContentOnTheWayIn.find('.video-player video').height( videoHeight );

                $loadedContentOnTheWayIn.find('div.callout').css('opacity',1);
            }

            if ($loadedContentOnTheWayIn.find('.video-player').length > 0){
                new VideoControls($('.video-player').last(), this.projectTitle.toLowerCase());
                //console.log($('.video-player').first());
            }

            // window.location.hash = postSlug;

            // Chek if poster image is loaded
            var $posterImg = $loadedContentOnTheWayIn.find('.poster-image img:first');
            var posterImgElement = $posterImg[0];
            // check if already loaded
            if (posterImgElement.complete){
                _this.posterImageLoaded();
            } else {
                $posterImg.one('load', _this.posterImageLoaded);
            }

        },

        posterImageLoaded: function(){
            Global.loadingFinishedSignal.dispatch();
            _this.animateInCover();
        },

        setNavPosition: function(windowWidth, postNavWidth){

            this.postNavShiftValue = Math.ceil((windowWidth - postNavWidth)*0.5);

            console.log(this.postNavShiftValue);

            if(!Global.isMobile){
                if(windowWidth <= 1280 && $('body').hasClass('cover-open')){
                    $('.post-navigation-wrap .prev-post').css('left', -this.postNavShiftValue)
                    $('.post-navigation-wrap .next-post').css('right', -this.postNavShiftValue)
                } else {
                    TweenLite.set($('.post-navigation-wrap .prev-post'), {clearProps: 'left'});
                    TweenLite.set($('.post-navigation-wrap .next-post'), {clearProps: 'right'});
                }
            }


        },

        animateInCover: function(){
            var $loadedContentOnTheWayIn = $('.loadedContent.onTheWayIn:not(.onTheWayOut)');

            if(!Global.isMobile){
                var textWidth = $loadedContentOnTheWayIn.find('.big-header').textWidth();
                TweenLite.set($loadedContentOnTheWayIn.find('.keyline-work'), {"width": textWidth, backgroundColor: _this.coverColour});
            }

            TweenLite.to($loadedContentOnTheWayIn, 0.8, {x: 0, delay: 0.5, ease: Expo.easeInOut, onComplete: _this.coverEndCallback.bind(_this) });
            TweenLite.to($loadedContentOnTheWayIn, 0.2, {opacity: 1, delay: 0.6, ease: Expo.easeIn});
            TweenLite.to($loadedContentOnTheWayIn.find('#fauxHeader #header-inner'), 0.5, {x:0, delay: 0, ease: Expo.easeInOut, clearProps: "x" });
        },

        loadWorkContent: function(postSlug){
            console.log('postSlug: ', postSlug);

            Global.loadingStartedSignal.dispatch();

            // loading work page flag
            _this.isLoadingWorkPage = true;

            var ajaxurl = "/wp-content/themes/jam3/custom-ajax.php";

            $.ajax({

             type: 'GET',
             url: ajaxurl,
             cache: false,
             async: true,
             dataType: 'html',
             data: {
                 action: 'load-work',
                 postSlug: postSlug
             },

            success: function(response) {
                var toY = (!Global.isMobile) ? -100 : 0;

                GA.setPageID('work_page');

                _this.isLoadingWorkPage = false;

                var $loadedContent = $('.loadedContent');


                 if (Global.isMobile){
                     // Close all opened grid items
                     setTimeout( function(){
                         $(".content.grid .image-wrapper > a.opened").each(function(index, el){
                             _this.closeMobieGridItem($(el));
                         });
                     }, 1000 );

                 }

                 // Check if there's already an article loaded
                 if ($loadedContent.find("article").length){

                     var $loadedContentOnTheWayOut = $('.loadedContent.onTheWayIn');
                     $loadedContentOnTheWayOut.addClass("onTheWayOut");
                     $loadedContentOnTheWayOut.removeClass("onTheWayIn");
                     $loadedContentOnTheWayOut.after('<div class="loadedContent onTheWayIn"></div>');
                     // Re-cache this one since we've added a new #onTheWayIn div
                     var $loadedContentOnTheWayIn = $('.loadedContent.onTheWayIn:not(.onTheWayOut)');
                     TweenLite.set($loadedContentOnTheWayIn, {x: Global.width, y: toY});
                     $loadedContentOnTheWayIn.html(response);

                    // TweenLite.set($loadedContentOnTheWayIn, {zIndex: 1030, overflow: "visible"});
                     TweenLite.set($loadedContentOnTheWayIn, {zIndex: 1030});

                     $('body').addClass('cover-open');
                     $('body').removeClass('cover-closed');

                 } else {
                     var $loadedContentOnTheWayIn = $('.loadedContent.onTheWayIn');
                     TweenLite.set($loadedContentOnTheWayIn, {x: Global.width, y: toY});
                     $loadedContent.html(response);
                 }

                 // IF/ELSE Statement to check if the post image/video is set. If not then don't load the Project.
                 if ($loadedContentOnTheWayIn.find('.poster-image img, .poster-image video').length > 0){
                     _this.setupWorkIntro($loadedContentOnTheWayIn);
                 } else {
                     // Fallback in case there is no Poster Image or Video
                     $('.loadedContent.onTheWayIn').empty();
                     //Grid.onResizeHandler();
                     window.location.replace(window.location.pathname);
                 }

                if (this.featuredURL) {
                  // hide prev/next navigation because it won't follow custom/featured order
                  $('.post-navigation-wrap').hide();
                }

                $('.down-arrow').on('mouseenter',function() {
                    console.log('enter')
                    !this.arrowLocked && $(this).addClass('hover');
                })

                $('.down-arrow').on('mouseleave',function() {
                    console.log('leave')
                    !this.arrowLocked && $(this).removeClass('hover');
                })

            }.bind(this)

            });

         },

         setupCoverScrollUp: function(){
            if (Global.isMobile) return;
            var scrollTop = document.body.scrollTop;
                  if(scrollTop < -5 && Global.coverAnimating == false ){
                //console.log('reversePosterAnimation', this.reversePosterAnimation);
                this.posterTimeline.reverse(0, true);
            }
         },

         fixHeader: function(){
             var styles = {
                 '-webkit-backface-visibility': 'hidden',
                 '-webkit-transform': 'translateZ(0)'
             }
             // $("#fauxHeader").css("position", "absolute");
             $("#fauxHeader").css(styles);

             // Change main title
             var title = $('.loadedContent.onTheWayIn').find('.big-header').text().replace(/^\s+|\s+$/g, '');

             // console.log('fixHeader');

            $('.main-header .work-title .inner-holder').html(title);
            //$('.main-header .nav-button-text').css('width', '75%');
            $('header.main-header').removeClass('cloak');

            Global.animateHeaderTitle();

             // Make WORK clickable
             $('.nav-button-text')
                 .addClass('clickable')
                 .off('click')
                 .on('click', function(e){
                    e.preventDefault();
                    //window.location.href = '/work';
                    // Make sure that the next project doesn't open in closed mode
                    window.location.hash = '';
                 });

         },

        coverEndCallback: function(){

            _this.fixHeader();
            _this.toggleMainHeaderVisibility(false, 0);

            TweenLite.set($('.grid-container, #category-nav'), {autoAlpha: 0});

            $('.loadedContent.onTheWayOut').remove();
            // Hide work items
            $('.grid-container ul.grid li.mix').css('visibility','hidden');

            $('main > article:first').remove();

            $('.module.related-posts .overlay header').each(function(){
                var $this = $(this);
                $this.height($this.height());
                $this.css({'bottom': 0});
            });

             var $loadedContent = $('.loadedContent.onTheWayIn');
             TweenLite.to($loadedContent, 0, {x: 0, clearProps: "zIndex", delay: 0.1, onComplete: function() {
                 _this.toggleMainHeaderVisibility(true, 0);
             }});
             console.log('set the X to 0 and st');

            // set up Poster animation timeline
            if (!Global.isMobile) {
                // DESKTOP
                this.setupPosterAnimation();

              if (this.featuredURL) {
                this.onProjectShown.dispatch();
              }
            } else {
                // MOBILE
               
                $loadedContent.css('top',0);
                TweenLite.set($loadedContent, {clearProps:'transform'});
                $('main').scrollTop(0);

                // iOS 8 scrolling fix
                if (Global.isIOS8) {
                    $('.grid-container').hide();
                    console.log('iOS8 coverEndCallback');
                }
            }

            // $('.main-header h4').html('<span><a href="/work/">WORK</a> / </span>'+postName); //insert main header under #loaded Content

        },

        pauseVideo: function(){
            var $video = $('#posterContainer video');
            if ($video.length>0) $video[0].pause();
        },

        playVideo: function(){
            var $video = $('#posterContainer video');
            if ($video.length>0) $video[0].play();
        },

        setupPosterAnimation: function(){

            if (Global.isMobile) this.posterContainerHeight = $(window).height() * 0.8;

            this.posterTimeline = new TimelineLite({paused:true, 
                onStart: function(){
                },
                onComplete: function(){

                    console.log('ON COMPLETE');

                    Global.coverAnimating = false;
                    _this.isPosterMode = false;

                    this.titleOffset = null;

                    $('body').removeClass('cover-open');
                    $('body').addClass('cover-closed');

                    $('section.cover').toggleClass('open');

                    TweenLite.set($('.post-navigation-wrap'),{ position: "fixed", top: "100px", clearProps: "all"});
                    TweenLite.set($('.prev-post a, .next-post a, .prev-post, .next-post'), {delay: 0.2, clearProps: 'width'});
                    TweenLite.set($('.loadedContent .content'), {clearProps: "paddingTop"});

                    TweenLite.set($('.poster-image'), {clearProps: "height"});
                    //TweenLite.set($('#posterContainer'), {clearProps: "height,width"});
                    TweenLite.set($('.entry-title' ),{clearProps: "transform"});
        
                    TweenLite.set($('.loadedContent'), {clearProps: "transform"});
                    TweenLite.set($('.rightNav'), {clearProps: "right, transform"});

                    _this.pauseVideo();

                    // Setup Event listeners
                    $(window).off('scroll', _this.pauseVideo).on('scroll', _this.pauseVideo);
                    $(window).off('scroll', _this.setupCoverScrollUp).on('scroll', _this.setupCoverScrollUp);
                    $(window).off('mousewheel DOMMouseScroll');

                    _this.resizePoster();
                    $(window).off("resize", _this.resizePoster);

                    $windowWidth = $(window).width();
                    $postNavigationWidth = $('.post-navigation-wrap').width();

                    _this.setNavPosition($windowWidth, $postNavigationWidth);


                    // TweenLite.set($('#posterContainer, #posterContainer img'), {clearProps: "height,width"});
                    // TweenLite.set($('#posterContainer img'), {"max-width": "100%", "width": "100%"});

                    //_this.setupFadeIn(); // setup listener on scroll event, to fade in elements as they reach above the fold
                    _this.gallery = new Gallery($('.loadedContent'), _this);
                    // For easy testing
                    //_this.gallery.magnify();

                    _this.setupToolScroll();

                    _this.posterTimeline.pause();

                  TweenLite.set($('ul.content.grid'),{background: 'transparent'});

            }, onReverseComplete: function(){

                console.log('ON REVERSE COMPLETE');

                Global.coverAnimating = false;
                _this.isPosterMode = true;

                this.titleOffset = null;

                _this.setupFadeIn(); // setup listener on scroll event, to fade in elements as they reach above the fold

                // Handing over animated styles attributes over to a CSS class.
                $('body').addClass('cover-open');
                $('body').removeClass('cover-closed');

                $('section.cover').toggleClass('open');

                // $('.rightNav').css({"top": "auto", "bottom": "13px", "height": "auto"});

                TweenLite.set($('.post-navigation-wrap'),{ clearProps: "top,position,width,left,right"});

                _this.playVideo();

                $(window).off('mousewheel DOMMouseScroll', _this.mouseWheelHandlerDebounced).on('mousewheel DOMMouseScroll', _this.mouseWheelHandlerDebounced);
                $(window).off('scroll', _this.setupCoverScrollUp);
                $(window).off('resize', _this.resizePoster).on('resize', _this.resizePoster);

                // TweenLite.set($('.prev-post a, .next-post a, .prev-post, .next-post'), {delay: 0.2, clearProps: 'width'});

                _this.posterTimeline.pause();

             }});

             this.posterTimeline.timeScale(2);
             this.posterTimeline
                .add(function(){
                 Global.coverAnimating = true;

                 TweenLite.to($('.rightNav'), 0.1, {autoAlpha: 0, clearProps: "transform"});

                 _this.pauseVideo();
                 TweenLite.set($('.post-navigation-wrap'),{position: "absolute", top: 0, left: 0, right: "auto", width: "100%"});

                }, 0)

                .to($('.content, article.work'), 1, {backgroundColor: "#f7f7f7"},0)

                .to($('#floatBubble' ),1,{top: -12, ease: Expo.easeInOut}, 0)

                .set($('.rightNav ul li a'), {clearProps: "color"}, 0)

                .to($('.keyline-work' ),2.5,{width: 40, ease: Expo.easeInOut}, 0)
                .fromTo($('#posterContainer img'),1.8, {marginTop: 0, immediateRender: false}, {marginTop: -100, ease: Expo.easeInOut },0)

                .fromTo($('.loadedContent'), 2, {y: -100},{y: 0, ease: Expo.easeInOut, immediateRender: false}, 1)
                .to($('#fauxHeader'), 2, {y: -100, ease: Expo.easeInOut}, 1)

                .to($('.post-navigation-wrap'),2,{ top: -100, ease: Expo.easeInOut}, 1)

                //.to($('.poster-image'), 1.3, {height: this.posterContainerHeight-100, ease: Expo.easeIn},1)
                .to($('.poster-image'), 2,{height:50, ease: Expo.easeInOut}, 1)

                .fromTo($('.prev-post, .next-post'), 1.5,{width: 190, immediateRender: false},{width: 140, ease: Expo.easeOut }, 1) //marginLeft: 0,
                //.fromTo($('.prev-post a, .next-post a'), 1.5,{width: 40}, {width: 140, ease: Expo.easeOut }, 1) //marginLeft: 0,

                .fromTo($('.poster-image'), 1.5, {marginLeft: -100, marginRight: -100}, {marginLeft: 0, marginRight: 0, ease: Expo.easeInOut},1)


                //.fromTo($('.prev-post'), 1.5,{left: -100, immediateRender: false}, {left: 0, ease: Expo.easeInOut}, 1) //Linear.easeNone
                //.fromTo($('.next-post'), 1.5,{right: -100, immediateRender: false}, {right: 0, ease: Expo.easeInOut}, 1)

                .to($('#fauxHeader'), 0.2, {opacity:0, ease: Expo.easeIn},2)
                .set($('.main-header' ), {backgroundColor: "#fff", zIndex: 1031, clearProps: "zIndex"},1.5)



                .to($('.prev-post a, .next-post a, .prev-post, .next-post'), 1.5, {"width": 40, ease: Expo.easeInOut,
                 onComplete: function(){
                     $('#floatBubble').toggleClass('icon-landscape');
                     $('.down-arrow span i').toggleClass('icon-caret-up');
                 },
                 onReverseComplete: function(){
                     $('#floatBubble').toggleClass('icon-landscape');
                     $('.down-arrow span i').toggleClass('icon-caret-up');
                 }
                }, 2.5)

                .to($('.entry-title' ),1.5,{y: 0, ease: Expo.easeInOut}, 1.50)

                .to($('.entry-title h2' ),1.5,{y: 0, ease: Expo.easeInOut}, 1.55)
                .to($('.loadedContent .content'), 1.5, {paddingTop: 120}, 1.55)

                .to($('.keyline-work' ),1.5,{y: 0, backgroundColor: "#dddddd", ease: Expo.easeOut}, 2.25)

                .to($('.big-header'),0.75 ,{color: "#242524", ease: Expo.easeInOut}, 2)
                .to($('.entry-title h2'), 0.75, {color: "#a4a4a4", ease: Expo.easeInOut}, 2)
                .to($('.pubdate'),1,{"opacity": 0.75,  ease: Expo.easeInOut, onComplete: function(){
                 $(window).trigger("scroll");
                 }
                },2)

                

                .fromTo($('div.callout'), 2, {"opacity":0}, {"opacity":1, ease: Expo.easeOut}, 2.5)
                .to($('.down-arrow'), 1, {"bottom": -60, ease: Expo.easeInOut}, 3.55)
                .to($('.down-arrow span i'), 1, {bottom: 35, ease: Expo.easeInOut}, 3.75)
                .to($('#floatBubble' ),1,{top: -80, ease: Expo.easeInOut}, 4.00)
                .set($('#fauxHeader'), {y: -400}, 4.00)
                //.set($('.loadedContent.onTheWayIn article.work'), {css:{'overflow-x': 'hidden'}},3.00)

                // Functions fired at the beinging of the animation.
                .add(function(){
                    Global.coverAnimating = true;

                    $('body').addClass('cover-open');
                    $('body').removeClass('cover-closed');

                    _this.pauseVideo();
                    $('html body').animate({ scrollTop: "0"});

                    TweenLite.set($('.rightNav'), {autoAlpha: 0});

                    TweenLite.set($('.post-navigation-wrap'),{position: "absolute", left: 0, top: -100, right: "auto", width: "100%"});
                    TweenLite.set($('.post-nav.prev-post'), {left: 0});
                    TweenLite.set($('.post-nav.next-post'), {right: 0});

                    $(window).off('scroll', _this.setupCoverScrollUp);

                });
         },

         setForwardArrowAnimation: function() {
           TweenLite.to($('.prev-post'), 0.9, {left: 0, ease: Expo.easeInOut, delay: 0.4});
           TweenLite.to($('.next-post'), 0.9, {right: 0, ease: Expo.easeInOut, delay: 0.4});
         },

         setReverseArrowAnimation: function() {
           TweenLite.set($('.prev-post'),{left: 0});
           TweenLite.set($('.next-post'),{right: 0});

           var offset = Math.min( Math.round($(window).width()*0.5 - $('.loadedContent article.work').width()*0.5), 100);
           var start = (window.innerWidth < 1120) ? 0 : -offset;
           TweenLite.to($('.prev-post'), 0.6,{left: start, ease: Expo.easeInOut, delay: 1.33});
           TweenLite.to($('.next-post'), 0.6,{right: start, ease: Expo.easeInOut, delay: 1.33});
         },

         mouseWheelHandler: function(e){
            if (Global.isMobile) return;
            e.preventDefault();
            var paused = this.posterTimeline.paused();
            if (paused){
                this.setForwardArrowAnimation();
                this.posterTimeline.play();
                GA.trackEvent('Page View', 'WorkScroll', _this.projectTitle.toLowerCase());
            }
            return false;
         }

    });

    return Project;


});
