define(['Class', 'jquery', 'TweenLite', 'TimelineLite', 'Global', 'Signal'], function(Class, $, TweenLite, TimelineLite, Global, Signal) {

  var COLUMNS = 4;
  var FILTER_ALL = 'mix_all';
  var CELL_ASPECT_RATIO = 1.77;

  var GridManager = new Class({

    initialize: function(container, items) {
      this.container = container;
      this.items = items;

      this.itemWidth = 0;
      this.itemHeight = 0;

      // currently visible items (i.e. by filter)
      this.currentItems = this.items;

      this.gridWidth = 0;
      this.gridHeight = 0;

      this.currentGridWidth = 0;
      this.currentGridHeight = 0;

      Global.onGridFilter = new Signal();

      this.updateSize();
    },

    setupSize: function(columns, itemWidth) {
      COLUMNS = columns;
      this.items.css('width', itemWidth);
      this.update();
    },

    updateSize: function() {
      var width = this.items.width();
      var height = Math.floor(width / CELL_ASPECT_RATIO);

      this.itemWidth = width;
      this.itemHeight = height;

      var rows = Math.max(0, Math.floor((this.currentItems.length - 1) / COLUMNS) + 1);
      var totalRows = Math.max(0, Math.floor((this.items.length - 1) / COLUMNS) + 1);

      this.gridWidth = this.itemWidth * COLUMNS;
      this.gridHeight = this.itemHeight * totalRows;

      this.currentGridWidth = this.itemWidth * COLUMNS;
      this.currentGridHeight = this.itemHeight * rows;

      this.container.css({
        width: this.gridWidth,
        height: this.gridHeight
      });

      $('.image-overlay-color').css('height', height+5);

      return true;
    },

    /**
     * Handles a resize event by detecting the new width and height of a thumbnail,
     * and then re-positions currently visible grid items accordingly.
     */
    update: function(animateTo) {
      // check if size is different
      if (!this.updateSize()) {
        return;
      }

      //console.log('Resizing grid with item size', 'w', this.itemWidth, 'h', this.itemHeight);

      var zIndex = this.currentItems.length;
      this.currentItems.each(function(i, val) {
        var item = $(val);

        var y = Math.floor(i / COLUMNS);
        var x = Math.floor(i - COLUMNS * y);

        // set the current indices
        item.data('x-index', x);
        item.data('y-index', y);

        if (animateTo) {
          TweenLite.to(item, 0.5, {x: x * this.itemWidth, y: y * this.itemHeight, ease: Expo.easeOut, delay: this.calculateScrollDelay(x, y)});
        } else {
          TweenLite.set(item, {zIndex: zIndex, x: x * this.itemWidth, y: y * this.itemHeight});
        }

        zIndex--;
      }.bind(this));

      this.container.css({
        width: '100%',
        height: this.currentGridHeight
      });
    },

    // animate in the whole grid
    animateIn: function(delay, startNum, filtered, opacityIndex) {
      delay = delay || 0.1;
      startNum = startNum || 0;

      console.log('animate items from to:', startNum, 'to ', this.items.length - 1);

      var animateIn = new TimelineLite({paused: true, onComplete: this.animateInComplete.bind(this), delay: delay});
      this.animatingGrid = true;

      var gridContHeight = $('.grid-container').height();

      // make sure to set grid height on filtering if needed
      if (filtered && this.currentGridHeight < gridContHeight) TweenLite.set($('ul.content.grid'), {height: '100%', delay: 0.2});

      var item, x, y;
      for (var i = (startNum || 0); i < this.items.length; i++) {
        item = $(this.items[i]);

        y = Math.floor(i / COLUMNS);
        x = Math.floor(i - COLUMNS * y);

        item.data('x-index', x);
        item.data('y-index', y);

        if (opacityIndex && i >= opacityIndex) {
         // TweenLite.set(item.find('img').first(), {opacity: 0.2});
          item.find('.image-overlay-color').first().css('visibility', 'visible');
        }

        TweenLite.set(item, {opacity: 1, top: gridContHeight});
        animateIn.fromTo(item, 0.5, {x: this.itemWidth * x, y: gridContHeight}, {top: 0, x: this.itemWidth * x, y: this.itemHeight * y, ease: Expo.easeOut, delay: 0.2}, (y * 0.1 + x * 0.1).toString());
      }

      animateIn.play();
    },

    animateInComplete: function() {
      this.animatingGrid = false;
    },

    // determine the subtle delay between items fading in/out
    calculateItemDelay: function(x, y) {
      var totalRows = Math.max(0, Math.floor((this.items.length - 1) / COLUMNS) + 1);
      return (y / totalRows / 2) + (x / COLUMNS / 5);
    },

    // determine the subtle delay between items sliding around
    calculateSlideDelay: function(x, y) {
      var i = x + (y * COLUMNS);
      return (i / this.items.length) / 5;
    },

    calculateScrollDelay: function(x, y) {
      return this.calculateItemDelay(x, y);
    },

    filter: function(filter) {
      if (this.animatingGrid) {
        return;
      }

      this.animatingGrid = true;

      // animate out the grid
      var animateOut = new TimelineLite({paused: true, onComplete: Global.onGridFilter.dispatch.bind(this, filter)});

      var currentItems = this.currentItems.toArray();
      for (var i = 0, len = currentItems.length; i < len; i += 1) {
        var $item = $(currentItems[i]);
        var row = parseInt($item.data('y-index'), 10);
        var col = parseInt($item.data('x-index'), 10);
        animateOut.to($item, 0.6, {y: -this.itemHeight * 2, ease: Expo.easeInOut}, (row * 0.05 + col * 0.05).toString());
      }

      animateOut.play();
    }
  });

  GridManager.FILTER_ALL = FILTER_ALL;

  return GridManager;
});