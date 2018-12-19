define(['Class', 'Global'], function(Class, Global){

	"use strict";

	var _this;

	var GA = new Class({

		pageID: null,

		initialize: function(){
			_this = this;
		},

		init: function(){
			// INTRO/HOME
			// Jam3 Logo click
			$('.blog-title a').on('click', function(e){
				if (_this.pageID == 'home'){
					_this.trackEvent('Navigation', 'LogoClick', 'Intro');
				}
			});
			// Right click
			$(document).mousedown(function(e){ 
				if( e.button == 2 ) { 
					if (_this.pageID == 'home'){
						_this.trackEvent('Interaction', 'RightClick', 'Home');
					}
				}
			});
			// NAV
			// Main Nav
			$('.main-nav > ul').on('click', 'a', function(e){
				var $this = $(this);
				var linkText = $this.text().replace(/^\s+|\s+$/g, '');
				var label = linkText + ' Nav';
				_this.trackEvent('Navigation', 'MenuClick', label);
			});
			// Main menu social links
			$('.menu-wrap .main-footer .social-links').on('click', 'a', function(e){
				var id = this.id;
				var category = 'ExternalLink';
				var action = 'MenuClick';
				var label = '';
				if (id == 'footer-social-fb'){
					label = 'Jam3 Facebook Page Link';
				} else if (id == 'footer-social-twitter') {
					label = 'Jam3 Twitter page link';
				} else if (id == 'footer-social-google') {
					label = 'Jam3 Google page Link';
				} else if (id == 'footer-social-email') {
					category = 'MailTo';
					label = 'Menu Mailto link';
				}
				_this.trackEvent(category, action, label);
				e.preventDefault();
				return false;
			});
			// WORK
			// Work category filters
			$('#category-nav').on('click touchend', 'a.filter', function(e){
				var $span = $(this).find('span');
				var text = $span.text().replace(/^\s+|\s+$/g, '');
				_this.trackEvent('WorkFilter', 'FilterClick', text);
			});
			// Work items
			$('.content.grid').on('click touchend', 'a.filter', function(e){
				var $span = $(this).find('span');
				var text = $span.text().replace(/^\s+|\s+$/g, '');
				_this.trackEvent('WorkFilter', 'FilterClick', text);
			});
		},

		// Each section should set a pageID in its constructor, eg: 'work', 'about'
		setPageID: function(pageID){
			this.pageID = pageID;
		},

		trackEvent: function(){
			// var args = Array.prototype.slice.apply(arguments);
			// var trackArgs = ['_trackEvent'].concat(args);
			// _gaq.push( trackArgs );


			// ga('send', 'event', 'Videos', 'play', 'Fall Campaign');

			try {
				if(__gaTracker){
					__gaTracker('send', {
					  hitType: 'event',
					  eventCategory: arguments[0],
					  eventAction: arguments[1],
					  eventLabel: arguments[2]
					});
				}
			} catch (e) {
				console.warn(e);
			}
		},

		trackWorkItem: function(name){
			this.trackEvent('Work', 'WorkClick', name.toLowerCase());
		}

	});

	return new GA();

});