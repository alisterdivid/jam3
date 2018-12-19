// This module creates a button with border animation
// depending on mouse direction on AWARDS page

define(['Class', 'jquery', 'TweenLite', 'TimelineLite'],function(Class, $, TweenLite, TimelineLite) {

  var BorderButtons = new Class({
    width: null,
    height: null,
    paddingX: null,
    paddingY: null,
    //class: null,
    direction: null,
    txt: null,
    img: null,
    offset: 3,
    topMask: null,
    rightMask: null,
    bottomMask: null,
    leftMask: null,
    button: null,
    buttonTimeline: null,
    initialize: function(width, height, button, direction, text, paddingX, paddingY, img){
        this.width = width;
        this.height = height;
        this.button = button;
        this.direction = direction;
        this.txt = text;
        this.paddingX = paddingX ? paddingX : 0;
        this.paddingY = paddingY ? paddingY : 0;
        this.img = img;



        this.init();
        this.animate();


        return this.button;


    },
    init: function(){

        //this.button = $('<div>').addClass(this.class);

        if (this.txt) {
           //this.button.html(this.txt);
        }

        // create and set mask elements
        this.topMask = $('<div>').addClass('btnBorder').appendTo(this.button);
        this.rightMask = $('<div>').addClass('btnBorder').appendTo(this.button);
        this.bottomMask = $('<div>').addClass('btnBorder').appendTo(this.button);
        this.leftMask = $('<div>').addClass('btnBorder').appendTo(this.button);


        $(this.button).css({'padding':this.paddingY + 'px ' + this.paddingX + 'px'});
        this.button.width(this.width);
        this.button.height(this.height);

        this.width -= this.offset;
        this.height -= this.offset;


        if (this.img) {
            this.bg = $('<img>').attr('src', this.img).appendTo(this.button);
        }


    },
    animate: function(){

      var speed = 0.1;

      var totalWidth = this.width + (this.paddingX * 2);
      this.height = this.height + (this.paddingY * 2);
      this.buttonTimeline = new TimelineLite({paused: true});

      this.buttonTimeline.add(TweenLite.fromTo(this.button, 0.2, { opacity: 0 }, { opacity: 100, delay: 0.35 }));

      switch (this.direction) {

        case 'right':

           this.buttonTimeline.add(TweenLite.fromTo(this.topMask, speed,
            { width: totalWidth + 4*this.offset, right: -this.offset, top: -this.offset },
            { width: 0,   delay: -0.2 } //left: totalWidth + this.offset,
          ));
          this.buttonTimeline.add(TweenLite.fromTo(this.rightMask, speed / 2,
            { height: this.height + 2*this.offset, left: totalWidth +this.offset  , bottom: -this.offset},
            { height: 0 }
          ));
          this.buttonTimeline.add(TweenLite.fromTo(this.bottomMask, speed / 1.2,
            { width: totalWidth + this.offset, left: 0, top: this.height +this.offset},
            { width: 0 }
          ));
          this.buttonTimeline.add(TweenLite.fromTo(this.leftMask, speed / 3,
            { height: this.height + 2*this.offset, left: -this.offset, top:0},
            { height: 0 }
          ));

          break;


        case 'left':

          this.buttonTimeline.add(TweenLite.fromTo(this.topMask, speed,
            { width: totalWidth + 4*this.offset, left: -this.offset, top: -this.offset },
            { width: 0, delay: -0.2 }
          ));
          this.buttonTimeline.add(TweenLite.fromTo(this.leftMask, speed / 2,
            { height: this.height + 2*this.offset, left: -this.offset, bottom: -this.offset},
            { height: 0}
          ));
          this.buttonTimeline.add(TweenLite.fromTo(this.bottomMask, speed / 1.2,
            { width: totalWidth + this.offset, right: 0, top: this.height + this.offset },
            { width: 0}
          ));
          this.buttonTimeline.add(TweenLite.fromTo(this.rightMask, speed / 3,
            { height: this.height + 2*this.offset, left: totalWidth + this.offset, top: 0 },
            { height: 0 }
          ));

          break;


        case 'up':

          this.buttonTimeline.add(TweenLite.fromTo(this.rightMask, speed / 1.2,
            { height: this.height + 2*this.offset, left: totalWidth + this.offset, top: 0 },
            { height: 0, delay: -0.2 }
          ));
          this.buttonTimeline.add(TweenLite.fromTo(this.topMask, speed,
            { width: totalWidth + 3*this.offset, left: -this.offset, top: -this.offset },
            { width: 0, delay: -0.05 }
          ));
          this.buttonTimeline.add(TweenLite.fromTo(this.leftMask, speed / 2,
            { height: this.height + 2*this.offset, left: -this.offset, bottom: -this.offset },
            { height: 0}
          ));
          this.buttonTimeline.add(TweenLite.fromTo(this.bottomMask, speed / 1.2,
            { width: totalWidth + 2*this.offset, right: 0, top: this.height + this.offset },
            { width: 0 }
          ));

          break;

        case 'down':

          this.buttonTimeline.add(TweenLite.fromTo(this.leftMask, speed / 1.2,
            { height: this.height + 2*this.offset, left:-this.offset, bottom: 0 },
            { height: 0,  delay: -0.2 }
          ));
          this.buttonTimeline.add(TweenLite.fromTo(this.bottomMask, speed,
            { width: totalWidth + 2*this.offset, right:0, top: this.height + this.offset },
            { width: 0 }
          ));
          this.buttonTimeline.add(TweenLite.fromTo(this.rightMask, speed / 2,
            { height: this.height + 2*this.offset, left: totalWidth +this.offset , top: 0 },
            { height: 0 }
          ));
          this.buttonTimeline.add(TweenLite.fromTo(this.topMask, speed / 1.2,
            { width: totalWidth + 2*this.offset, left: 0, top: -this.offset },
            { width: 0}
          ));

          break;


        default:
          break;
      }

      if (this.img) {
        this.buttonTimeline.add(TweenLite.fromTo(this.bg, 0.8, { opacity: 0 }, { opacity: 1, delay: -0.1 }));
      }

      this.buttonTimeline.play();

    }


  });

  return BorderButtons;

});
