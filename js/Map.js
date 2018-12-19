define(['Class', 'Global', 'jquery', 'TweenLite', 'TimelineLite', 'jquery.mCustomScrollbar', 'utils/GA'],function(Class, Global, $, TweenLite, TimelineLite, mCustomScrollbar, GA) {

	var Map = new Class({

		directionsService: null,
		map: null,
		latlng: null,
		jam3Location: null,
		directionsDisplay: null,
		myOptions: null,
		currentCenter: null,
		mapcanvas: null,
		latlng: null,
		travelMode: null,
		icons: null,
		departureMarker: null,

		footerHeight: 65,
		defaultMapHeight: 160,

		initialize: function(){

			var _this = this;

			GA.setPageID('contact');

			this.directionsService = new google.maps.DirectionsService(),
			this.jam3Location =  new google.maps.LatLng(43.647273, -79.392642);

			if (Global.isMobile && Global.windowHeight >= 800) {
				// IPAD
				this.defaultMapHeight = 400;
			}
			console.log('Global.windowHeight: ', Global.windowHeight);

			// TODO: Update this URL when site goes live.
			var iconBase = '../wp-content/themes/jam3/assets/img/icons/';
			this.icons = {
				home:{
					url: iconBase +'home-icon.png',
				    anchor: new google.maps.Point(10, 36),
				    scaledSize: new google.maps.Size(20,36)
				},
				departure:{
					url: iconBase + 'start-icon.png',
				    anchor: new google.maps.Point(10, 36),
				    scaledSize: new google.maps.Size(20,36)
				}
			};

			this.loadMap();

			this.success = this.success.bind(this);

			// Display travel steps on option click
			$('#travelMethod').on('click', 'li a', function(e){

				// console.log('#travelMethod');

				var travelMethodType = $(this).data('traveltype');
				var currentLi = $(this).parent(); // The selected list item

				// Toggle selected class for map options.
				currentLi.toggleClass('selected');

				if (currentLi.hasClass('selected')){
					currentLi.siblings().removeClass('selected');
					_this.travelMethod(travelMethodType);
					_this.slideTravelMode(travelMethodType);
				} else {
					// Close
					// TweenLite.to(currentLi.find('.directions-panel'), 0.5, {height:0, maxHeight:0, ease:Expo.easeInOut, onComplete: function(){
					//	}});
					_this.closeTravelMode();
				}
				e.preventDefault();
			});

			// Open and close right drawer
			$('#map-right').on('click', '.map-slide-trigger.open', function(e){
				_this.closeDrawer(true); // Close partially
				e.preventDefault();
			});

			// Travel mode close button
			$('#map-right .close-but').on('click', _this.closeTravelMode.bind(this));

			$('a#currentLocationBtn').on('click', function(e){
				$this = $(this);
				// Check if active
				if ($this.hasClass('active')){
					$this.removeClass('active')
					_this.clearSearch();
					return;
				}
				$this.addClass('active');
				$('#search-icon').addClass('icon-cross').removeClass('icon-search');
				$('#mapSearch').val('').attr('placeholder', 'CURRENT LOCATION');
				if (Global.isMobile){
					// Mobile
					$('.location-section ').fadeOut('fast');
					//Display directions from Users location
					_this.getLocation();
					_this.mobileOpen();
				} else {
					$('#map-right').removeClass('mobileDirection');
					//Display directions from Users location
					_this.getLocation();
					//Open Info Panel
					_this.openDrawer();
				}
				e.preventDefault();
			});


			//mobile/tabletPortrait specific stuff
			if (Global.isMobile){

				$('#mapSearch').keyup(function() {
					var value = $(this).val();
					if(value !== ''){
						$('.location-section').fadeOut('fast');
					} else {
						$('.location-section').fadeIn('fast');
					}
				});

				this.hideFooter();

				// Hammer($('#map')[0]).on('tap', '#mapcanvas', function(ev) {
				// 	console.log('#map');
				// 	ev.gesture.preventDefault();
				// 	this.returnMobileMap();
				// 	$('#travelMethod li').removeClass('selected');
				// 	$('.directions-panel').slideUp('fast');
				// });

				// Hammer($('#map-right')[0]).on('swipedown', function(ev) {
				// 	console.log('#map-right');
				// 	ev.gesture.preventDefault();
				// 	this.returnMobileMap();
				// });
			}

			// Make the whole page grey on iPad
			if (Global.currentWidthType == 'tabletPortrait'){
				$('#content-wrap').css('background', '#f7f7f7');
			}

			// Track location input on blur
			$('#mapSearch').on('blur', function(){
				var $this = $(this);
				var value = $this.val();
				GA.trackEvent('Contact', 'LocationRequest', value);
			});

			$('#travelMethod').on('click', '.adp-directions tr', function(){
				var $this = $(this);
				var step = parseInt($this.attr('jsinstance'), 10);
				step += 1;
				GA.trackEvent('Contact', 'ContactClick', 'DirectionsInstructionStep', step);
			});

			// GA track
			$('.location-section a[href^="mailto:"]').one('mouseover', function(){
				var email = $(this).attr('href').replace('mailto:', '');
				GA.trackEvent('Interaction', 'ContactHover', email);
			});
			$('.location-section').one('click', 'a[href^="mailto:"]', function(){
				var email = $(this).attr('href').replace('mailto:', '');
				GA.trackEvent('Interaction', 'ContactClick', email);
			});


			// Make the map responsive to height as well as width
			$(window).resize(this.resize.bind(this));
			this.resize();

		},

		openDrawer: function(){
			var _this = this;
			//Open slide drawer for tabletLandscape/Desktop view
			var animateDistance = $('#map-right').outerWidth();
			var rowWidth = $('.map-wrap').width();

			var resizeMapWidth = rowWidth - animateDistance;

			TweenLite.to($('#map-right'), 0.5, {right: 0, ease: Expo.easeInOut } );
			TweenLite.to($('#travelMethod'), 0.3, {opacity:1});
			TweenLite.to($('#map-right .close-but'), 0.3, {autoAlpha:1});

			$('.map-slide-trigger').removeClass('closed').addClass('open');

			//When the little black triangle in the drawer is clicked
			$('#map-right').off('click', '.map-slide-trigger.closed').on('click', '.map-slide-trigger.closed', function(e){
				$(this).removeAttr('style');
				_this.openDrawer();
				e.preventDefault();
			});
		},

		closeDrawer: function(partially){
			var _this = this;
			//Close slide drawer for tabletLandscape/Desktop view
			var animateDistance = $('#map-right').outerWidth();
			var map = $('#map');
			var mapWidth = map.width();

			if (partially){
				animateDistance -= 40;
			}

			TweenLite.to($('#map-right'), 0.5, {right: -animateDistance, ease: Expo.easeInOut } );
			TweenLite.to($('#travelMethod'), 0.5, {opacity:0});
			TweenLite.to($('#map-right .close-but'), 0.3, {autoAlpha:0});

			$mapSlideTrigger = $('.map-slide-trigger');
			$mapSlideTrigger.removeClass('open').removeClass('closed').attr('style', '');
			if (partially){
				$mapSlideTrigger
				.addClass('closed')
				.css({
					left: -13
				});
			}
		},

		hideFooter: function(){
			$('#mapSearch').focus(function(){
				$('#map-right').hide();
			});
			$('#mapSearch').blur(function(){
				$('#map-right').show();
			});
		},

		loadDistance: function(origin, destination){
			var _this = this;

			// Load Distances Function

			var request = {
				origin: origin,
				destination: destination,
				travelMode: google.maps.DirectionsTravelMode.DRIVING
			};

			this.directionsService.route(request, function(result, status) {

				if (status === google.maps.DirectionsStatus.OK) {
					$('#map-right h4, #travelMethod').fadeIn('fast');

					// _this.directionsDisplay.setDirections(result);
					document.querySelector('#status').innerHTML = 'You are <span class="distance">'+result.routes[0].legs[0].distance.text.replace(' ', '')+'</span> away.';
				} else {
					document.querySelector('#status').innerHTML = 'You are too far away to calculate travel time.';
					$('#map-right h4, #travelMethod').hide();
					//console.log(status)
				}
			});
		},

		loadTimes: function(origin, destination, travelMethod, travelID){
			// Load Times Function

			var request = {
				origin: origin,
				destination: destination,
				travelMode: travelMethod
			};

			if (!Global.isMobile){
				this.directionsService.route(request, function(result, status) {
					if (status === google.maps.DirectionsStatus.OK) {
						document.querySelector(travelID).innerHTML = result.routes[0].legs[0].duration.text;
					} else {
						//console.log(status)
					}
				});
			}
		},

		allLoadTimes: function (origin, destination){
			this.loadTimes(origin, destination, google.maps.DirectionsTravelMode.WALKING, '#walking');
			this.loadTimes(origin, destination, google.maps.DirectionsTravelMode.DRIVING, '#driving');
			this.loadTimes(origin, destination, google.maps.DirectionsTravelMode.BICYCLING, '#biking');

			 //If the transit option is available load it and display it
			if(this.loadTimes(origin, destination, google.maps.DirectionsTravelMode.TRANSIT, '#transit') != 'undefined' &&
			$('#travelMethod').find('li a[data-traveltype="TRANSIT"]').length < 1){
				// $('ul#travelMethod').append('<li><a href="#" data-traveltype="TRANSIT"><i class="icon-bus"></i><span class="trip-method">I\'m taking TTC</span><span class="trip-time" id="transit"></span></a><div class="directions-panel TRANSIT tabletLandscape desktop"></div></li>');

				this.loadTimes(origin, destination, google.maps.DirectionsTravelMode.TRANSIT, '#transit');
			}
		},

		success: function(position) { //GPS current Location search
			console.log(position);
			this.latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			this.loadDistance(this.latlng, this.jam3Location);
			this.allLoadTimes(this.latlng, this.jam3Location);
			//this.travelMethod('DRIVING');
			$('#travelMethod li.selected').removeClass('selected');

		},
		error: function(msg) {
			var s = document.querySelector('#status');
			s.innerHTML = typeof msg === 'string' ? msg : 'Uh oh, we couldn\'t find you!';
			s.className = 'fail';
			console.log(msg);
		},

		travelMethod: function(travelMethodType){
			var _this = this;

			// GA
			GA.trackEvent('Contact', 'ContactClick', travelMethodType);

			if (this.departureMarker){
				this.departureMarker.setMap(null);//remove existing departure marker from map
			}

			if (travelMethodType === 'WALKING'){
				this.travelMode = google.maps.DirectionsTravelMode.WALKING;
			} else if (travelMethodType === 'BIKING'){
				this.travelMode = google.maps.DirectionsTravelMode.BICYCLING;
			} else if (travelMethodType === 'DRIVING'){
				this.travelMode = google.maps.DirectionsTravelMode.DRIVING;
			} else if (travelMethodType === 'TRANSIT'){
				this.travelMode = google.maps.DirectionsTravelMode.TRANSIT;
				// this.departureTime = now;
			}

			var request = {
				origin: this.latlng,
				destination: this.jam3Location,
				travelMode: this.travelMode
			};

				// transitOptions: {
				// 	departureTime: new Date()
				// }

			this.directionsDisplay.setMap(this.map);

			this.directionsService.route(request, function(result, status) {
				if (status === google.maps.DirectionsStatus.OK) {
					var leg = result.routes[ 0 ].legs[ 0 ];
					_this.departureMarker = _this.makeMarker( leg.start_location, _this.icons.departure, leg.start_address);
					_this.directionsDisplay.setDirections(result);
					$('#status').html( 'You are '+result.routes[0].legs[0].distance.text+' away.' );
				}
			});

			this.directionsDisplay.setPanel(document.querySelector('.directions-panel.'+travelMethodType+'.'+Global.currentWidthType));

		 // 	//Slide up non-selected travel modes
		 // 	$("#travelMethod li").not(".selected").find(".directions-panel").slideUp('slow');
		 // 	//Slide down selected
			// $('.directions-panel.'+travelMethodType+'.'+Global.currentWidthType).slideToggle(400, function(){

			// 	jQuery(this).mCustomScrollbar({autoDraggerLength: false});

			// });

			if (Global.isMobile){
				var panel = $('.directions-panel.'+travelMethodType+'.'+Global.currentWidthType);
				panel.siblings().hide();

				TweenLite.to( [this.mapcanvas, $('#map')], 0.8, {height:this.defaultMapHeight, ease: Expo.easeInOut, onComplete: function(){
					var currentCenter = this.map.getCenter();
					google.maps.event.trigger(this.map, 'resize');
					this.map.panTo(currentCenter);
				}.bind(this) } );

				var windowHeight = Global.windowHeight;
				var headerHeight = $('.main-header').outerHeight();
				var directionsY = headerHeight + this.defaultMapHeight;

				var directionsHeight = Global.windowHeight - directionsY;
				$('#map-right').css('height', directionsHeight);

				var panelHeight = directionsHeight - 65;
				panel.css({
					maxHeight: panelHeight,
					height: panelHeight
				});
				TweenLite.to( $('#map-right'), 0.8, {top: directionsY, ease: Expo.easeInOut, onComplete: function(){
				}.bind(this) } );

				// $('#panel').fadeOut('fast');

			} else {
				$('#map-right').removeClass('mobileDirection');
			}

		},

		slideTravelMode: function(travelMethodType){
			var _this = this;
			//Slide up non-selected travel modes
			var $notSelected = $("#travelMethod li:not(.selected)");
			// Set height
			// $notSelected.each(function(){
			// 	$this = $(this);
			// 	$this.css('height', $this.height()); 
			// });
			TweenLite.set($notSelected, {height:0});
			TweenLite.to($notSelected.find(".directions-panel"), 0.4, {height:0, ease:Expo.easeInOut});
			//Slide down selected
			var $panel = $('.directions-panel.'+travelMethodType+'.'+Global.currentWidthType);
			var height = 400;
			//debugger;
			var $mapRight = $('#map-right');
			if (!Global.isMobile){
				var mapRightHeight = $mapRight.outerHeight();
				console.log('mapRightHeight: ', mapRightHeight);
				var yOffset = $("#travelMethod li:first").position().top;
				height = mapRightHeight - yOffset - 50 - 50; // 50 is the height of li // 50 is the height of close button
			}
			TweenLite.to($mapRight.find('.close-but'), 0.75, {y:0, ease:Expo.easeOut});
			TweenLite.to($panel, 0.75, {height:height, ease:Expo.easeOut, onComplete: function(){
				// $panel
				// 	.find('.mCustomScrollBox')
				// 		.css("max-height", height);
				$panel.mCustomScrollbar({autoHideScrollbar: false, advanced: {updateOnContentResize: false}, autoDraggerLength:false, callbacks:{
					onScrollStart: function(){
						if (!_this.panelScrollTracked){
							GA.trackEvent('Contact', 'ContactScroll', 'DirectionsScroll');
							_this.panelScrollTracked = true;
						}
					}
				}});
			} });
		},

		closeTravelMode: function(){
			var $mapRight = $('#map-right');
			TweenLite.to($mapRight.find('.close-but'), 0.75, {y:50, ease:Expo.easeOut});
			TweenLite.to($("#travelMethod li .directions-panel"), 0.4, {height:0, ease:Expo.easeInOut});
			TweenLite.set($("#travelMethod li"), {height:'auto'});
			$("#travelMethod li").removeClass('selected');
			this.clearMap();
		},

		makeMarker: function( position, icon, title ) {
			return new google.maps.Marker({
					position: position,
					map: this.map,
					icon: icon,
					title: title
				});
		},

		getLocation: function(){
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(this.success.bind(this), this.error.bind(this));
			} else {
				error('not supported');
			}
		},

		loadMap: function(position) {
			var _this = this;
			var searchClicked = false;
			var places;

			//Create div with and ID of #this.mapcanvas
			this.mapcanvas = document.createElement('div');
			this.mapcanvas.id = 'mapcanvas';

			var mapstyle = [
				  {
				    "featureType": "All",
				    "elementType": "geometry.stroke",
				    "stylers": [
				      { "visibility": "simplified" }
				    ]
				  },{
				    "featureType": "landscape.man_made",
				    "elementType": "geometry.fill",
				    "stylers": [
				      { "visibility": "off" }
				    ]
				  },{
				    "featureType": "landscape.natural",
				    "elementType": "All",
				    "stylers": [
				      { "visibility": "off" }
				    ]
				  },{
				    "featureType": "poi",
				    "elementType": "All",
				    "stylers": [
				      { "visibility": "off" }
				    ]
				  },{
				    "featureType": "transit.line",
				    "elementType": "All",
				    "stylers": [
				      { "visibility": "off" }
				    ]
				  },{
				    "featureType": "landscape",
				    "elementType": "All",
				    "stylers": [
				      { "visibility": "on" }
				    ]
				  },{
				    "featureType": "road.highway",
				    "elementType": "All",
				    "stylers": [
				      { "visibility": "on" },
				      { "weight": 1.7 },
				      { "saturation": -100 },
				      { "lightness": -42 },
				      { "gamma": 2 }
				    ]
				  },{
				    "featureType": "landscape.man_made",
				    "elementType": "labels",
				    "stylers": [
				      { "visibility": "off" }
				    ]
				  },{
				    "featureType": "All",
				    "elementType": "geometry",
				    "stylers": [
				      { "saturation": -19 },
				      { "visibility": "simplified" }
				    ]
				  },{
				    "featureType": "water",
				    "elementType": "All",
				    "stylers": [
				      { "lightness": -70 },
				      { "saturation": -83 }
				    ]
				  },{
				    "featureType": "landscape",
				    "elementType": "All",
				    "stylers": [
				      { "gamma": 0.97 },
				      { "saturation": -100 },
				      { "lightness": -72 }
				    ]
				  },{
				    "featureType": "road.local",
				    "elementType": "All",
				    "stylers": [
				      { "lightness": -78 },
				      { "gamma": 2.13 }
				    ]
				  },{
				    "featureType": "road.arterial",
				    "elementType": "All",
				    "stylers": [
				      { "lightness": -74 },
				      { "gamma": 2.13 }
				    ]
				  },{
				    "featureType": "All",
				    "elementType": "labels.text.stroke",
				    "stylers": [
				      { "gamma": 0.41 }
				    ]
				  },{
				    "featureType": "All",
				    "elementType": "labels.text.stroke",
				    "stylers": [
				      { "gamma": 0.32 },
				      { "visibility": "off" }
				    ]
				  },{
				    "featureType": "All",
				    "elementType": "labels.text",
				    "stylers": [
				      { "saturation": -100 },
				      { "lightness": -100 },
				      { "gamma": 9.99 }
				    ]
				  },{
				    "featureType": "poi",
				    "elementType": "All",
				    "stylers": [
				      { "visibility": "off" }
				    ]
				  },{
				    "featureType": "All",
				    "elementType": "geometry",
				    "stylers": [
				      { "visibility": "simplified" }
				    ]
				  },{
				    "featureType": "All",
				    "elementType": "All",
				    "stylers": [
				      { "saturation": -82 },
				      { "lightness": -44 },
				      { "gamma": 0.92 }
				    ]
				  },{
				    "featureType": "All",
				    "elementType": "labels.text.fill",
				    "stylers": [
				      { "lightness": 68 }
				    ]
				  },{
				    "featureType": "poi",
				    "elementType": "All",
				    "stylers": [
				      { "visibility": "off" }
				    ]
				  },{
				    "featureType": "transit.line",
				    "elementType": "All",
				    "stylers": [
				      { "visibility": "simplified" },
				      { "lightness": -60 }
				    ]
				  },{
				    "featureType": "landscape.natural",
				    "elementType": "All",
				    "stylers": [
				      { "visibility": "on" }
				    ]
				  },{
				    "featureType": "road.local",
				    "elementType": "All",
				    "stylers": [
				      { "lightness": -59 }
				    ]
				  },{
				    "featureType": "road.arterial",
				    "elementType": "All",
				    "stylers": [
				      { "saturation": 7 },
				      { "hue": "#0066ff" },
				      { "gamma": 0.89 }
				    ]
				  },{
				    "featureType": "transit",
				    "elementType": "All",
				    "stylers": [
				      { "lightness": -38 },
				      { "gamma": 1.5 }
				    ]
				  },{
				    "featureType": "water",
				    "elementType": "All",
				    "stylers": [
				      { "hue": "#0022ff" },
				      { "gamma": 1.38 },
				      { "lightness": -32 },
				      { "saturation": -4 }
				    ]
				  },{
				    "featureType": "administrative",
				    "elementType": "All",
				    "stylers": [
				      { "lightness": -64 }
				    ]
				  },{
				    "featureType": "administrative.locality",
				    "elementType": "All",
				    "stylers": [
				      { "lightness": 70 }
				    ]
				  },{
				    "featureType": "All",
				    "elementType": "All",
				    "stylers": [
				      { "saturation": 1 },
				      { "hue": "#0022ff" }
				    ]
				  },{
				    "featureType": "transit",
				    "elementType": "All"  },{
				    "featureType": "road.local",
				    "stylers": [
				      { "gamma": 0.89 }
				    ]
				  },{
				    "elementType": "labels.text.fill",
				    "stylers": [
				      { "lightness": 16 },
				      { "gamma": 1.03 }
				    ]
				  }
				];

			//Set height of map depending on width of browser
			if (Global.isMobile){
				this.mapcanvas.style.height = this.defaultMapHeight+'px';
				$('#map-right').addClass('mobileOption');
				//Map options (mobile doesn't have the navigation)
				this.myOptions = {
					zoom: 17,
					center: this.jam3Location,
					mapTypeControl: false,
					panControl: false,
					zoomControl: false,
					scaleControl: false,
					streetViewControl: false,
					overviewMapControl: false,
					mapTypeId: google.maps.MapTypeId.ROADMAP,
					styles: mapstyle
				};
			} else {
				//Map options (desktop has the SMALL navigation)
				this.myOptions = {
					zoom: 16,
					center: this.jam3Location,
					mapTypeControl: false,
					navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
					zoomControlOptions: {style: google.maps.ZoomControlStyle.SMALL},
					mapTypeId: google.maps.MapTypeId.ROADMAP,
					styles: mapstyle,
					disableDefaultUI: true
				};
			};

			//Set width of map
			this.mapcanvas.style.width = '100%';

			//Find #map and append the #this.mapcanvas div we created above
			document.querySelector('#map').appendChild(this.mapcanvas);

			//Set height of map
			//this.mapcanvas.style.height = (window.innerHeight - $('#mapcanvas').offset().top - $('.location-section').height()) + 'px';

			//Load Google Map into #this.mapcanvas
			this.map = new google.maps.Map(document.getElementById('mapcanvas'), this.myOptions);

			this.directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});
			this.directionsDisplay.setMap(this.map);

			var homeIcon = {
			    url: this.iconBase + 'map-icon.png',
			    anchor: new google.maps.Point(15, 53)
			  };

			//Set the marker to Jam3's office location
			var marker = new google.maps.Marker({
				position: this.jam3Location,
				title: 'Jam3 Office: 252 - 171 East Liberty St. Toronto, Canada, M6k3P6',
				map: this.map,
				icon: this.icons.home
			});

			//Assign #mapsearch div to variable
			var input = (document.getElementById('mapSearch'));

			//Initiate Google Places searchbox and set location
			var sw = new google.maps.LatLng(43.076846, -80.695514);
			var ne = new google.maps.LatLng(44.207738, -78.446064);

			var biasBounds = new google.maps.LatLngBounds(sw, ne);

			this.searchBox = new google.maps.places.SearchBox(input, {
				bounds: biasBounds
			});

			if (!Global.isMobile){
				google.maps.event.addListener(this.searchBox, 'places_changed', this.gotSearchResults.bind(this) );
			}
			// Google maps places suggestions are dissabled in css look for .pac-container

			$('#searchButton').click(function(){

				var searchIcon = $('#panel i');

				// Remove text inside the search bar if current icon is 'cross'
				if (searchIcon.hasClass('icon-cross')) {
					this.clearSearch();
					return;
				}

				if ($('#mapSearch').val()) {
					searchIcon.toggleClass('icon-cross icon-search'); // Only toggle the classes if there is text inside the search bar

					// var e = $.Event("keydown").bind();
					// e.which = 13;

					var service = new google.maps.places.PlacesService(_this.map);

					var q = $('#mapSearch').val();
					var placesRequest = {
						query: q,
						location: _this.jam3Location,
						radius: '40000'
					}
					// var textRequest = places.textSearch(placesRequest);
					// 	console.log(textRequest);

					service.textSearch(placesRequest, function(results, status) {
					   	if (status == google.maps.places.PlacesServiceStatus.OK) {
					    	var places = results;
							this.gotSearchResults(places);
					   	} else {
					   		console.error('Test search error');
					   		console.log('status: ', status);
					   	}
					}.bind(this));
				}
			}.bind(this));
		},

		clearSearch: function(){
			$('#mapSearch').val('').attr('placeholder', 'GET DIRECTIONS');
			$('#search-icon').removeClass('icon-cross').addClass('icon-search');
			this.resetCurrentLocationButton();
			if (Global.isMobile){
				var locationSection = $('.location-section');
				TweenLite.to( locationSection, 1, {autoAlpha:1, display:'block', ease:Linear.easeNone} );
				TweenLite.to( $('#map-right'), 0.5, {top:Global.windowHeight+200, ease:Expo.easeIn} );
				this.resizeMap(this.defaultMapHeight, 0.8);
			} else {
				this.closeDrawer();
			}
			this.clearMap();
		},

		clearMap: function(){
			// Clear map
			this.directionsDisplay.setMap(null);
			if (this.departureMarker){
				this.departureMarker.setMap(null);
			}
			this.map.panTo(this.jam3Location);
		},

		resetCurrentLocationButton: function(){
			// Change color of CurrentLocation Icon from Blue to Grey
			$('a#currentLocationBtn').removeClass('active');
		},

		gotSearchResults: function(places) {

			places = places || this.searchBox.getPlaces();

			var _this = this;

			$('#search-icon').addClass('icon-cross').removeClass('icon-search');
			this.resetCurrentLocationButton();

			//Assign the lat and long to a var
			_this.latlng = new google.maps.LatLng(places[0].geometry.location.lat(), places[0].geometry.location.lng());
			//Load Distances
			_this.loadDistance(_this.latlng, _this.jam3Location);
			//Load Times
			_this.allLoadTimes(_this.latlng, _this.jam3Location);
			// Set travel Method to Driving
			//_this.travelMethod('DRIVING');

			this.openDirectionsChoice();

		},

		openDirectionsChoice: function(){
			// Slide up all open travel Modes and remove .selected
			$('#travelMethod li.selected').removeClass('selected');

			if (Global.isMobile){
				//Open mobile direction options
				this.mobileOpen();
				//Fade out the addresses that were on the page
				$('.location-section').fadeOut('fast');

			} else {
				//Open Info Panel
				this.openDrawer();
			}
		},

		resize: function(){
			this.currentCenter = this.map.getCenter();
			if (Global.currentWidthType == 'tabletLandscape' || Global.currentWidthType == 'tabletPortrait' || Global.currentWidthType == 'desktop'){
				// Get height of contacts and header
				var headerHeight = $('header.page-title').outerHeight(true);
				var contactsHeight = $('.location-section').outerHeight(true);
				// Figure out content height
				var totalContentHeight = headerHeight+contactsHeight;
				var contentAreaHeight = Global.windowHeight;
				if (Global.isMobile){
					contentAreaHeight -= 50;
				} else {
					contentAreaHeight -= 100; // 100px padding at top of page
				} 
				var mapHeight = contentAreaHeight - totalContentHeight;
				// Minumum height
				mapHeight = Math.max(400, mapHeight);
				this.resizeMap(mapHeight,0);
				google.maps.event.trigger(this.map, 'resize');
				this.map.panTo(this.currentCenter);
			} else if (Global.currentWidthType == 'mobile'){

				this.resizeMap(($(window).height()<450)?250:340,0); 
				google.maps.event.trigger(this.map, 'resize');
				this.map.panTo(this.currentCenter);
			}
		},

		resizeMap: function(height, time){
			time = time || 0;
			TweenLite.to(this.mapcanvas, time, {height: height+30, ease: Expo.easeInOut});
			TweenLite.to($('#map'), time, {height: height, ease: Expo.easeInOut, onComplete: function(){
				google.maps.event.trigger(this.map, 'resize');
				var currentCenter = this.map.getCenter();
				this.map.panTo(currentCenter);
			}.bind(this) });
		},

		mobileOpen: function(){
			//Open the mobile directions panel that's in the sticky footer
			var headerHeight = $('.main-header').outerHeight();
			console.log('headerHeight: ', headerHeight);
			var footerHeight = this.footerHeight; //$('.map-right').height();
			console.log('footerHeight: ', footerHeight);
			var windowHeight = Global.windowHeight;
			console.log('windowHeight: ', windowHeight);

			var openMapHeight = windowHeight - headerHeight - footerHeight;

			TweenLite.fromTo($('#map-right'), 0.8, {top: windowHeight, display:'block'}, {top: windowHeight-footerHeight, ease: Expo.easeOut});

			this.resizeMap(openMapHeight, 1);
		},

		returnMobileMap: function (){
			//Function to get map locations in the mobile/tabletPortrait view
			$('.location-section ').fadeOut('fast');
			//Display directions from Users location
			_this.getLocation();
			_this.mobileOpen();
			$('#map-right').animate({
				height: '60px'
			});
			$('#panel').fadeIn('fast');
		}


	});

	return Map;

});
