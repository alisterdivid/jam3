define(['Class', 'Global', 'jquery', 'utils/GA'], function(Class, Global, $, GA){

	var About = new Class({

		bannerImageLoaded: false,

		initialize: function(){

			GA.setPageID('about');

			var $bannerImg = $('.banner-image.zoomable img');
			var bannerImg = $bannerImg[0];
			if (bannerImg && bannerImg.complete){
				this.bannerImgLoaded();
			} else {
				bannerImg.onload = this.bannerImgLoaded.bind(this);
			}

			Global.onResize.add( this.onResize.bind(this) );

		},

		bannerImgLoaded: function(){

			this.bannerImageLoaded = true;

			this.onResize();

		},

		onResize: function(){

			var $banner = $('.banner-image.zoomable');
			var $bannerImage = $banner.find('img');

			var bannerImageHeight = $bannerImage.height();
			var bannerHeight = bannerImageHeight*0.8;

			// console.log(bannerImageHeight, bannerHeight);

			$banner.css({
				height: bannerHeight
			});

			$bannerImage.css({
				top: ((bannerHeight - bannerImageHeight)*0.5)
			});
		}

	});

	return About;

});
