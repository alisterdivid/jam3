define(['Class','jquery','utils/FullscreenController','Global', 'libjs/utils/Util', 'utils/GA'],function(Class,$,FullscreenController,Global, Util, GA) {

	var HIDE_DELAY = 2.0; //time before hiding controls when we enter/exit fullscreen
	var INITIAL_HIDE_DELAY = 3.5; //initial time before hiding controls

	var VideoControls = new Class({
		initialize: function(videoPlayer, label) {
			//console.log('videoPlayer', videoPlayer);
			this.label = label || '';
			this.videoPlayer = $(videoPlayer);
			this.video = this.videoPlayer.find('video').first();
			this.videoSource = this.video.find('source').first();
			this.src = this.videoSource.attr('src');
			this.playContainer = this.videoPlayer.find('.play-container').first();
			this.bottomBar = this.videoPlayer.find('.bottom-bar').first();
			this.playButton = this.videoPlayer.find('.play-button').first();
			this.loader = this.videoPlayer.find('.loaderDiv').first();
			this.playToggle = this.videoPlayer.find(".play-toggle").first();
			this.muteToggle = this.videoPlayer.find(".mute-toggle").first();
			this.fullscreenToggle = this.videoPlayer.find(".fullscreen-toggle").first();
			this.playSVG = this.videoPlayer.find(".play-svg").first();
			this.pauseSVG = this.videoPlayer.find(".pause-svg").first();
			this.volumeLines = this.videoPlayer.find(".volume-lines").first();
			this.playButtonOut = this.videoPlayer.find(".play-button .out");
			this.playButtonOver = this.videoPlayer.find(".play-button .over");
			this.playButtonOutTriangle = this.videoPlayer.find('.out .play-button-triangle');
			this.playButtonBorder = this.videoPlayer.find(".over .play-button-border");
			this.playButtonTriangle = this.videoPlayer.find(".over .play-button-triangle");
			this.loadedBar = this.videoPlayer.find(".loaded").first();
			this.playedBar = this.videoPlayer.find(".played").first();
			this.elapsedTimeLabel = this.videoPlayer.find(".elapsed-time").first();
			this.totalTimeLabel = this.videoPlayer.find(".total-time").first();
			this.progress = this.videoPlayer.find('.progress-container').first();
			this.fullscreen = new FullscreenController(this.videoPlayer[0]);
			this.fullscreen.onChange.add(this.checkVideoState.bind(this));
			if (!this.fullscreen.available) this.fullscreenToggle.remove();
			this.lastTime = 0;

			this.hideControlsTimeout = null;

			this.hideControlsBound = this.hideControls.bind(this);
			this.showControlsBound = this.showControls.bind(this);
			this.started = false;
  			this.ended = false;

			console.log(Util.support.isIPhone)

			if (Global.isMobile) {
				this.videoPlayer.css({'width': '100%'});
				this.video.attr('width','100%');

				Global.onVideoFullScreenChange.add(this.updateVideoSize.bind(this));
			}

			if (Util.support.isIPhone || Util.support.isIPod || Util.support.isIPad) {
				this.muteToggle.hide();
			}

			TweenLite.set(this.fullscreenToggle.find('.path1').first(),{y: 3});
			TweenLite.set(this.fullscreenToggle.find('.path2').first(),{y: 3});

			this.volumeLineHeights = [];
			this.volumeLineYPos = [];
			for (var i = 0; i < this.volumeLines[0].childNodes.length; i++) {
				if (this.volumeLines[0].childNodes[i].tagName) {
					this.volumeLineHeights.push(this.volumeLines[0].childNodes[i].getAttribute("height"));
					this.volumeLineYPos.push(this.volumeLines[0].childNodes[i].getAttribute("y"));
				}
			}

			if(Global.isMobile) {
				this.playContainer.on('click', function() {
					this.togglePlay();
					this.play();
				}.bind(this));
			}

			// Click & Tap functionality
			if(!Global.isMobile){
				// DESKTOP
				// If video is clicked paused video
				this.playContainer.on('click', this.togglePlay.bind(this));

				this.videoPlayer.on('mousemove', this.showControlsBound);
				this.videoPlayer.on('mouseleave', this.hideControlsBound);

				this.playButton.on('mouseenter',this.playOver.bind(this));
				this.playButton.on('mouseleave',this.playOut.bind(this))

				this.fullscreenToggle.on('mouseenter',this.fullscreenOver.bind(this));
				this.fullscreenToggle.on('mouseleave',this.fullscreenOut.bind(this));
				this.progress.on('mousedown',this.onProgressDown.bind(this));
			} else {
				if(!Util.support.isIPhone && !Util.support.isIPod && !Util.support.isIPad){
					this.playContainer.on('click', this.toggleControls.bind(this));
				}
				// If video is tapped bring up controls
			}

			this.video.on("play", this.updateTotalTime.bind(this));
			this.video.on("waiting", this.showBuffering.bind(this));
			this.video.on("stalled", this.showBuffering.bind(this));
			this.video.on("pause",this.onPause.bind(this));
			this.video.on("playing",this.onPlay.bind(this));
			this.video.on("timeupdate",this.onTimeUpdate.bind(this));
			this.video.on("progress",this.onProgress.bind(this));
			this.video.on("canplaythrough",this.onProgress.bind(this));
			this.video.on("ended", this.onEnd.bind(this));
			this.playButton.on('click',this.play.bind(this));
			this.playToggle.on('click',this.togglePlay.bind(this));
			this.muteToggle.on('click',this.toggleMute.bind(this));
			this.fullscreenToggle.on('click',this.toggleFullscreen.bind(this));
			this.progress.on('click',this.onProgressClick.bind(this));

			if (Global.isMobile) {
				this.video.on("canplaythrough",this.hideBuffering.bind(this));
				this.video.on("timeupdate",this.hideBuffering.bind(this));
				this.video.on("playing",this.hideBuffering.bind(this));
			}

			this.video = this.video[0];

			this.videoLoadComplete = false;
			this.videoLoadStartedAt = null;
			this.checkBuffer = this.checkBuffer.bind(this);

			//will perform iPhone check
			this.setPlayButtonVisible(true);
		},

		checkBuffer: function(){
			if (this.videoLoadComplete) return;
			if (!this.videoLoadStartedAt){
				this.videoLoadStartedAt = (new Date()).getTime();
			}
			var keepChecking = true;
			if (this.video.readyState && this.video.buffered){
				var percent = (this.video.buffered.end(0) / this.video.duration) + 0.01;
				if (percent >= 0.98){
					this.videoLoadCompleted();
					keepChecking = false;
				}
			}
			if (keepChecking) {
				this.bufferTimeout = setTimeout( this.checkBuffer, 500 );
			}
		},

		videoLoadCompleted: function(){
			this.videoLoadComplete = true;
			// Calculated ownload time
			var now = (new Date()).getTime();
			var diff = now - this.videoLoadStartedAt;
			var seconds = diff / 1000;
			GA.trackEvent('Video', 'Video Load Time', this.label, seconds);
		},

		setHideControlsTimeout: function(){
			if (this.hideControlsTimeout){
				clearTimeout(this.hideControlsTimeout);
				this.hideControlsTimeout = null;
			}
			this.hideControlsTimeout = setTimeout( this.hideControlsBound, HIDE_DELAY*1000 );
		},

		formatTime: function(seconds) {
			if (isNaN(seconds))
				return "";

			var m = Math.floor(seconds / 60);
			var s = Math.floor(seconds - (m * 60));

			(m < 10) && (m = '0' + m);
			(s < 10) && (s = '0' + s);

			return m + ":" + s;
		},
		showControls: function() {
			if (!this.barVisible || this.ended) return
			this.bottomBar.css('visibility','visible');
			TweenLite.to(this.bottomBar,0.3,{bottom: 0, ease: Expo.easeOut});
			this.setHideControlsTimeout();
		},
		hideControls: function() {
			if (!this.barVisible) return
			TweenLite.to(this.bottomBar,0.3,{bottom: -60, ease: Expo.easeIn, onComplete: function() {
				this.bottomBar.css('visibility','hide');
			}.bind(this)});
		},
		toggleControls: function(){
			TweenLite.killDelayedCallsTo(this.hideControlsBound);

			if(this.bottomBar.css('visibility') == 'visible'){
				TweenLite.to(this.bottomBar,0.3,{bottom: -60, ease: Expo.easeIn, onComplete: function() {
					this.bottomBar.css('visibility','hidden');
				}.bind(this)});
			} else {
				this.bottomBar.css('visibility','visible');
				TweenLite.to(this.bottomBar,0.3,{bottom: 0, ease: Expo.easeOut});
			}
		},
		updateTotalTime: function() {
			this.totalTimeLabel.html(this.formatTime(this.video.duration));
		},
		play: function() {
			this.playButtonOut.css('display','none');
			this.playButtonTriangle.css('display',"none");
			var pathLength = this.playButtonBorder[0].getTotalLength();
			var length = pathLength;
			var distancePerPoint = 6;
			var increaseLength = function() {
				length -= distancePerPoint;
				this.playButtonBorder.css('strokeDasharray',length + ' ' + pathLength);
				distancePerPoint += 0.6;
				if (length <= 0) {
					this.barVisible = true;
					this.showControls();
					this.video.play();
					this.playButton.css('display',"none");
					this.bottomBar.css('visibility',"visible");
				} else {
					requestAnimationFrame(increaseLength);
				}
			}.bind(this);
			requestAnimationFrame(increaseLength);

		},
		playOver: function() {
			TweenLite.to(this.playButtonOver,0.4,{width: '100%', ease: Expo.easeOut});
			TweenLite.to(this.playButtonOutTriangle,0.4,{x: 49, ease: Expo.easeOut});
			TweenLite.fromTo(this.playButtonTriangle,0.4,{x: -49, ease: Expo.easeOut},{x: 0, ease: Expo.easeOut});
		},
		playOut: function() {
			TweenLite.to(this.playButtonOver,0.4,{width: '0%', ease: Expo.easeIn});
			TweenLite.to(this.playButtonOutTriangle,0.4,{x: 0, ease: Expo.easeIn});
			TweenLite.to(this.playButtonTriangle,0.4,{x: -49, ease: Expo.easeIn});
		},
		showBuffering: function() {
			if (Util.support.isIPhone || Util.support.isIPod)
				return;

			this.loader.css('visibility','visible');
		},
		hideBuffering: function() {
			this.loader.css('visibility','hidden');
		},
		onPause: function() {
			this.playSVG.css('display','none');
			this.pauseSVG.css('display','block');
		},
		onPlay: function() {
			this.pauseSVG.css('display',"none");
			this.playSVG.css('display',"block");
			this.loader.css('visibility',"hidden");
			Global.videoPlaying = true;


			if (!this.started) {
				TweenLite.delayedCall(INITIAL_HIDE_DELAY, this.hideControlsBound);
				this.started = true;
        this.ended = false;
				this.updateTotalTime();
			}
		},
		togglePlay: function() {
			//console.log("TOGGLE PLAY");

      // run play button animation on clicking video container (instead of play button) for the first time
      // or after video has ended
      if (!this.started) this.play();

			if (this.video.paused) {
				Global.videoPlaying = true;
				GA.trackEvent('Video', 'Play', this.label);
				
				if(!Util.support.isIPhone && !Util.support.isIPod && !Util.support.isIPad)
					this.checkBuffer();
				
				this.video.play();
			} else {
				Global.videoPlaying = false;
				this.video.pause();
				GA.trackEvent('Video', 'Pause', this.label, this.video.currentTime);
				if (!Global.videoInFullScreen)
					Global.onVideoInactive.dispatch();
			}
		},
		toggleMute: function() {
			//console.log("TOGGLE MUTE");
			if (this.video.muted) {
				GA.trackEvent('Video', 'UnMute', this.label);
				this.video.muted = false;
				for (var i = 0; i < this.volumeLines[0].children.length; i++) {
					TweenLite.to(this.volumeLines[0].children[i],0.1,{attr: {height:  this.volumeLineHeights[i], y: this.volumeLineYPos[i]}, delay: 0.04*1});
				}
			} else {
				GA.trackEvent('Video', 'Mute', this.label);
				this.video.muted = true;
				var midY = (parseInt(this.muteToggle.children('svg').first().attr('height'))-1)*0.5;
				for (var i = 0; i < this.volumeLines[0].children.length; i++) {
					TweenLite.to(this.volumeLines[0].children[i],0.1,{attr: {height:  1, y: midY}, delay: 0.04*1});
				}
			}
		},
		toggleFullscreen: function() {
			if (this.fullscreen.active()) {
				TweenLite.delayedCall(HIDE_DELAY, this.hideControlsBound);
				this.fullscreen.stop();
				this.videoPlayer.on('mousemove',function(){
					this.showControls();
					TweenLite.delayedCall(INITIAL_HIDE_DELAY, this.hideControlsBound);
				}.bind(this));
			} else {
				// Enter fullscreen
				GA.trackEvent('Video', 'Fullscreen', this.label);
				TweenLite.delayedCall(HIDE_DELAY, this.hideControlsBound);
				this.fullscreen.start();
				this.videoPlayer.off('mousemove',function(){
					this.showControls();
					TweenLite.delayedCall(INITIAL_HIDE_DELAY, this.hideControlsBound);
				}.bind(this));
			}
		},
		checkVideoState: function() {
			if (this.fullscreen.active()) {
				this.videoPlayer.css({'max-width': 'initial', 'background-color': '#000000'});
			} else {
				this.videoPlayer.css({'max-width': '', 'background-color': ''});
			}
		},
		fullscreenOver: function() {
			var notch = this.fullscreenToggle.find('.path2').first();
			TweenLite.to(notch[0],0.125,{y: 0, x: 3, ease: Linear.easeNone, overwrite: true});
		},
		fullscreenOut: function() {
			var notch = this.fullscreenToggle.find('.path2').first();
			TweenLite.to(notch[0],0.125,{y: 3, x: 0, ease: Linear.easeNone, overwrite: true});
		},
		onTimeUpdate: function() {
			this.elapsedTimeLabel.html(this.formatTime(this.video.currentTime));
			TweenLite.to(this.playedBar,this.video.currentTime-this.lastTime,{width: Math.floor(this.video.currentTime / this.video.duration * 100) + '%', ease: Linear.easeNone, overwrite: true});
			this.lastTime = this.video.currentTime;
		},
		onProgress: function() {
			if (this.video.buffered.length>0)
				TweenLite.to(this.loadedBar,0.2,{width: Math.floor(this.video.buffered.end(0) / this.video.duration * 100) + '%', ease: Linear.easeNone, overwrite: true});
		},
		onProgressClick: function(e) {
			var perc = (e.clientX-this.progress.offset().left)/this.progress.width();
			this.video.currentTime = (perc*this.video.duration);
			this.onTimeUpdate();
		},
		onProgressDown: function(e) {
			this.progress.on('mousemove',this.onProgressClick.bind(this));
			$(document).on('mouseup',this.onProgressClean.bind(this));
		},
		onProgressClean: function(e) {
			GA.trackEvent('Video', 'Seek', this.label, this.video.currentTime);
			this.progress.off('mousemove');
			$(document).off('mouseup');
		},
		setPlayButtonVisible: function(vis) {
			if ((Util.support.isIPhone || Util.support.isIPod) && Util.support.iosVer[0] < 11){
				vis = false;
			}
			this.playButton.css('display', vis ? "block" : "none");
			this.playButtonOut.css('display', vis ? 'block' : "none");
			this.playButtonTriangle.css('display', vis ? "block" : "none");
      console.log(this.playButtonBorder)
		},
		onEnd: function(e) {
			Global.videoFinished = true;
			Global.videoPlaying = false;
			Global.onVideoInactive.dispatch();
			this.hideControls();
			this.setPlayButtonVisible(true);
			this.started = false;
      this.ended = true;

      this.playButtonBorder.removeAttr('style');

			if (this.fullscreen.available && this.fullscreen.active()) {
				this.fullscreen.stop();
				TweenLite.delayedCall(HIDE_DELAY, this.hideControlsBound);
			}

			if (!Util.support.isIPhone && !Util.support.isIPod)
				this.video.load();
		},
		updateVideoSize: function() {
			if (Global.isMobile) {
				var videoHeight = this.videoPlayer.outerWidth() / 1.76678445229682;
				$(this.video).css("height", Global.videoInFullScreen ? "inherit" : videoHeight );
			}
		},
	});
	return VideoControls;
});
