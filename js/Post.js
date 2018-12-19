define(['Class', 'Global', 'jquery', 'ui/VideoControls', 'utils/GA'], function(Class, Global, $, VideoControls, GA){

	var Post = new Class({

		initialize: function(){

			console.log('POST');

			GA.setPageID('news_page');

			// news article smooth scroll
			$('a.news-scroll-to-top').on('click', function(e) {
				e.preventDefault();
				console.log('hi hi');
				$('body,html').animate({ scrollTop: 0 }, 500);
				return false;
			});

			// Set up title
			var title = $('header.entry-title .big-header').text().replace(/^\s+|\s+$/g, '');
			$('.nav-button-text').addClass('clickable');
			$('.nav-button-text .work-title .inner-holder').html(title);

			Global.animateHeaderTitle();

			// Go to news
			$('.nav-button-text').on('click', function(){
				window.location.href = '/news';
			});

			//  Video controls
			if ($('.video-player').length > 0) {
                new VideoControls($('.video-player').last());
            }

			// GA social links
			$('.social-links').on('click', 'a', function(e){
				var label = '';
				var $this = $(this);
				if ($this.hasClass('twitter')){
					label = 'Twitter';
				} else if ($this.hasClass('facebook')){
					label = 'Facebook';
				} else if ($this.hasClass('google')){
					label = 'Google';
				}
				label += " share " + title;
				GA.trackEvent('Social', 'NewsClick', label);
			});

		}

	});

	return Post;

});
