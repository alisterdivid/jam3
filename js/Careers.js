define(['Class', 'Global', 'utils/GA', 'ui/FadeIn'], function (Class, Global, GA, FadeIn) {

    return new Class({
        initialize: function () {
            GA.setPageID('careers');

            $(document).scrollTop(0);
            this.container = $('main.careers');

            // events
            this.setEvents();

            if (!this.container.find('.table-container').height()) {
                this.container.find('.intro').removeClass('keyline');
                this.container.find('.openings').hide();
            } else {
                // set fade-ins
                if (!Global.isMobile) {
                    new FadeIn(this.container.find('.conclusion'));
                }
            }

            //  Show a random tagline
            var tags = this.container.find('.taglines > p');
            tags.slice(0,tags.length-1).css('display','none');
            var id = Math.floor(Math.random()*tags.length-1);
            tags.slice(id,id+1).css('display','block');
            this.container.find('.taglines').css('display','block');

            var firstJobRowCount = this.container.find('.table-container .row:first-child .job-row').length;

            if(firstJobRowCount === 1) {
                this.container.find('.table-container .row:first-child .category').css('border-bottom', 'none');
            }
        },

        setEvents: function () {
            Global.onResize.add(this.onResize.bind(this));

            // link hover events
            var self;
            this.container.find('.job-title-link').on('mouseenter', function (e) {
                self = $(e.target);
                self.closest('.job-row').find('.read-more').addClass('hover');
            });
            this.container.find('.job-title-link').on('mouseleave', function (e) {
                self = $(e.target);
                self.closest('.job-row').find('.read-more').removeClass('hover');
            });
            this.container.find('.read-more').on('mouseenter', function (e) {
                self = $(e.target);
                self.closest('.job-row').find('.job-title-link').addClass('hover');
            });
            this.container.find('.read-more').on('mouseleave', function (e) {
                self = $(e.target);
                self.closest('.job-row').find('.job-title-link').removeClass('hover');
            });
        },

        onResize: function () {
            if ($(window).width >= 768) {
                this.container.find('.conclusion').width(this.container.find('.table-container').width());
            }
            //console.log('Careers resized');
        }
    });

});
