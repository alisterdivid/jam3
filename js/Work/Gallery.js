define(['Class', 'Global', 'Work/FullscreenGallery', 'swipe', 'utils/GA'], function(Class, Global, FullscreenGallery, Swipe, GA){

	var _this = null;

	var Gallery = new Class({

		swipe: null,

		initialize: function($container, project){

			if (!$container || !$container.length) return;

			_this = this;

			this.$container = $container;

			this.project = project;

            var $windowHeight = Global.windowHeight;
            var $windowWidth = Global.width;

            var $swipe  = $container.find('.swipe:first');

            this.createGalleryPagination($container.find('.gallery-lower'), $swipe.find('> ul > li').length);

            if ($swipe.length) {

            	var elem = $swipe[0];

                if ($container.find('.gallery-info').length === 0){

                    var widthCalcuation = ( ($windowHeight - 70) * ( $(elem).find('img').eq(0).outerWidth(true) / $(elem).find('img').eq(0).outerHeight(true) ) ) / $windowWidth;
                    //console.log('swipe calculation', widthCalcuation.toFixed(2) * 100);

                    if(widthCalcuation > 1){
                        widthCalcuation = 1;
                    }

                    $(elem).parent().parent().parent().css({width: widthCalcuation.toFixed(2) * 100 + "%", margin: "auto", float: "none"});
                }

                this.swipe = new Swipe(elem, {
                    // Update current slide number
                    continuous: false,
                    transitionEnd: function(){
                        var currentSlide = (_this.swipe.getPos() + 1);
                        $container.find('.slide-numbers .current-number').html(currentSlide);
                        $container.find('.gallery-markers .marker').removeClass('active');
                        $container.find('.gallery-markers .marker').slice(currentSlide-1,currentSlide).addClass('active');
                        GA.trackEvent('Interaction', 'BrowseSlideshow', _this.project.projectTitle.toLowerCase(), currentSlide);
                    }
                });

                // Set current slide number
                $container.find('.slide-numbers .current-number').html((_this.swipe.getPos() + 1));
                // Set total slides
                $container.find('.slide-numbers .total-number').html(_this.swipe.getNumSlides());

                //Previous button
                $container.find('.controls').on('click', '.prev', function(e){
               		if (_this.project.isLoadingWorkPage) return;
                    _this.swipe.prev();
                    e.preventDefault();
                });

                // Next button
                $container.find('.controls').on('click', '.next', function(e){
               		if (_this.project.isLoadingWorkPage) return;
                    _this.swipe.next();
                    e.preventDefault();
                });

                $container.find('.controls').on('click', '.magnify', function(e){
                    var currentIndex = _this.swipe.getPos() + 1;
                    _this.magnify();
                    e.preventDefault();
                });

            }

		},

		magnify: function(){
            GA.trackEvent('Interaction', 'SlideshowFullscreen', _this.project.projectTitle.toLowerCase(), (_this.swipe.getPos() + 1));
			FullscreenGallery.show(this.$container, _this.swipe, _this.project.coverColour);
		},

		createGalleryPagination: function(container,count) {
            container = container.find('.gallery-markers');
            var html = '';
            for (var i=0; i<count; i++) {
                html += '<div class="marker'+((i==0)?' active':'')+'"></div>';
            }
            var circleSize = 13;
            var padding = 6;
            // Make smaller if on mobile
            if (Global.isMobile){
                container.addClass('small');
                circleSize = 10;
                padding = 4;
            }
            container.find('.markerWrap').html(html);
            var size = (count*circleSize)+((count-1)*(padding*2));
            container.find('.line').css({
                'width': size,
                'margin-left': -(size*0.5)
            });
            container.find('.markerWrap').css('margin-left',-((count*circleSize)+(count*(padding*2)))*0.5);
        }

	});

	return Gallery;

});