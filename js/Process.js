define(['Class',
    'Global',
    'jquery',
    'underscore',
    'TweenLite',
    'TimelineLite',
    'jquery.hammer',
    'jquery.mousewheel',
    'libjs/utils/Util',
    'utils/GA'],function(
        Class,
        Global,
        $,
        _,
        TweenLite,
        TimelineLite,
        Hammer,
        jqMousewheel,
        Util,
        GA){
    //We use the global PROCESS_SLIDES from page-process.php -- kida ugly :(
    //console.log(jqMousewheel);

    var MARGIN_TOP = 100;
    var IMAGE_ASPECT_RATIO = 1188/677; //Hardcode for now; if we need it dynamic we can query it later..
    var SCROLL_DIST = 1;

	var Process = new Class({

		initialize: function() {
            this.slides = PROCESS_SLIDES;

            console.log('this.slides: ', this.slides);

            GA.setPageID('process');

            this.container = $('.process-container');
            this.imageContainer = $('.process-images');
            this.circleMenu = $('.circle-menu');
            this.circles = [];
            this.image = null;
            this.image = $('.contentImage');
            this.lastImage = null;
            this.text = $('.contentText');
            this.title = $('.contentTitle');
            this.count = $('.contentCount');

            this.nextButtonContainer = $('.da-arrows');
            this.nextButton = $('.da-arrows-next');

            this.waitingForScroll = true;

            this.textLineHeight = 85;
            this.lastWidthType = null;

            this.animating = false;
            this.deferredSwipe = null;

            this.lastImage = null;


            this.firstPage = true;
            this.currentPage = -1;

            //On desktop we need to throttle the scroll to avoid touchpad falloff
            var throttleDelay = 2000;
            this.nextThrottled = _.throttle(this.next.bind(this), throttleDelay, { trailing: false });
            this.previousThrottled = _.throttle(this.previous.bind(this), throttleDelay, { trailing: false });

            this.vignette = null;
            this.vignetteAlpha = 0.5;

            //if we're on mobile, we need to do one swipe before we can continue...
            if (Util.support.isHandheld) {
                var mobile = Global.currentWidthType !== 'tabletLandscape' && Global.currentWidthType !== 'tabletPortrait';
                console.log(mobile);

                $('.process-scroll-text').text("SWIPE UP").css({
                    color: 'white',
                    opacity: 0.5,
                    fontSize: mobile ? '13px' : '22px',
                    top: mobile ? -37 : -47,
                    // left: 2,
                });
                this.circleMenu.hide();
                this.nextButton.css({
                    background: "transparent",
                });
                var btnIcon = this.nextButton.children().first();
                btnIcon.removeClass("icon-caret-down").addClass("da-arrow-up-icon");
                var url = '../wp-content/themes/jam3/assets/img/icons/arrow-up.png';
                btnIcon.css({
                    top: 10,
                    left: 0,
                    width: 57,
                    height: 37,
                    backgroundPosition: "50% 50%",
                    background: "url('"+url+"') no-repeat"
                });
                this.nextButton.css({
                    width: 57,
                    height: 60,
                    top: -30,
                });
                TweenLite.set(this.nextButton, {
                    transform: 'matrix(0.5, 0, 0, 0.5, -3, 0)',
                    transformOrigin: "center center"
                })

                this.vignette = $("<div>").prependTo(this.container);
                this.vignette.addClass("mobile-vignette");
                this.vignette.hide();
            }

            this.animatingScrollIcon = true;
            this.animateScrollCaret(0.0, true);

            this.handleResize();
            this.setupEvents();
            this.setupCircles();


            this.currentLineCount = 0;
            this.setPage(0, true);
		},

        setupCircles: function() {
            // set circle menu
            for (var i = 0; i < this.slides.length; i++) {
                var circleNav = $('<li>').appendTo(this.circleMenu);
                circleNav.on('click', this.setPage.bind(this, i, true));
                this.circles.push(circleNav);
            }
        },

        handleMobileNext: function(ev) {

            console.log('ev: ', ev);

            console.log("HAMMERTIME");
            if (Global.menuOpen)
                return;
            ev.preventDefault();

            //If we're waiting for scroll on mobile/tablet,
            //skip the first slide switch and just show the text
            if (this.waitingForScroll && !this.isDesktop()) {
                this.waitingForScroll = false;
                this.animateOutScrollText();
                this.updateText(0.5, true);
                this.currentPage = 0;
                this.updateCircles();

                this.circleMenu.show();
                TweenLite.fromTo(this.circleMenu, 1.0, {
                    x: 200,
                }, {
                    x: 0,
                    ease: Expo.easeOut
                });
                return;
            }

            if (!this.animating)
                this.next();
            else
                this.deferredSwipe = this.next.bind(this);
        },

        setupEvents: function() {
            //TODO: Debounce?
            $(window).bind('resize.process', this.handleResize.bind(this));

            // switch content on keyboard arrows press
            $(document).keydown(function(e) {
                if (Global.menuOpen)
                    return;
                if (e.which === 37)
                    this.previous();
                else if (e.which === 39)
                    this.next();
            }.bind(this));

            //the buttons are too small to bother making them clickable on touch devices
            if (Util.support.isHandheld) {
                this.nextButtonContainer.on('touchstart', this.handleMobileNext.bind(this));

                //setup swipe
                //Unlike scroll/etc we are actually going to defer the page switch
                //until after the text animation is done.. this leads to a slightly nicer UX
                var dragMinDistance = 50;
                if (Util.support.isAndroid){
                    dragMinDistance = 40;
                }
                console.log('Hammer.DIRECTION_VERTICAL: ', Hammer.DIRECTION_VERTICAL);
                var hammertime = new Hammer(this.container[0]);
                hammertime.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
                hammertime.on('swipeup', this.handleMobileNext.bind(this));
                hammertime.on('swipedown', function(e) {
                        console.log('e: ', e);
                        if (Global.menuOpen)
                            return;
                        if (!this.animating)
                            this.previous();
                        else
                            this.deferredSwipe = this.previous.bind(this);
                    }.bind(this));

                //this.container.on('touchmove', function(ev) { ev.preventDefault() });

            } else {
                this.nextButton.on('click', this.next.bind(this, true));

                $(document).on('mousewheel', function(ev) {
                    console.log(Global.menuOpen);
                    if (Global.menuOpen)
                            return;

                    if (Math.abs(ev.deltaY) < SCROLL_DIST || ev.deltaY === 0)
                        return true;

                    if (ev.deltaY > 0) {
                        if (!this.animating) {
                            this.previousThrottled();
                        } else {
                            // this.deferredSwipe = this.previousThrottled.bind(this);
                        }
                    } else {
                        if (!this.animating) {
                            this.nextThrottled();
                        } else {
                            // this.deferredSwipe = this.nextThrottled.bind(this);
                        }
                    }

                    ev.preventDefault();
                }.bind(this));
            }
        },

        handleResize: function() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;

            var margin = this.isDesktop() ? MARGIN_TOP : 0;
            this.imageHeight = this.height - margin*2;
            this.container.css("height", this.imageHeight);

            $('.contentImage').css("width", "100%")
                      .css("height", this.imageHeight);

            this.nextButtonContainer.css("top",
                    this.isDesktop()
                        ? this.imageHeight + MARGIN_TOP
                        : this.imageHeight - 35);

            if (this.isDesktop())
                this.circleMenu.css("bottom", 7).css("top", "");
                // this.circleMenu.css("top", this.imageHeight + MARGIN_TOP - 63);
            else {
                this.circleMenu.css("top", "").css("bottom", "0");
            }

            $('.process-title-row').css("height", this.isDesktop() ? this.imageHeight/2 : "");

            if (Global.currentWidthType !== this.lastWidthType) {
                console.log("NEW TYPE: ", Global.currentWidthType, "isDesktop?", this.isDesktop());
                this.updateTextTop();

                if (this.waitingForScroll) {
                    if (!this.animatingScrollIcon)
                        this.animateScrollCaret(0, true);
                } else {
                    this.circleMenu.show();
                }

                if (this.waitingForScroll) {
                    if (this.isDesktop() || Util.support.isHandheld)
                        this.nextButtonContainer.show();
                    else
                        this.nextButtonContainer.hide();
                }

                this.lastWidthType = Global.currentWidthType;
            }
        },

        previous: function() {
            console.log("PREVIOUS");
            if (this.currentPage > 0)
                this.setPage(this.currentPage-1, false);
        },

        next: function(isClick) {
            console.log("NEXT");
            if (this.currentPage < this.slides.length-1)
                this.setPage(this.currentPage+1, true, isClick);
        },

        setPage: function(index, wasNext, isClick) {
            if (this.currentPage === index)
                return;

            this.currentPage = index;

            this.updateCircles();

            if (this.lastImage) {
                this.lastImage.onload = null;
                this.lastImage = null;
            }

            if (this.firstPage && this.waitingForScroll) {
                this.nextButtonContainer.hide();
            }

            // GA analytics
            var currentSlide = this.slides[this.currentPage];
            var gaTitle = currentSlide.title + ' ' + currentSlide.count;
            if (isClick){
                GA.trackEvent('Page View', 'ProcessClick', gaTitle);
            } else if (!this.firstPage) {
                GA.trackEvent('Page View', 'ProcessScroll', gaTitle);
            }

            var img = new Image();
            img.onload = this.animateInNext.bind(this, 0, wasNext);
            img.src = this.getURL();

            this.lastImage = img;
            // this.animateInNext(0, wasNext);
        },

        getURL: function() {
            var slide = this.slides[this.currentPage];
            var url = this.isDesktop() ? slide.url : slide.mobile;
            if (!url) {
                url = slide.url; //fallback to desktop
            }
            return url;
        },

        _setFinishedAnimating: function() {
            this.animating = false;
            if (this.deferredSwipe) {
                this.deferredSwipe();
                this.deferredSwipe = null;
            }
        },

        animateScrollCaret: function(delay, first) {
            if (!this.waitingForScroll) {
                this.animatingScrollIcon = false;
                return;
            }
            var icon = $('.scroll-down-icon');
            var dur = 0.7, ease = Expo.easeInOut;
            var off = Util.support.isHandheld ? 55 : 45;
            delay = delay||0;
            if (Util.support.isHandheld) {
                off = -off;
            }

            TweenLite.fromTo(icon, dur, {
                y: first ? 0 : -off,
            }, {
                y: 0,
                delay: delay,
                ease: ease
            });
            TweenLite.to(icon, dur, {
                y: off,
                delay: delay+dur+0.6,
                ease: ease,
                onComplete: this.animateScrollCaret.bind(this)
            });
        },

        animateOutScrollText: function() {
            var btn = this.nextButtonContainer;

            var text = $('.process-scroll-text');

            // btn.css("position", "fixed");
            TweenLite.to(text, 0.5, {
                alpha: 0,
                onComplete: this.hideItem.bind(this, text)
                // ease: Expo.easeInOut
            });
            TweenLite.to(this.nextButton, 0.5, {
                alpha: 0,
                onComplete: this.hideItem.bind(this, this.nextButton)
            });
            if (this.vignette) {
                TweenLite.to(this.vignette, 0.5, {
                    alpha: 0,
                    onComplete: this.hideItem.bind(this, this.vignette)
                })
            }
        },

        animateInNext: function(delay, wasNext) {
            var slide = this.slides[this.currentPage];

            delay = delay||0;
            var newImage = this.image.clone(); //NOTE: no data or events being cloned
            newImage.css("background-image", "url('"+this.getURL()+"')");


            var oldImage = this.image;

            this.image = newImage;
            if (wasNext)
                this.imageContainer.prepend(newImage);
            else
                this.imageContainer.append(newImage);

            this.animating = true;

            var showImmediately = false;
            var countSpan;

            if (this.waitingForScroll) {
                this.nextButtonContainer.show();
                TweenLite.fromTo(this.nextButtonContainer, 1.0, {
                    alpha: 0.0,
                }, {
                    alpha: 1.0,
                    // delay: 0.2,
                });
                if (this.vignette) {
                    this.vignette.show();
                    TweenLite.fromTo(this.vignette, 1.0, {
                        alpha: 0.0,
                    }, {
                        alpha: this.vignetteAlpha,
                        delay: 0.3
                    });
                }
            }

            if (this.firstPage) {
                //update text immediately, skip animation out
                this.firstPage = false;
                showImmediately = true;

                if (!this.waitingForScroll || !Util.support.isHandheld)
                    this.updateText(0.5, wasNext);
                else
                    this.animating = false;
            } else {

                if (this.waitingForScroll) {
                    this.waitingForScroll = false;

                    // this.circleMenu.show();
                    this.animateOutScrollText();
                }

                //wasNext -> slide up image

                TweenLite.fromTo(wasNext ? oldImage : newImage, 0.5, {
                    y: wasNext ? 0 : -this.height,
                }, {
                    y: wasNext ? -this.height : 0,
                    z: 1,
                    delay: showImmediately ? 0 : 0.5,
                    ease: Expo.easeIn,
                    onComplete: oldImage ? oldImage.detach.bind(oldImage) : undefined
                });

                //animate out the text... when it's done, update it and animate back in
                this.animateOutText(0.0, this.updateText.bind(this, 0, wasNext), wasNext);
            }


        },

        animateOutText: function(delay, onComplete, wasNext) {
            var dur = 0.7;


            var desktop = this.isDesktop();

            var mult = wasNext ? 1 : -1;
            var diffDelay = 0.1;

            if (desktop)
                this.animateOutSpan(this.count.children().first(), 0);
            else {
                TweenLite.to(this.count, dur, {
                    y: -this.imageHeight * mult,
                    delay: delay + (wasNext ? 0 : diffDelay*2),
                    ease: Expo.easeInOut,
                })
            }

            TweenLite.to(this.title, dur, {
                y: -this.imageHeight * mult,
                ease: Expo.easeInOut,
                delay: this.isDesktop()
                    ? delay + (wasNext ? 0 : diffDelay)
                    : delay + (wasNext ? diffDelay : diffDelay),
                onComplete: wasNext ? onComplete : undefined,
            });

            TweenLite.to(this.text, dur, {
                y: -this.imageHeight * mult,
                delay: this.isDesktop()
                    ? delay + (wasNext ? diffDelay : 0)
                    : delay + (wasNext ? diffDelay*2 : 0),
                ease: Expo.easeInOut,
                onComplete: wasNext ? undefined : onComplete
            });
        },

        animateInSpan: function(span, delay) {
            TweenLite.fromTo(span, 0.5, {
                top: this.textLineHeight,
            }, {
                top: 0,
                delay: delay,
                ease: Expo.easeOut,
            });
        },

        animateOutSpan: function(span, delay) {
            TweenLite.to(span, 0.5, {
                top: this.textLineHeight,
                delay: delay,
                ease: Expo.easeInOut,
            });
        },

        getTextYOff: function() {
            //this depends on the minimum height we have set for our text box.
            //this way the text animates consistently between frames, starting from the same place..

            //mobile has a special case compared to tablet/desktop
            if (Global.currentWidthType == 'mobile')
                return 220;
            return this.isDesktop() ? (this.imageHeight * 0.33) : 150
        },

        killDeferredSwipe: function() {
            //Kill the deferred swipe event since it will feel weird if it happens 2-3 seconds later
            this.deferredSwipe = null;
        },

        //For top-offset to work, title font HAS to have a line-height of 1em
        //otherwise we need to tweak this font size here...
        getTitleFontSize: function() {
            return 75;
        },

        updateTextTop: function() {
            var lines = this.currentLineCount;



            // var fontSize = parseInt(this.title.css("font-size"), 10);
            var fontSize = this.getTitleFontSize();
            var em1 = -fontSize,
                em = -fontSize * lines;

            //clear top for mobile
            if (!this.isDesktop()) {
                em = em1 = "";
            }
            // console.log(em, em1);

            // this.title.css("top", em);
            // this.text.css("top", em);
            // this.count.css("top", em1)
        },

        updateText: function(delay, wasNext) {
            delay = delay||0;


            var slide = this.slides[this.currentPage];

            var onCompleteHandler = this._setFinishedAnimating.bind(this);

            //Kill previous tweens
            TweenLite.killTweensOf([this.count, this.title, this.text]);

            //Reset the Y positions...
            TweenLite.set([this.count, this.title, this.text], { y: 0 });
            TweenLite.set(this.text, { alpha: 0.0 });

            //Setup the next text strings...
            if(Global.isMobile && slide.mobileColor != ''){
                this.container.removeClass("dark light").addClass(slide.mobileColor);
            } else {
                this.container.removeClass("dark light").addClass(slide.color);
            }
            
            this.title.html(slide.title);
            // this.breakLines(this.title, slide.title);
            this.count.html(this.spanify(this.getCount(slide.count)));
            this.text.html(slide.text);

            this.currentLineCount = $('.contentTitle').children().length;
            this.updateTextTop();

            //mask animate in the content
            // this.animateInSpan(this.title.find('p').toArray(), delay);

            var showDelay = delay+0.0;
            var diffDelay = 0.1;

            //and animate up the containers themselves to the top
            TweenLite.fromTo(this.title, 1.0, {
                y: wasNext ? this.imageHeight : -this.imageHeight,
            }, {
                y: 0,
                onStart: this.killDeferredSwipe.bind(this),
                ease: Expo.easeInOut,
                onComplete: wasNext ? onCompleteHandler : undefined,
                delay: wasNext ? showDelay : showDelay+diffDelay,
            })

            //Animate up the text body itself
            TweenLite.fromTo(this.text, 1.0, {
                y: wasNext ? this.imageHeight : -this.imageHeight,
                alpha: 1.0,
            }, {
                y: 0,
                delay: wasNext ? showDelay+diffDelay : showDelay,
                // delay: wasNext ? showDelay+diffDelay : showDelay,
                onComplete: wasNext ? undefined : onCompleteHandler,
                ease: Expo.easeInOut,
            });

            showDelay += 0.5;
            this.animateInSpan(this.count.children().first(), showDelay+.5);

        },

        updateCircles: function() {
            for (var i=0; i<this.circles.length; i++) {
                if (i===this.currentPage)
                    this.circles[i].addClass("da-dots-current");
                else
                    this.circles[i].removeClass("da-dots-current");
            }
        },

        ///////// UTILS

        hideItem: function(item) {
            item.hide();
        },

        //We do this because it needs to match the CURRENT breakpoint rather than what was initially loaded
        isDesktop: function() {
            return (Global.currentWidthType == 'desktop' || Global.currentWidthType == 'tabletLandscape');
        },

        spanify: function(text) {
            return text.split(" ").map(function(val) {
                return "<span>"+val+"</span>";
            });
        },

        breakLines: function(container, text){
            //put spans into the container
            container.html(this.spanify(text));

            var children = container.find($('span'));

            var refPos = children.first().position().top;
            var newPos;

            var total = 0;
            var start = 0;

            children.each(function(index) {
                newPos = $(this).position().top;
                if (index == 0){
                    return;
                }
                if (newPos == refPos){
                    $(this).prepend($(this).prev().text().replace(/^\s+|\s+$/g, '') + " ");
                    $(this).prev().remove();
                } else {
                    total += newPos;
                }
                refPos = newPos;
                var height = $(this).height();
            });

            chidlren = container.find($('span'));
            children.css("display", "block");
            children.each(function(index) {
                var el = $(this).text().replace(/^\s+|\s+$/g, '');
                $(this).html("<p>"+el+"</p>");
            });
        },

        getCount: function(number){
            return (number<10?("0"+number):number);
        },
	});

    return Process;
});
