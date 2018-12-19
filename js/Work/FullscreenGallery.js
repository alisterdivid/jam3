define(['Class', 'Global', 'utils/GA'], function(Class, Global, GA){

	var _this = null;

	var FullscreenGallery = new Class({

		inited: false,
		width: 0,
		height: 0,
		isOpen: false,
		lastTimestamp: 0,
		animationFrameID: null,
		_total: 0,
		total: {
			set: function(val){
				this._total = val;
				var pagesHTML = '';
				for (var i = 0, len = this._total; i < len; i += 1) {
					pagesHTML += '<div class="page"></div>';
				}
				this.$pageIndicator.html(pagesHTML);
				// Total
				this.$totalNumber.html(this._total);
			},
			get: function(){
				return this._total;
			}
		},
		// Current position
		_curPos: 0,
		curPos: {
			set: function(val){
				this._curPos = val;
				this.curImg = this.$galleryHolder.find('li > img')[this._curPos];
				// Set page
				var $pages = this.$pageIndicator.find('.page');
				if ($pages.length > 0){
					$pages.each(function(i){
						var $page = $(this);
						if (i === _this._curPos){
							$page.addClass('active');
						} else {
							$page.removeClass('active');
						}
					});
				}
				this.$currentPage.html((this._curPos+1));
				// Set thumbnails
				// NEXT
				if (this._curPos < this.total-1){
					// Get next img
					var nextImg = this.$galleryHolder.find('li > img')[this._curPos+1];
					var mobileSrc = nextImg.dataset.srcMobile;
					this.$nextBut.removeClass('inactive').find('.thumb').css({
						backgroundImage: "url('"+mobileSrc+"')"
					});
				} else {
					this.$nextBut.addClass('inactive');
				}
				// PREV
				if (this._curPos > 0){
					// Get next img
					var prevImg = this.$galleryHolder.find('li > img')[this._curPos-1];
					var mobileSrc = prevImg.dataset.srcMobile;
					this.$prevBut.removeClass('inactive').find('.thumb').css({
						backgroundImage: "url('"+mobileSrc+"')"
					});
				} else {
					this.$prevBut.addClass('inactive');
				}
			},
			get: function(){
				return this._curPos;
			}
		},
		mouse: null,

		initialize: function(){
			_this = this;
			this.mouse = {};
			this.animationFrame = this.animationFrame.bind(this);
			this.mouseMove = this.mouseMove.bind(this);
			Global.onResize.add(this.resize.bind(this));
		},

		init: function(){
			if (Global.isMobile) return;
			if (this.inited) return;

			inited = true;

			var html = '<div id="fullscreen-gallery">\
				<div id="gallery-holder"></div>\
				<div class="nav-but prev">\
					<div class="thumb"></div>\
				</div>\
				<div class="nav-but next">\
					<div class="thumb"></div>\
				</div>\
				<div class="dot-page-indicator"></div>\
				<div class="num-page-indicator">\
					<div class="current-number"></div>\
					<div class="seperator">⁄</div>\
					<div class="total-number"></div>\
				</div>\
				<div class="close"></div>\
			</div>';
			this.$container = $(html).appendTo($('body'));
			this.$galleryHolder = this.$container.find('#gallery-holder');
			this.$pageIndicator = this.$container.find('.dot-page-indicator');
			this.$numPageIndicator = this.$container.find('.number-page-indicator');
			this.$currentPage = this.$container.find('.current-number');
			this.$totalNumber = this.$container.find('.total-number');
			this.$nextBut = this.$container.find('.nav-but.next');
			this.$prevBut = this.$container.find('.nav-but.prev');

			this.$container.on('click', '.nav-but', function(){
				var $this = $(this);
				if ($this.hasClass('prev')){
					_this.prev();
				} else if ($this.hasClass('next')){
					_this.next();
				}
			}).on('click', 'li img', function(){
				_this.hide();
			});
			this.$container.find('.nav-but').on('mouseover', function(){
				_this.$container.addClass('default-cursor');
			}).on('mouseout', function(){
				_this.$container.removeClass('default-cursor');
			});

			this.resize();
		},

		prev: function(){
			if (this.curPos > 0){
				this.moveToPos(this.curPos-1);
				this.swipe.prev();
			}
		},

		next: function(){
			if (this.curPos < this.total-1){
				this.moveToPos(this.curPos+1);
				this.swipe.next();
			}
		},

		imgLoadComplete: function(){
			_this.fillImg(this);
		},

		fillImg: function(img){
			var width = img.naturalWidth;
			var height = img.naturalHeight;
			var scaleWidth = this.width/width;
			var scaleHeight = this.height/height;
			var scale = Math.max(scaleWidth, scaleHeight);
			var newWidth = width*scale;
			var newHeight = height*scale;
			$(img).css({
				width: newWidth,
				height: newHeight,
				marginLeft: -newWidth/2,
				marginTop: -newHeight/2
			});
		},

		show: function($projectContainer, swipe, color){
			if (this.isOpen) return;
			if (color == '#ffffff'){
				this.$container.addClass('white');
			} else {
				this.$container.removeClass('white');
			}
			this.swipe = swipe;
			var $items = $projectContainer.find('ul.swipe-wrap li').clone();
			$items.each(function(i){
				var $this = $(this);
				$this.attr('style', '');
				var $img = $this.find('img');
				var img = $img[0];
				// Add img load complete listeners
				img.onload = _this.imgLoadComplete;
				if (img.complete){
					_this.imgLoadComplete.call(img);
				}
				$img.attr('class','');
				if ($img.data('fullsrc')){
					var fullsrc = $img.data('fullsrc');
					$img.attr('src', fullsrc);
				} else {
					// Get the largest image
					var srcDesktop = $img.data('srcDesktop');
					$img.attr('src', srcDesktop);
				}
				TweenLite.set(this, {x:i*_this.width});
			});
			this.$galleryHolder.html($items);
			// Total
			this.total = $items.length;
			// Current position
			this.curPos = swipe.getPos();
			var timeline = new TimelineLite({paused:true});
			// Display
			timeline.add(
				TweenLite.fromTo(this.$container, 0.5, {x:this.width}, {onStart:function(){
					_this.$container.css({
						display: 'block'
					});
				}, x:0, delay:0.1, ease:Expo.easeOut, onComplete:function(){
					_this.isOpen = true;
					$(document).off('mousemove', _this.mouseMove).on('mousemove', _this.mouseMove);
					// Start animation frame
					_this.startAnimationFrame();
				}})
			);
			timeline.add([
				TweenLite.fromTo(this.$container.find('.nav-but.prev'), 0.5, {x:-50}, {x:0, ease:Expo.easeOut}),
				TweenLite.fromTo(this.$container.find('.nav-but.next'), 0.5, {x:50}, {x:0, ease:Expo.easeOut})
			]);
			timeline.add( TweenLite.fromTo(this.$pageIndicator, 0.5, {opacity:0}, {opacity:1, ease:Linear.easeOut}) );
			timeline.add( TweenLite.fromTo(this.$numPageIndicator, 0.5, {opacity:0}, {opacity:1, ease:Linear.easeOut}) );
			timeline.play();
			
			this.moveToPos(this.curPos, true);

			// Prevent scroll
			$(window).on('mousewheel DOMMouseScroll', this.preventDefault);
		},

		hide: function(){
			this.stopAnimationFrame();
			this.isOpen = false;
			$(document).off('mousemove', this.mouseMove);
			TweenLite.to(this.$container, 0.5, {onComplete:function(){
				_this.$container.css({
					display: 'none'
				});
				$(window).off('mousewheel DOMMouseScroll', _this.preventDefault);
			}, x:this.width, delay:0, ease:Expo.easeIn});
		},

		preventDefault: function(e){
			e.preventDefault();
			return false;
		},

		mouseMove: function(e){
			this.mouse.x = e.clientX;
			this.mouse.y = e.clientY;
			this.mouse.centerWeightX = (-this.mouse.x / this.halfWidth) + 1;
			this.mouse.centerWeightY = (-this.mouse.y / this.halfHeight) + 1;
		},

		moveToPos: function(pos, immediate){
			time = (immediate)?0:1;
			delay = (immediate)?0:0;
			TweenLite.to( this.$galleryHolder, time, {delay:delay, x:-this.width*pos, ease:Expo.easeInOut} );
			this.curPos = pos;
		},

		startAnimationFrame: function(){
			this.stopAnimationFrame();
			this.animationFrameID = window.requestAnimationFrame(this.animationFrame);
		},
		stopAnimationFrame: function(){
			if (this.animationFrameID){
				window.cancelAnimationFrame(this.animationFrameID);
				this.start = null;
				this.animationFrameID = null;
			}
		},
		animationFrame: function(timestamp){
			if (this.start === null) this.start = timestamp;
			if (this.lastTimestamp > 0){
				var delta = timestamp - this.lastTimestamp;
			}
			if (this.curImg){
				if (this.curImg.height > this.height || this.curImg.width > this.width){
					var yDist = (this.curImg.height-this.height)/2;
					var targetY = yDist*this.mouse.centerWeightY;
					var xDist = (this.curImg.width-this.width)/2;
					var targetX = xDist*this.mouse.centerWeightX;
					TweenLite.to(this.curImg, 1, {y:targetY, x:targetX, overwrite:'auto', ease:Expo.easeOut});
				}
			}
			this.lastTimestamp = timestamp;
			if (!this.isOpen) return;
			this.animationFrameID = window.requestAnimationFrame(this.animationFrame);
		},

		resize: function(width, height){
			if (width && height){
				this.width = width;
				this.height = height;
				this.halfWidth = width/2;
				this.halfHeight = height/2;
			}
			if (this.$container){
				var dimensionsCSS = {
					width: width,
					height: height
				};
				this.$container.css(dimensionsCSS);
				this.$galleryHolder.css(dimensionsCSS);
				this.$galleryHolder.find('li').each(function(i){
					var $li = $(this);
					TweenLite.set(this, {x:i*_this.width});
					_this.fillImg($li.find('img')[0]);
				});
				this.moveToPos(this.curPos, true);
			}
		}

	});

	return new FullscreenGallery();

});