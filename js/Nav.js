define(['Class', 'jquery', 'TweenLite', 'TimelineLite', 'Global', 'lib/LibJS/signals/Signal', 'libjs/utils/Util', 'utils/GA'], function (Class, $, TweenLite, TimelineLite, Global, Signal, Util, GA) {

    var _this;

    var Nav = new Class({

        navTimelineOpen: null,
        navTimelineClose: null,
        buttonProps: {
            "startWidth": 20,
            "endWidth": 255,
        },

        initialize: function () {
            var menuItems = $('.menu-wrap .main-nav li');
            var reelItem;

            _this = this;
            Global.nav = this;
            this.onClosed = new Signal();
            this.onOpened = new Signal();

            this.animateOutMenu = this.animateOutMenu.bind(this);
            this.animateInMenu = this.animateInMenu.bind(this);

            if (Global.currentWidthType == 'mobile') {
                this.buttonProps.endWidth = 150;
                $('.blog-title a').addClass('mobile');
            }

            this.clickHandlerBound = this.clickHandler.bind(this);

            // Main Nav Sliding Functionality
            //If we are not on desktop, then also make the text clickable

            if (Global.isMobile) {
                $('#menu-click-area').on('touchend click', this.clickHandlerBound);
                $(document).on('touchend click', '#menu-content-overlay', this.clickHandlerBound);
            } else {
                // Desktop
                $(document).on('touchend click', '.nav-button, #menu-content-overlay', this.clickHandlerBound);
                $('body.home').on('touchend click', '.nav-button-text', this.clickHandlerBound);

                menuItems.each(function(id, item){
                    if(item.firstChild.innerHTML.toUpperCase() === 'REEL') {
                        reelItem = item;
                    }
                });

                if(reelItem) {
                    reelItem.parentNode.removeChild(reelItem);
                }
            }

            // Trigger entry-title animation on corresponding thumbnail hover
            $('.news-wrap article .image-wrapper').on('hover'), function () {
                console.log('hoveriiiing');
            }

            $(document).on('click', '.main-nav a', function (e) {
                var that = this;
                Global.onNavItemClicked.dispatch();

                _this.animateOutMenu();
                TweenLite.to($('main[role="main"]'), 0.9, {
                    opacity: 0, ease: Expo.easeOut, onComplete: function () {
                        window.location.href = $(that).attr('href');
                    }
                });
                e.preventDefault();
            });

            // menu social links
            $('.main-footer').find('a').click(function (e) {
                var isAccessibilityLink = $(event.target).hasClass('accessibility');
                if (isAccessibilityLink) {
                    var that = this;
                    _this.animateOutMenu();
                    TweenLite.to($('main[role="main"]'), 0.9, {
                        opacity: 0, ease: Expo.easeOut, onComplete: function () {
                        window.location.href = $(that).attr('href');
                        }
                    });
                    e.preventDefault();
                } else {
                    window.open($(e.target).parent().attr('href'), '_blank');
                }
            });

            if (!Global.isMobile) {
                var scrollNavFunction = function () {
                    TweenLite.to($('.post-navigation-wrap'), 0.3, {'top': $(this).scrollTop() + "px"});
                    TweenLite.set($('.post-navigation-wrap .post-nav'), {'top': ($(window).height()) * .5})
                }
                //	$(window).scroll(_.debounce(scrollNavFunction, 10));
            }

            // Prevent content interaction when the menu is out
            $('#menu-content-overlay')
                .on('touchmove', function (e) {
                    e.preventDefault();
                });
            // Prevent default on touch move
            $('.menu-wrap')
                .on('touchmove', function (e) {
                    e.preventDefault();
                });

            Global.onResize.add(this.resized.bind(this));

            $('body').on('click', 'a[href*="mailto:"], a[href*="tel:"]', function () {
                Global.noBeforeUnload = true;
            });


        },

        clickHandler: function (ev) {
            ev.stopPropagation();
            if (Global.isLoading != true) {
                if (!Global.menuOpen) {
                    _this.animateInMenu();
                } else {
                    _this.animateOutMenu();
                }
            }
            ev.preventDefault();
        },

        getSlideItems: function () {
            return [
                $('#map-right')[0],
                $('#content-wrap')[0],
                // $('#particles')[0],
                $('footer#news-footer')[0]
            ];
        },

        getMenuHideAmount: function () {
            //TODO: gonna have to double check these values to make sure they line up with all the breakpoints...
            if (Global.currentWidthType == 'mobile') {
                return 281;
            } else if (Global.currentWidthType == 'tabletPortrait') {
                return 281;
            } else {
                return 281;
            }
        },

        getSlideDistance: function () {
            if (Global.currentWidthType == 'mobile') {
                return 281;
            } else if (Global.currentWidthType == 'tabletPortrait') {
                return 281;
            } else if (Global.currentWidthType == 'tabletLandscape') {
                return 281;
            }
            else {
                return 182;
            }
        },

        stopScroll: function (e) {
            e.stopPropagation();
            e.preventDefault();
        },

        // CLOSE menu
        animateOutMenu: function (delay) {
            if (!Global.menuOpen) return;

            delay = delay || 0;
            var slideDuration = 0.3;
            var slideEase = Expo.easeOut;

            if (Global.isMobile) {
                TweenLite.to($('.main-header'), slideDuration, {x: 0, ease: slideEase});
            }

            $(document).on("mousewheel DOMMouseScroll", _this.stopScroll);

            var items = this.getSlideItems();

            TweenLite.to(items, slideDuration, {
                x: 0, ease: slideEase, delay: delay, clearProps: "transform", onComplete: function () {
                    _this.navExposed();
                }
            });

            TweenLite.to($('#fauxHeader #header-inner'), 0.5, {
                x: 0, ease: slideEase, delay: delay
            });


            TweenLite.to($('.menu-wrap'), slideDuration, {
                x: -this.getMenuHideAmount(), ease: slideEase, delay: delay
            });
        },

        // OPEN menu
        animateInMenu: function (delay) {
            if (Global.menuOpen) return;

            // TweenLite.set($('.menu-wrap'), {
            //     height: window.innerHeight
            // });

            // GA tracking
            var action = 'MenuClick';
            var label = '';
            switch (GA.pageID) {
                case 'home':
                    action = 'IntroClick';
                    label = 'on Intro';
                    break;
                case 'work':
                    label = 'Work';
                    break;
                case 'about':
                    label = 'About';
                    break;
                case 'work_page':
                    label = 'WorkPage';
                    break;
                case 'process':
                    label = 'Process';
                    break;
                case 'news':
                    label = 'News';
                    break;
                case 'news_page':
                    label = 'NewsPage';
                    break;
                case 'achievements':
                    label = 'AchievementsPage';
                    break;
                case 'contact':
                    label = 'ContactPage';
                    break;
                case 'careers':
                    label = 'Careers';
                    break;
                case 'reel':
                    label = 'Reel';
                    break;
                case 'careers_page':
                    label = 'CareersPage';
                    break;
            }
            GA.trackEvent('OpenMenu', action, label);
            // END GA Tracking

            delay = delay || 0.2;

            // force content on GPU
            $('#content-wrap').addClass('gpu');

            //mark the nav as exposed so the content can slide right
            this.navExposed();

            var slideDuration = 0.5;
            var slideEase = Expo.easeInOut;
            var slideDistance = this.getSlideDistance();

            if (Global.isMobile) {
                // TweenLite.to($('.main-header'), slideDuration, {x: 240, ease: slideEase, delay: delay});
            }

            var menuWidth = $('.menu-wrap').width();
            var itemDelay = delay + 0.2;
            $('.menu-wrap .main-nav li').each(function (id, item) {
                // var offset = (id==0) ? '-=0.05' : '-=0.45';
                TweenLite.fromTo(item, 0.5,
                    {x: -10, opacity: 0, ease: Quint.easeOut},
                    {x: 0, opacity: 1, ease: Quint.easeOut, delay: itemDelay});

                itemDelay += 0.045;
            }.bind(this));


            var items = this.getSlideItems();

            // Fixing Fixed elements when menu animates out.
            TweenLite.set($('.main-header, .rightNav'), {position: "absolute", top: $(window).scrollTop()});


            TweenLite.to(items, slideDuration, {
                x: slideDistance, ease: slideEase, delay: 0
            });
            // Main content and nav
            TweenLite.to($('.menu-wrap'), slideDuration, {
                x: 0, ease: slideEase, delay: 0
            });
            TweenLite.to($('#fauxHeader #header-inner'), 0.5, {
                x: 20, ease: slideEase, delay: 0
            });


            itemDelay = delay + 0.4;
            $('.main-footer .social-links li').each(function (id, item) {
                TweenLite.fromTo(item, 0.5,
                    {y: 20, opacity: 0, ease: Quint.easeOut},
                    {y: 0, opacity: 1, ease: Quint.easeOut, delay: itemDelay});

                itemDelay += 0.045;
            }.bind(this));

            itemDelay = delay + 0.8;
            $('.main-footer .site-info p').each(function (id, item) {
                TweenLite.fromTo(item, 0.5,
                    {x: -10, opacity: 0, ease: Quint.easeOut},
                    {x: 0, opacity: 1, ease: Quint.easeOut, delay: itemDelay});
                itemDelay += 0.045;
            }.bind(this));
        },

        resized: function () {
            // console.log(Global.width, Global.windowHeight);
            $('#menu-content-overlay').css({
                width: Global.width,
                height: Global.windowHeight
            });

            if (!Global.isMobile)
                TweenLite.set($('.post-navigation-wrap .post-nav'), {'top': ($(window).height() - 100) * .5})

        },

        navExposed: function () {
            if (Global.menuOpen) {
                // JUST CLOSED
                $('.container, body').removeClass('nav-exposed');
                Global.menuOpen = false;
                Global.navClosed.dispatch();
                this.onClosed.dispatch();

                TweenLite.set($('.main-header, .rightNav'), {clearProps: "position,top"});
                $(document).off("mousewheel DOMMouseScroll", _this.stopScroll);
                // REMOVE force content on GPU
                $('#content-wrap').removeClass('gpu');

                TweenLite.set($('#content-wrap, .main-header'), {delay: 0.25, clearProps: "width"});
                TweenLite.set($('nav#category-nav.work-sorter'), {delay: 0.30, clearProps: "position,top,left,right"});

                $(window).off("resize", _this.animateOutMenu);
                $(document).off("mousewheel DOMMouseScroll", _this.animateOutMenu);

                if (!Global.isMobile) {
                    // DESKTOP
                    if ($('section.cover.open').length == 0) {
                        TweenLite.set($('.rightNav, .post-navigation-wrap'), {position: "fixed"});
                        TweenLite.set($('.post-navigation-wrap'), {clearProps: "left,right,top"});
                        ;
                    }
                }

                TweenLite.set($('#menu-content-overlay'), {visibility: 'hidden'});
            } else {
                // OPENED
                this.onOpened.dispatch();
                Global.navOpened.dispatch();
                Global.menuOpen = true;

                // fix for menu iPhone iOS8 Safari only
                // when sections content is scrolled we need to reset scroll
                // otherwise menu will be broken
                if (Global.isIOS8 && /iPhone/i.test(navigator.userAgent) && /Version/i.test(navigator.userAgent)) {
                    $(document).scrollTop(0);
                    console.log('iOS8 iPhone Safari');
                }

                $('#content-wrap').css('width', $('#content-wrap').outerWidth());
                //$('.main-header').css('width',  $('.main-header').outerWidth());

                $(window).one("resize", _this.animateOutMenu);
                $(document).one("mousewheel DOMMouseScroll", _this.animateOutMenu);

                TweenLite.set($('#menu-content-overlay'), {visibility: 'visible'});

                if (!Global.isMobile) {
                    TweenLite.set($('.rightNav, .post-navigation-wrap'), {position: 'absolute'});
                    TweenLite.set($('.post-navigation-wrap'), {left: 0, right: 0, top: $(window).scrollTop() - 100});
                    // Animate in Menu Content Overlay

                    //$('.loadedContent section.cover').css({left: 0, right: 0, position: "absolute", top: 0});
                    //TweenLite.set($('nav#category-nav.work-sorter'), {position: "absolute", top:0, left: 0, right: 0});
                } else {
                    // Mobile
                }
                $('.container, body').addClass('nav-exposed');
            }
        }

    });

    return Nav;

});
