require([
	'jquery',
	'Global',
	'managers/WorldManager',
	'ui/BorderButtons',
	'TweenLite',
	'utils/GA',
	'underscore',
	'ui/VideoControls',
	'ColorPropsPlugin',
], function (
	$,
	Global,
	WorldManager,
	BorderButtons,
	Tweenlite,
	GA,
	_,
	VideoControls
) {

	var worldManager;

	init();
	function urlParam(name) {
	    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
	    //console.log(name, results);
	    if (results==null){
	       return undefined;
	    } else if(results[1] == "true"){
	    	return true;
	    } else if(results[1] == "false"){
	    	return false;
	    } else if(!isNaN(results[1])){
	    	return parseInt(results[1]);
	    } else {
	    	return results[1] || false;
	    }
	};

	function init() {
		$('.front-page').attr('id','particles');
		$('.front-page').empty();
		$('.front-page').append(
			'<a href="/work" class="homeButtons">'
		+'<div id="work-btn" class="btn btn-white site-link">'
			+'<span id="workText" class="workText">Sign Up</span>'
		+'</div>'
		+'<div class="divider"></div>'
		+'<div id="reel-btn" class="btn btn-white site-link">'
			+'<span id="reelText" class="reelText">Talk To Ai</span>'
		+'</div>'
		+'</a>'
		+'<div class="homeVideoPlayer">'
			+ '<video id="video" class="video" preload="auto" width="100%" >'
				 +	'<source src="https://player.vimeo.com/external/180616925.hd.mp4?s=ca8fb1d2c5b922942bb4daa0c0aeb97a5e540190&profile_id=119" type="video/mp4" />'
				 + '</video>' 
				 + '<div class="video-controls">'
				 + '<section class="play-container">'
				 + '<div class="play-button">'
						+	'<div class="out">'
							+	'<svg width="82" height="82">'
								+	'<path d="M0,41V82H82V0H0V41V41" stroke="#FFFFFF" stroke-width="4" fill="none" class="play-button-border">'
								+	'</path>'
								+	'<polygon points="33,31 49,41 33,51" fill="#FFFFFF" class="play-button-triangle"></polygon>'
							+	'</svg>'
						+	'</div>'
						+	'<div class="over">'
							+	'<svg width="82" height="82">'
								+	'<path d="M0,41V82H82V0H0V41V41" stroke="#919191" stroke-width="4" fill="none" class="play-button-border">'
								+	'</path>'
								+	'<polygon points="33,31 49,41 33,51" fill="#919191" class="play-button-triangle"></polygon>'
							+	'</svg>'
						+	'</div>'
					+	'</div>'
					+ '<div class="loaderDiv">'
						+	'<svg height="32" width="35" class="loader">'
							+	'<circle cx="5" cy="5" r="5" fill="#FFFFFF"></circle>'
							+	'<circle cx="30" cy="5" r="5" fill="#FFFFFF"></circle>'
							+	'<circle cx="17.5" cy="26.65" r="5" fill="#FFFFFF"></circle>'
						+	'</svg>'
					+	'</div>'
				+	'</section>'
					+ '<section>'
					+	'<div class="bottom-bar">'
						+	'<div class="progress-container">'
							+	'<div class="bar loaded"></div>'
							+	'<div class="bar played"></div>'
							+	'<div class="label-container">'
								+	'<div class="elapsed-time label">00:00</div>'
								+	'<div class="total-time label">00:00</div>'
							+	'</div>'
						+	'</div>'
						+	'<div class="button-container">'
							+	'<div class="button-wrapper">'
								+	'<div class="button play-toggle">'
									+	'<svg width="13" height="17" class="play-svg">'
										+	'<rect width="5" height="17"></rect>'
										+	'<rect width="5" height="17" x="8"></rect>'
									+	'</svg>'
									+	'<svg height="17" width="13" class="pause-svg">'
										+	'<polygon points="0,0 13,8.5 0,17"></polygon>'
									+	'</svg>'
								+	'</div>'
								+	'<div class="button mute-toggle">'
									+	'<svg height="17" width="17">'
										+	'<polygon points="0,8.5 9,0 9,17"></polygon>'
										+	'<g class="volume-lines">'
											+	'<rect width="1" height="1" x="10" y="8"></rect>'
											+	'<rect width="1" height="3" x="12" y="7"></rect>'
											+	'<rect width="1" height="7" x="14" y="5"></rect>'
											+	'<rect width="1" height="11" x="16" y="3"></rect>'
										+	'</g>'
									+	'</svg>'
								+	'</div>'
								+	'<div class="button fullscreen-toggle">'
									+	'<svg width="28" height="20" class="fullscreen-svg">'
										+	'<path d="m 0,0 0,1.7895 0,13.421 0,1.7895 1.7857143,0 21.4285717,0 1.785714,0 0,-1.7895 0,-6.2631 -3.571429,0 0,4.4737 -17.8571424,0 0,-9.8422 12.5000004,0 0,-3.5789 -14.2857147,0 -1.7857143,0 z" class="path1">'
										+	'</path>'
										+	'<path d="m 19,0 0,3.5391 2.325359,0 0,2.4609 3.674641,0 0,-4.2304 0,-1.7696 -1.837321,0 -4.162679,0 z" class="path2">'
										+	'</path>'
									+	'</svg>'
								+	'</div>'
							+	'</div>'
						+	'</div>'
					+	'</div>'
				+	'</section>'
			+	'</div>'
		+	'</div>'
	+ '</div>'
		);

		var $videoContainer = $('.homeVideoPlayer');
		var videoPlayer;

		if ($videoContainer.length > 0) {
    	videoPlayer = new VideoControls($videoContainer.last());
    }

		var FSHandler = function() {
			var isFullScreen = document.fullscreenElement ||
										     document.webkitFullscreenElement ||
										     document.mozFullScreenElement ||
										     document.msFullscreenElement;

			if (!isFullScreen) {
				$videoContainer.css({'display' : 'none' });
				videoPlayer.video.pause();
				videoPlayer.video.currentTime = 0;
				worldManager.unpause();
			}
		}
	
		Global.introTextResized.add(function(width, height){
			console.log('height: ', height);
			var spacing = 38;
			TweenLite.to($('.homeButtons'), 0.3, {
				paddingTop: height + spacing,
				//background: 'rgba(0,0,0,0.5)',
				width: width, 
				marginLeft: -(width*0.5),
				marginTop: -(height*0.5)
			});
		});

		TweenLite.set($('.homeButtons #work-btn'), {x: 40, opacity: 0});
		TweenLite.set($('.homeButtons #reel-btn'), {x: -40, opacity: 0});
		TweenLite.set($('.homeButtons .divider'), {scaleX: 0});

		/*
		$('.homeButtons').on('mouseover', function(){
			var seeBtn = new BorderButtons(232, 75, $(this).find('div.btn'), 'right', "VIEW WORK", 2, 2);
		}).on('mouseleave', function(){
			var btnBorder = $(this).find('.btnBorder');
			btnBorder.remove();

		});
		*/

		$('.homeButtons').on('mouseover', function(){
			$('#work-btn').addClass('btn-hover');
		});

		worldManager = new WorldManager({
			defaultPreset: "garcia_6.json",
			bgColor: 0xffffff,
			delayParticlesFrames: 100,

			// If canvas renderer is detected, this will
			// divide the particle count by N to improve
			// performance.
			degradeAmount: 4,
		});

		worldManager.particlesPaused = true;

		var renderThrottled = _.throttle(worldManager.renderOnce.bind(worldManager), 100, { leading: true, trailing: true });
		Global.onResize.add(function() {
			if (Global.menuOpen)
				renderThrottled();
		});

		Global.introTextAnimatedIn.add(function(){
			worldManager.particlesPaused = false;
			TweenLite.to($('.homeButtons .divider'), 0.5, {scaleX: 1, ease: Expo.easeOut});
			TweenLite.to($('.homeButtons #work-btn'), 0.75,{delay: 0.5, x: 0, opacity: 1, ease: Expo.easeOut});
			TweenLite.to($('.homeButtons #reel-btn'), 0.75,{delay: 0.7, x: 0, opacity: 1, ease: Expo.easeOut});
		});

		Global.navOpened.add(function(){
			$('.homeButtons')[0].style.pointerEvents = 'none';
			worldManager.pause();
		});

		Global.navClosed.add(function() {
			$('.homeButtons')[0].style.pointerEvents = 'visible';
			worldManager.unpause();
		});

		// $('#work-btn').on('click', function(e){
		// 	GA.trackEvent('Navigation', 'IntroClick', 'View Work');
		// 	worldManager.pause();
		// 	TweenLite.to($('main.front-page'), 0.3, {autoAlpha: 0, ease: Expo.easeOut});
		// 	window.location.href = '/work';
		// });

		$('.homeButtons').on('click', function(e){
			GA.trackEvent('Navigation', 'IntroClick', 'View Work');
			worldManager.pause();
			TweenLite.to($('main.front-page'), 0.3, {autoAlpha: 0, ease: Expo.easeOut});
		});

		$videoContainer.on("fullscreenchange", FSHandler);
		$videoContainer.on("webkitfullscreenchange", FSHandler);
		$videoContainer.on("mozfullscreenchange", FSHandler);
		$videoContainer.on("MSFullscreenChange", FSHandler);

		$('#reel-btn').click(function(e) {
			e.stopPropagation();
			worldManager.pause();
			// $videoContainer.css({'display' : 'block' });
	 		// videoPlayer.toggleFullscreen();
	 		// videoPlayer.play();
	 		window.location.href = '/our-approach';


			return false;
		});
	}
});