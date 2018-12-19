define(['Class', 'Global', 'jquery', 'TweenLite', 'utils/GA'], function(Class, Global, $, TweenLite, GA){

    var Approach = new Class({


        initialize: function(){

          this.container = $('main.page-approach');

          GA.setPageID('approach');
          Global.onResize.add( this.onResize.bind(this) );

          var handleArrowClick = this.handleArrowClick.bind(this);

          $('.down-arrow').on('click', handleArrowClick);

        },

        handleArrowClick: function(){
          $('html, body').animate({
            scrollTop: $(window).height()
          }, 500);
        },

        onResize: function(){
        }

    });

    return Approach;

});
