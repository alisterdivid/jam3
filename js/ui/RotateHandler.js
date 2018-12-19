define(['Class', 'jquery', 'libjs/utils/Util', 'TweenLite', 'Global', 'Signal'], function(Class, $, Util, TweenLite, Global, Signal) {
	
    var RotateHandler = new Class({

        initialize: function() {    
            this.onRotate = new Signal();
            this.handleResizeBound = this.handleResize.bind(this);
        },

        setup: function() {
            // $(window).bind('resize', this.handleResizeBound);
            $(window).bind('orientationchange', this.handleResizeBound);

            //Scale images for retina to keep them 1:1 with the design.
            if (Util.support.isRetina) {
                $('.rotate-icon').each(function() {
                    var item = $(this);
                    item.css("width", item.width()/2);
                    item.css("height", item.height()/2);
                })
            }

            this.hero = $('.rotate-hero-container');
            this.lock = $('.rotate-lock-container');

            this.lockHidden = false;
            if (Util.support.isIPhone || Util.support.isIPad || Util.support.isIPod) {
                // this.lock.hide();
                // this.lockHidden = true;
            }

            if (this.isLandscape())
                this.setRotateScreenEnabled(true);

            Global.onVideoInactive.add(this.handleResizeBound);
        },

        destroy: function() {
            // $(window).unbind('resize', this.handleResizeBound);
            $(window).unbind('orientationchange', this.handleResizeBound);

            Global.onVideoInactive.remove(this.handleResizeBound);
        },

        setRotateScreenEnabled: function(enabled) {
            var container = $('.container');
            container.css("display", enabled ? "none" : "block");

            $('#menu-content-overlay').css("display", enabled ? "none" : "block");

            $('.mobile-rotate-screen').css("display", enabled ? "block" : "none");

            if (enabled) {
                var parentHeight = window.innerHeight;
                var heroHeight = this.hero.height();
                
                if (!this.lockHidden) {
                    var pad = Global.currentWidthType === 'mobile' ? 30 : 175;
                    var lockHeight = this.lock.height();

                    heroHeight = heroHeight+pad+lockHeight;
                    this.lock.css("margin-top", pad);
                }

                var mh = Math.ceil( (parentHeight-heroHeight)/2 );
                this.hero.css("margin-top", mh);

                var deviceName = (Global.currentWidthType === 'mobile') ? 'PHONE' : 'TABLET';
                var headerText = $('header', this.hero);
                var text = headerText.html();
                headerText.html( Util.format(text, deviceName) );

                TweenLite.fromTo([this.hero, this.lock], 0.5, {
                    alpha: 0.0
                }, {
                    alpha: 1.0,
                    delay: 0.3
                });
            }
        },

        isLandscape: function() {
            if (Global.videoPlaying || Global.videoInFullScreen)
                return false;
            return window.DeviceOrientationEvent && Math.abs(Math.floor(window.orientation)) === 90;
        },

        handleResize: function() {
            var showRotate = this.isLandscape();

            this.setRotateScreenEnabled(showRotate);

            this.onRotate.dispatch(showRotate);
        },
    });

    return new RotateHandler();
});