define(['Class', 'jquery', 'TweenLite', 'TimelineLite', 'Global', 'jquery.fitVids', 'libjs/utils/Util', 'utils/GA'],function(Class, $, TweenLite, TimelineLite, Global, fitVids, Util, GA) {

	var News = new Class({

		initialize: function(){
			var _this = this;
			$('input[type="text"]').val(""); //reset value;

			GA.setPageID('news');

			var tl= new TimelineLite({paused: true});
			tl.to($('#textCursor'), 1 , {left: 40, ease: Expo.easeInOut})
			.to($('#placeHolder'), 1, {opacity: 0, ease: Expo.easeInOut, onComplete: function(){
				// $('#placeHolder').remove();				
				$('#placeHolder').css('z-index', 50);
				$('input[type="text"]').focus();
				$('#textCursor').css('opacity', 0);
			}, onReverseComplete: function(){
				

			}}, 0)

			this.navDropDowns();

			_this.loadBlogContent = _this.loadBlogContent.bind(this);

			//Filter blog posts by Category
			$('#category-nav.news-sorter ul.main-cat li ul li a').on('click', function(e){
				var $this = $(this);
				GA.trackEvent('News', 'NewsClick', $this.data('filtername'));
				_this.loadBlogContent($this, 'load-cat-filter');
				//$('#category-nav.news-sorter ul.sub-cat > li > ul').addClass('visible');
				$('#category-nav.news-sorter ul.main-cat > li > ul').removeClass('visible');
				e.preventDefault();
			});

			//Filter blog posts by Tag
			$('#category-nav.news-sorter ul.sub-cat li ul li a').on('click', function(e){
				var $this = $(this);
				GA.trackEvent('News', 'NewsClick', $this.data('filtername'));
				_this.loadBlogContent($this, 'load-tag-filter');
				e.preventDefault();
			});

			//Trigger Search animation on click
			$('#searchform').click(function(){ //placeHolder
				
				tl.play();

			});

			// GA Track search submit
			$('#searchform').on('submit', function(){ //placeHolder
				
				var value = $('#searchform').find('#s').val();
				GA.trackEvent('Search', 'NewsClick', value);

			});


			$('input[type="text"]').blur(function(){
				console.log("contains stuff?", $(this).val() );
				  if( !$(this).val() ) {
				  		$('#placeHolder').css('z-index', 150);
				  		$('#textCursor').css('opacity', 1);
				          tl.reverse();
				    }
			});

			// if($('input[type="text"]').val()){ //If user reloads page or uses back button and there is still text in the input field
			// 	tl.seek(2, false);
			// }

			// Make videos responsive
			jQuery('.container').fitVids();

			this.titleHovers();
			this.searchOveride();

			// Make sure READ MORE aninmates when rolling over article
			$('#content-wrap .content .news-wrap').on('mouseover', '.entry-title, .image-wrapper', _.debounce(function(e){
				var readMore = $(this).parent().find('.entry-content a.read-more:first');
				readMore.addClass('hover');
				TweenLite.delayedCall(0.5, function(){
					readMore.removeClass('hover');
				});
			}, 100) );

			$(window).resize(this.onResize.bind(this));

			// Touchstart / touch end
			if (Global.isMobile){
				$('.news-wrap')
					.on('touchstart', 'article a', function(){
						this.style.opacity = 0.7;
					})
					.on('touchend', 'article a', function(){
						this.style.opacity = 1;
					});
			}

			// TRUNCATE TEXT
			// Store original text in data
			$('.entry-content').find('.text').each(function(index, el){
				var $this = $(this);
				var text = $this.text().replace(/^\s+|\s+$/g, '');
				$this.data('text', text);
			});
			// Go ahead and truncate
			this.truncateText(true);

			$('#category-nav ul')
				.on('mouseover', '> li ul li', function(){
					var $this = $(this);
					$this.next('li a').addClass('no-border')
				})
				.on('mouseout', '> li ul li', function(){
					var $this = $(this);
					$this.next('li a').removeClass('no-border');
				});

			// GA anaytics
			$('a.read-more').on('click', function(){
				var $this = $(this);
				var $header = $this.closest('article');
				var title = $header.find('header.entry-title > h2 > a').data('title');
				GA.trackEvent('News', 'NewsClickKeepReading', title);
			});
			$('header.entry-title > h2 > a').on('click', function(){
				var $this = $(this);
				var title = $this.data('title');
				GA.trackEvent('News', 'NewsClickLatest', title);
			});
			$('article .image-wrapper a').on('click', function(){
				var $this = $(this);
				var $header = $this.closest('article');
				var title = $header.find('header.entry-title > h2 > a').data('title');
				GA.trackEvent('News', 'NewsClickLatest', title);
			});

		},

		truncateText: function(initial){
			// Truncate text
			var length = (Global.currentWidthType=='mobile') ? 30 : 100;
			$('.entry-content').find('.text').each(function(index, el){
				var $this = $(this);
				var text = $this.data('text');
				if (Global.isMobile){
					text = Util.truncate(text, length);
				}
				$this.html(text);
			});
			if (initial){
				$('.entry-content').css('visibility', 'visible');
			}
		},

		onResize: function(){
			this.titleHovers();
			this.truncateText();
		},

		titleHovers: function(){

			$('.hoverTitle span').each(function(){
				var $this = $(this); 
				$this.width($this.parent().parent().width()+2);
			});

		},

		navDropDowns: function(){
	
			if (Global.isMobile){
				$('#category-nav.work-sorter').on('click', 'ul li a', function(e){
					GA.trackEvent('News', 'NewsClick', 'Category');
					$(this).siblings('ul').toggleClass('visible');
					$(this).parent().parent().siblings().find('ul').removeClass('visible');
					e.preventDefault();
				});
				$('#category-nav.news-sorter').on('click', '> ul > li > a', function(e){
					GA.trackEvent('News', 'NewsClick', 'SubCategory');
					var $this = $(this);
					$(this).siblings('ul').toggleClass('visible');
					var parent = $this.parent().parent();
					parent.siblings('ul').find('> li > ul').removeClass('visible');
					e.preventDefault();
				});
			} else {
				$('#category-nav').on('mouseenter', 'ul', function(){
					$(this).find('li ul').addClass('visible');
					$(this).siblings().find('li ul').removeClass('visible');
					$('.news-wrap').addClass('fade');
				}).on('mouseleave', function(){
					$(this).find('ul li ul').removeClass('visible');
					$('.news-wrap').removeClass('fade');
				});
				$('#category-nav ul').one('mouseenter', function(){
					var $this = $(this);
					var text = $this.find('a span').text().replace(/^\s+|\s+$/g, '');
					GA.trackEvent('News', 'NewsClick', text);
				});
			}

		},
		//Function to load more categories/tags on News page
		loadBlogContent: function(el, ajaxFnName){
			var filterID = $(el).attr('data-filter-id');
			var filterName = $(el).attr('data-filtername');
			var ajaxurl = "/wp-admin/admin-ajax.php";
			var _this = this;

			$.ajax({
				type: 'POST',
				url: ajaxurl,
				data: {
					'action': ajaxFnName,
					filter: filterID
				},

				success: function(response) {
					$('.news-wrap').html(response);
					$('.current-category').text(filterName);

					var parentUL = $(el).parent().parent().parent().parent();

					if(parentUL.hasClass('main-cat')){
						$('span.cat-title').text(filterName);
						$('span.sub-cat-title').text('ALL');

					} else {
						$('span.sub-cat-title').text(filterName);
						$('span.cat-title').text('GENERAL');
					}

					_this.truncateText();

					return false;
				}
			});
		},
		searchOveride: function(){
			$('form[role="search"]').submit(function(event){
				event.preventDefault();				

				var inputVal = $('input[name="s"]').val();			

				if (( inputVal == '')||( inputVal == ' ')) {					
			      	event.preventDefault();
			      	return;
			    }else{			    	
			    	window.location.assign( '/search/' + encodeURIComponent(inputVal) ); 

			    }	
					
			});

		}

	

	});

	return News;

});