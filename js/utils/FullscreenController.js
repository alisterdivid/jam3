define(['Class','lib/LibJS/signals/Signal', 'Global'], function(Class,Signal,Global) {
	var FullscreenController = new Class({
		newSpec: false,
		available: true,
		target: null,
		prefix: "",
		active: false,
		onChange: null,
		initialize: function(target) {
			this.target = target;
			this.findPrefix();
			this.onChange = new Signal();

			document.addEventListener(this.prefix+"fullscreenchange",this._onChange.bind(this));
		},
		findPrefix: function() {
			if (typeof(document["exitFullscreen"])!="undefined") {
				this.newSpec = true;
			} else {
				var arr = ["webkit","moz","ms","o"];
				for (var i=0; i<arr.length; i++) {
					if (typeof(document[arr[i]+"CancelFullScreen"])!="undefined") {
						this.prefix = arr[i];
						return;
					}
				}
				if (typeof(document["cancelFullScreen"])=="undefined") { this.available = false; }
			}
		},
		_onChange: function() {
			if (this.newSpec) {
				if (document["fullscreenElement"]==null) this.onChange.dispatch();
			} else {
				if (document[(this.prefix!="")?this.prefix+"FullScreenElement":"fullScreenElement"]==null) this.onChange.dispatch();
			}
		},
		start: function(target) {
			Global.videoInFullScreen = true;
			var obj = (target!=null) ? target : this.target;
			if (this.newSpec) {
				obj["requestFullscreen"]();
			} else {
				obj[(this.prefix!="")?this.prefix+"RequestFullScreen":"requestFullScreen"]();
			}
			Global.onVideoFullScreenChange.dispatch();
		},
		stop: function() {
			Global.videoInFullScreen = false;
			if (this.newSpec) {
				document["exitFullscreen"]();
			} else {
				document[(this.prefix!="")?this.prefix+"CancelFullScreen":"cancelFullScreen"]();
			}
			Global.onVideoFullScreenChange.dispatch();
		},
		active: function() {
			if (this.newSpec) {
				return (document["fullscreenElement"]!=null);
			} else {
				return (this.prefix=="") ? document["fullScreen"] : (typeof(document[this.prefix+"IsFullScreen"])!="undefined") ? document[this.prefix+"IsFullScreen"] : document[this.prefix+"FullScreen"];
			}
		}
	});
	return FullscreenController;
});