
define(['Class', 'jquery', 'underscore', 'TweenLite', 'TimelineLite', 'Global', 'ui/FadeIn', 'ui/BorderButtons', 'utils/GA', 'Tablesort'],function(Class, $, _, TweenLite, TimelineLite, Global, FadeIn, BorderButtons, GA) {


	var Awards = new Class({

		mouseX: null,
		mouseY: null,
		lastX: null,
		lastY: null,
		menuItem: null,
		table: null,
		currentHash: null,

		initialize: function(){

		//	$('.award-counts ul li:gt(5)').removeClass('keyline-award'); //removing  keyline-bottom bottom row of awards in .award-counts <ul>

			GA.setPageID('achievements');

			this.table = $('#awardsTable');
			this.menuItem = $('.single-award-wrap');
			this.setupTable();
			this.countAwards();
			this.onAwardHover();

			this.onProjectHover();
			this.onMouseMove();
			this.shimIE();

			if(!Global.isMobile){
				//var faders = new FadeIn($('.entry-content header'), $('.entry-content'), $(''));
			}

			var _this = this;
			// sort table by awards based on clicked icon
			this.menuItem.parent().on('click', function(){

				_this.onAwardClick(this);

				return false;

			});

			if(this.currentHash = window.location.hash ){
				this.sortByProject(this.currentHash.replace('#',''));
			};

			// GA track project click
			$('#awardsTable').on('click', 'a.awardNameList', function(){
				$this = $(this);
				var title = $this.data('title');
				GA.trackEvent('Navigation', 'AchievementClick', title.toLowerCase());
			});


		},
		setupTable: function(){
			var _this = this;

			var awardsTable = new Tablesort(document.getElementById('awardsTable'),{
				descending: true
			});

			$('.sort-header:first-child').click().addClass('sort-down');

			this.hideYear();

			$('body').on('sortComplete', function(){ //being trigged from sortTable module
				_this.table.find('tr td:last-child span').css("color", "#555555");
				_this.hideYear();

			});
		},
		hideYear: function(){
			//console.log("hiding year!!!");

			var lastYear = null;
			var thisYear = null;
			var yearFields = $('#awardsTable tbody tr td:first-child');


			yearFields.each(function(){

				thisYear = $(this).html();

					if (lastYear == thisYear){
						$(this).css('visibility', 'hidden');

					}
					else{
						$(this).css('visibility', 'visible');
					}


				lastYear = thisYear;

			});
		},
		countAwards: function(){

			// count number of awards
			var awardArray = [];
			this.table.find('tr').each(function() {
				var awardClass = $(this).attr('class');
				awardArray.push(awardClass);
			});


			var singleAwardFromArray = _.uniq(awardArray);
			for (var i = 0; i < singleAwardFromArray.length; i++) {
				countAwards(singleAwardFromArray[i]);
			}

			function countAwards(awardName) {
				var awardName = awardName || 'Award',
				count = 0;


				for (var i = 0; i < awardArray.length; i++) {
					if (awardArray[i] === awardName) {
						count++;
					}
				}

				if (count <= 9) {
				  $('#' + awardName + ' .awardCount').html('0' + count);
				} else {
				  $('#' + awardName + ' .awardCount').html(count);
				}
			}

		},
		mobile: function(){
		return ($(window).width() <= 992);
		},
		onMouseMove: function(){
			var _this = this;
			$('body').mousemove(function(ev) { //*** Need to unbind this after leaving page? ***//
				_this.lastX = ev.clientX;
				_this.lastY = ev.clientY;
			});
		},
		onAwardClick: function(_this){
			var table = this.table;

			var $this = $(_this);
			var award = $this.data('title');

			// GA Track
			GA.trackEvent('Achievements', 'AchievementClick', award);

			var id = _this.id;

			if (!Global.isMobile) {
				table.find('tr td:last-child span').css("color", "#555555"); //remove color from previously selected awards
				$('.sort-header:first-child').click().addClass('sort-down');

				// move selected data to the top
				table.find('tr.' + id).each(function() {
					var chosenData = $(this).clone(true, true);  // clone data with events
					$(this).remove();
					chosenData.prependTo(table);
				});



				this.hideYear(); // hide duplicate year fields in awardsTable

				_.delay(function(){
					$('html, body').animate({
						scrollTop: table.offset().top - table.find('th').height() - parseInt(table.find('th').css('padding-top')) * 3
					}, 300);
				}, 300)

				// highlight selected awards' rows
				var selectedRow = table.find('tr.' + id +' td:nth-child(2)').add('tr.' + id + ' a');
				var selectedAward = table.find('tr.' + id + ' td:nth-child(4) span');
				var selectedCategory = table.find('tr.' + id + ' td:nth-child(4)');
				TweenLite.to(selectedRow, 0.3, { color: '#000', delay: 0.8 });
				TweenLite.to(selectedAward, 0.3, { color: '#000', delay: 0.8 });
				TweenLite.to(selectedCategory, 0.3, { color: '#000', delay: 0.8 });
				TweenLite.to(selectedRow, 1.2, { color: '#555555', delay: 1.2 });
				TweenLite.to(selectedCategory, 1.2, { color: '#555555', delay: 1.2 });
			}

		},
		onAwardHover: function(){
			var _this = this;
			this.menuItem.hover(function(ev) {

			var seeBtn = $(this).find('.btn');
			var paddingX = parseInt(seeBtn.css('padding-left'));     // for IE & FF padding side must be specified, formerly paddingSize
			var paddingY = parseInt(seeBtn.css('padding-top'));
			var borderSize = parseInt(seeBtn.css('border-top-width'));  // for IE & FF border side must be specified
			var btnWidth = seeBtn.width() + 2 * (paddingX + borderSize);
			var btnTxt = seeBtn.html();

			// get mouse enter direction
			var direction = 'right';
			_this.mouseX = ev.clientX;
			_this.mouseY = ev.clientY;

			var distanceX = Math.abs(_this.mouseX - _this.lastX);
			var distanceY = Math.abs(_this.mouseY - _this.lastY);

			if (distanceX > distanceY) {
				if (_this.mouseX > _this.lastX) {
					direction = 'right';
				} else if (_this.mouseX < _this.lastX) {
					direction = 'left';
				}
			} else if (distanceY > distanceX) {
				if (_this.mouseY >_this.lastY) {
					direction = 'down';
				} else if (_this.mouseY < _this.lastY) {
					direction = 'up';
				}
			}

			// animate background depending on direction
			if (direction === 'right') {
				TweenLite.fromTo($(this).find('.animatedBG'), 0.2,
					{ top: 0, left: 0, width: 0, height: '100%' },
					{ width: '100%' }
				);
			} else if (direction === 'left') {
				TweenLite.fromTo($(this).find('.animatedBG'), 0.2,
					{ top: 0, left: '100%', width: 0, height: '100%' },
					{ width: '100%', left: -$('.animatedBG').width() }
				);
			} else if (direction === 'down') {
				TweenLite.fromTo($(this).find('.animatedBG'), 0.2,
					{ top: 0, left: 0, width: '100%', height: 0 },
					{ height: '100%' }
				);
			} else if (direction === 'up') {
				TweenLite.fromTo($(this).find('.animatedBG'), 0.2,
					{ top: '100%', left: 0, width: '100%', height: 0 },
					{ height: '100%', top: -$('.animatedBG').height() }
				);
			}

			_this.lastX = _this.mouseX;
			_this.lastY = _this.mouseY;

			// _this.borderButton.hover(btnWidth, 42, 'btn btn-light', direction, btnTxt);
			//width, height, className, direction, text, paddingX, img
			// seeBtn = new BorderButtons(88, 42, seeBtn, direction, btnTxt, paddingX, paddingY);
			//seeBtn.appendTo(this);

									 // (width, height, button, direction, text, paddingX, paddingY, img){
			seeBtn = new BorderButtons(41, 16, seeBtn, direction, btnTxt, 20, 12);

			seeBtn.mousedown(function() {
				TweenLite.to($(this), 0.2, { background: $(this).css('color'), color: '#fff' });

				$(this).mouseup(function() {
					TweenLite.to($(this), 0, { background: 'none', color: $(this).css('border-color'), delay: 1 });
				});
			});

			}, function() {
				TweenLite.set($(this).find('.animatedBG'), { top: 0, left: 0, width: 0, height: 0 });
			});

			this.menuItem.mouseleave(function() {
				var btnBorder = $(this).find('.btnBorder');
				btnBorder.remove();
			});
		},
		onProjectHover: function(){
			var prjLinks = this.table.find('a');
			var projects = this.getUniqueProjectList(prjLinks);


			var imgSrc = [];
			for (var i = 0; i < projects.length; i++) {
				imgSrc.push($('a#' + projects[i]).parent().parent().find('.btn-preview img').attr('src'));
			}

			// remove all images inserted from WP
			var preview = this.table.find('.btn-preview');
			preview.remove();

			// animate preview box
			prjLinks.mouseenter(function() {
				var cell = $(this).parent().parent();


				TweenLite.to($(this), 0.4, { color: '#000' });
				TweenLite.set(cell.find('.underline'), { opacity: 1 });
				TweenLite.fromTo(cell.find('.underline'), 0.2, { width: 0 }, { width: '100%', delay: 0.2 });

											// (width, height, button, direction, text, paddingX, paddingY, img){
				preview = new BorderButtons(150, 88, $("<div class='btn btn-preview'></div>"), 'right', '', 0, 0, imgSrc[projects.indexOf(this.id)]);

				preview.appendTo(cell);


				TweenLite.to(preview, 3, { opacity: 0, delay: 2 });

				$(this).parent().mouseleave(function() {
					TweenLite.to($(this).find('a'), 0.2, { color: '#555555' });
					TweenLite.to(cell.find('.underline'), 0, { opacity: 0 });
					// TweenLite.to(preview, 1, { opacity: 0, delay: -0.7, onComplete: function() { preview.remove();} });
					preview.remove();
				});
			});
		},
		sortByProject: function(currentHash){
			var table = this.table;
			var id = currentHash;

			console.log(id);

			if (!Global.isMobile) {
				table.find('tr td:last-child span').css("color", "#555555"); //remove color from previously selected awards
				$('.sort-header:first-child').click().addClass('sort-down');

				// move selected data to the top
				table.find('tr[data-awardname=' + id + ']').each(function() {
					var chosenData = $(this).clone(true, true);  // clone data with events
					$(this).remove();
					chosenData.prependTo(table);
				});


				this.hideYear(); // hide duplicate year fields in awardsTable

				_.delay(function(){
					$('html, body').animate({
						scrollTop: table.offset().top - table.find('th').height() - parseInt(table.find('th').css('padding-top')) * 3
					}, 300);
				}, 300)

				// highlight selected awards' rows
				var selectedRowNoLink = table.find('tr[data-awardname="' + id + '"] td:nth-child(2)');
				var selectedRow = table.find('tr[data-awardname="' + id + '"] td:nth-child(2)').add('tr[data-awardname="' + id + '"] a');
				var selectedAward = table.find('tr[data-awardname="' + id + '"] td:nth-child(4) span');
				var selectedCategory = table.find('tr[data-awardname="' + id + '"] td:nth-child(4)');
				TweenLite.to(selectedRow, 0.3, { color: '#000', delay: 0.8 });
				TweenLite.to(selectedAward, 0.3, { color: '#000', delay: 0.8 });
				TweenLite.to(selectedCategory, 0.3, { color: '#000', delay: 0.8 });
				TweenLite.to(selectedRowNoLink, 1.2, { color: '#555555', delay: 1.2 });
				TweenLite.to(selectedAward, 1.2, { color: '#555555', delay: 1.2 });
				TweenLite.to(selectedCategory, 1.2, { color: '#555555', delay: 1.2 });
			}
		},
		getUniqueProjectList: function(list){
			// get unique projects
			var projects = [];
			list.each(function() {
				projects.push(this.id);
			});

			function unique(list) {
				var result = [];
				$.each(list, function(i, e) {
					if ($.inArray(e, result) == -1) result.push(e);
				});
				return result;
			}

			projects = unique(projects);
			return projects;
		},
		shimIE: function(){
			if (!Array.prototype.indexOf) {
				Array.prototype.indexOf = function(searchElement, fromIndex) {
					var i,
						pivot = (fromIndex) ? fromIndex : 0,
						length;

					if (!this) {
					  throw new TypeError();
					};

					length = this.length;

					if (length === 0 || pivot >= length) {
						return -1;
					};

					if (pivot < 0) {
						pivot = length - Math.abs(pivot);
					};

					for (i = pivot; i < length; i++) {
						if (this[i] === searchElement) {
							return i;
						};
					};
					return -1;
				};
			};
		}
	});//Class

	return Awards;
});
