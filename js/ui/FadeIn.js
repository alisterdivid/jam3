//** Utility Class for selected elements to fade In and grow upon emerging above the fold **//

define (['Class', 'jquery', 'TweenLite', 'TimelineLite', 'Global'], function(Class, $, TweenLite, TimelineLite, Global){
	var FadeIn  = new Class({
		selector: null,

		initialize: function(){

			var _this = this;


			// combine all arguments into one set of jQuery selectors
			for (var i = 0; i < arguments.length; i++) {
				if (i == 0){
					this.selector = arguments[i];
				}else{
					this.selector = this.selector.add(arguments[i]);
				};

				// Apply sorting to sort by possition on the page.
				arguments[i].css({'opacity': '0'});
			    TweenLite.set(arguments[i],{y: 100});

			};

			/* _this.selector.sort(function(a,b){
				return $(a).offset().top - $(b).offset().top;
			});
			*/


	        /* Check the location of each desired element */
	        $(_this.selector).each( function(){

				$(this).each(function(i){
					var top_fifth_of_object = $(this).offset().top + $(this).outerHeight()/5 - 100;
					var bottom_of_window = $(window).scrollTop() + $(window).height();

				


					/* If the object is a third over the fold, fade it in */
					if( bottom_of_window > top_fifth_of_object ){
						TweenLite.to($(this), 1, {y: 0, opacity: 1,  clearProps: 'transform,opacity'});
					}
				});

	        });

	        var scrollCheck = function(){
	    		//this is pretty bad. we are potentially causing reflows every time we scroll
				/* Check the location of each desired element */
				var same_offset = null;
				var k = 0;

				$(_this.selector).each( function(i){

					//console.log($(this).css('opacity'));

					if($(this).css('opacity') == 0){

						var top_fifth_of_object = $(this).offset().top + $(this).outerHeight()/10;
						var bottom_of_window = $(window).scrollTop() + $(window).height();

						

						if(top_fifth_of_object != same_offset){
							k = 0;
							same_offset = top_fifth_of_object;
						} else {
							k++;
						}

						//console.log(k);
					

						/* If the object is a third over the fold, fade it in */
						if( bottom_of_window > top_fifth_of_object ){
			
							TweenLite.to($(this), 1, {delay: 0.1*k, opacity: 1, clearProps: 'opacity'});
						    TweenLite.to($(this), 1, {delay: 0.1*k, y:0, clearProps: 'transform', ease: Expo.easeOut});
						}

					
					}

                });

	        }

	        $(window).off("scroll", _.debounce(scrollCheck, 50) );

			/* Every time the window is scrolled ... */
		    $(window).on("scroll", _.debounce(scrollCheck, 50) );

		
		}
	});
	return FadeIn;
});
