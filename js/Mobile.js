define(['Class', 'jquery', 'TweenLite', 'TimelineLite', 'Global', 'lib/fastclick', 'jquery.hammer'],function(Class, $, TweenLite, TimelineLite, Global, FastClick) {


	var Mobile = new Class({

		initialize: function(){
			this.mobileInteractions();

			// Disable 300ms delay when user taps a link on a touch device
			FastClick.attach(document.body);


		},
		mobileInteractions: function(){
			if (Global.currentWidthType === 'mobile' || Global.currentWidthType === 'tabletPortrait'){
				
				$('main').on('click', '.rightNav.mobile-open a', function(e) {
					TweenLite.to($('.rightNav'),0.4,{opacity: 0, onComplete: function() {
						$('.rightNav').removeClass('mobile-open');
						$('.loadedContent, main.single-work').find('article').first().removeClass('blurred');
						$('.mobile-post-nav').removeClass('blurred');
					}});
					e.preventDefault();
				});

				$('#category-nav.work-sorter ul.sub-menu li a').on('click', function(){
					var newCatHeader = $(this).html();
					$(this).parent().parent().siblings('a').children('span').html(newCatHeader);
					$(this).parent().parent().removeClass('visible');
				});
			}
		}	


	});

	return Mobile;


});


