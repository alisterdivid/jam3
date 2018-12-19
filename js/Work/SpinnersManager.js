define(['Class', 'jquery', 'TweenLite', 'Global'], function(Class, $, TweenLite, Global) {

  return new Class({

    spinners: [],
    curNumOfPosts: 0,

    initialize: function(totalPosts) {
      var spinner;
      this.curNumOfPosts = totalPosts;

      // add spinners for all existing posts
      for (var i = 0; i < totalPosts; i++) {
        spinner = $('<div class="loaderDiv"> ' +
                      '<svg height="32" width="35" class="spinner"> ' +
                        '<circle cx="5" cy="5" r="5" fill="#c0bdbf"></circle> ' +
                        '<circle cx="30" cy="5" r="5" fill="#c0bdbf"></circle> ' +
                        '<circle cx="17.5" cy="26.65" r="5" fill="#c0bdbf"></circle> ' +
                      '</svg> ' +
                    '</div>'
      );
        $('.grid-container').append(spinner);
        this.spinners.push(spinner);
      }
    },

    reattach: function(curNumOfPosts, forse) {
      if (this.curNumOfPosts == curNumOfPosts && !forse) {
        return;
      }

      this.curNumOfPosts = curNumOfPosts;

      // re-attach required number of spinners on filtering based on number of items
      for (var i = 0; i < curNumOfPosts; i++) {
        $('.grid-container').append(this.spinners[i]);
        //console.log('reattach', i);
      }
    },

    detach: function() {
      //console.log('detach');

      // detach spinners on filtering
      for (var i = 0; i < this.curNumOfPosts; i++) {
        this.spinners[i].detach();
        this.spinners[i].removeClass('loaded');
        this.spinners[i].removeClass('fade-in');
        this.spinners[i].removeClass('is-spinning');
      }
    },

    resize: function(cellW, cellH, numOfCols) {
      // set spinners positions in the centre of cells
      var curPosX = 0, curPosY = 0;

      for (var i = 0; i < this.curNumOfPosts; i++) {
        // calculate position
        if (i === 0) {
          curPosX = ((i + 1) * cellW - 32) * 0.5;
          curPosY = (cellH - 32) * 0.5;
        } else {
          // check if spinner needs to shift to the next row
          if (i % numOfCols === 0) {
            curPosX = (cellW - 32) * 0.5;
            curPosY += cellH;
          }
        }

        TweenLite.set(this.spinners[i], {
          left: curPosX,
          top: curPosY + $('#category-nav').height()
        });
        curPosX += cellW;
      }
    },

    animateInViewport: function() {
      // animate spinners which are in the viewport and stop the rest
      var rect;
      for (var i = 0; i < this.curNumOfPosts; i++) {
        rect = this.spinners[i].get(0).getBoundingClientRect();
        if (rect.top > 100 && rect.bottom - 100 <= (window.innerHeight || document.documentElement.clientHeight) && !this.spinners[i].hasClass('loaded')) {
          this.spinners[i].addClass('fade-in');
          this.spinners[i].addClass('is-spinning');
        } else {
          this.spinners[i].removeClass('fade-in');
          setTimeout(function(i) {
            this.spinners[i].removeClass('is-spinning');
          }.bind(this,i), 400);
        }
      }
    },

    hideRangeOnLoad: function(start, end) {
      // hide spinners for loaded items
      for (var i = start; i < end; i++) {
        if (this.spinners[i] && !this.spinners[i].hasClass('loaded')) {
          this.spinners[i].removeClass('fade-in');
          this.spinners[i].addClass('loaded');

          setTimeout(function(i) {
            this.spinners[i].removeClass('is-spinning');
          }.bind(this, i), 500);
          //console.log('loaded:', i);
        }
      }
    }

  })
});