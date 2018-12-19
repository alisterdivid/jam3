define(['Class', 'Global', 'utils/GA', 'ui/FadeIn', 'TweenLite', 'TimelineLite'], function (Class, Global, GA, FadeIn, TweenLite, TimelineLite) {

    return new Class({
        initialize: function () {
            GA.setPageID('careers_page');

            this.animateInNavTitle();

            $(document).scrollTop(0);
            this.container = $('main.single-careers');

            // form state flags
            this.formIsReady = true;
            this.errorShown = false;
            this.inputChanged = false;

            // buttons
            this.uploadBtn = this.container.find('.upload-btn'); // only shown for desktop layout
            this.submitBtn = this.container.find('.submit-btn');
            this.clearBtn = this.container.find('.clear-btn');
            TweenLite.set(this.container.find('.checkmark'), {autoAlpha: 0});

            // set current menu item
            $('.main-nav').find('ul').find('li').removeClass('current_page_parent');
            $('.main-nav').find('.icon-careers').addClass('current_page_item');

            // set copy
            this.uploadBtnTxt = this.uploadBtn.find('.txt').html();
            this.errorMessage = this.container.find('.error-message');
            this.errorMessage.hide();
            this.container.find('.fail').hide();

            // input fields
            this.inputFields = this.container.find('input:text');
            this.fileUpload = this.container.find('input:file');
            this.defaultValues = [];
            for (var i = 0; i < this.inputFields.length; i++) {
                this.defaultValues.push($(this.inputFields[i]).val());
            }

            // stylize lists
            this.container.find('.job-description').find('li').wrapInner('<span></span>');

            // set events
            this.setEvents();

            // set fade-ins
            if (!Global.isMobile) {
                new FadeIn(this.container.find('.form-wrapper'));
            }
        },

        setEvents: function () {
            Global.onResize.add(this.onResize.bind(this));

            // back link
            $('.nav-button-text').on('click', function () {
                window.location.href = '/careers';
            });


            // handle file upload
            this.uploadBtn.on('click', function (e) {
                e.preventDefault();
                this.fileUpload.trigger('click');
            }.bind(this));


            // handle clear form
            this.clearBtn.on('click', function (e) {
                e.preventDefault();
                this.container.find('.fail').hide();

                if (this.formIsReady) {
                    $(this.inputFields).blur();
                    $(this.inputFields).removeClass('error');

                    // reset input values
                    for (var i = 0; i < this.inputFields.length; i++) {
                        $(this.inputFields[i]).val(this.defaultValues[i]);
                    }

                    // remove file stuff and messages
                    this.fileUpload.val('');
                    this.uploadBtn.find('.txt').html(this.uploadBtnTxt);
                    this.errorMessage.html('');
                    this.errorMessage.hide();
                    this.errorShown = false;
                }
            }.bind(this));


            // handle submit form
            this.submitBtn.on('click', function (e) {
                e.preventDefault();
                this.container.find('.fail').hide();

                if (this.formIsReady) {
                    $(this.inputFields).blur();
                    this.validate();
                    //this.submit(); // uncomment only for testing purposes
                }
            }.bind(this));

            // submit on Enter press
            $(document).keydown(function (e) {
                if (e.which == 13 && this.inputChanged) {
                    this.submitBtn.trigger('click');
                }
            }.bind(this));

            // handle input focus
            $(this.inputFields).on('focus', function (e) {
                var self = $(e.target);
                var index = self.parent().index(); // needs parent because it's wrapped

                this.inputChanged = true;

                self.removeClass('error');

                if (self.val().toLowerCase() === this.defaultValues[index].toLowerCase()) {
                    self.val('');
                }
            }.bind(this));

            // handle input un-focus
            $(this.inputFields).on('blur', function (e) {
                var self = $(e.target);
                var index = self.parent().index(); // needs parent because it's wrapped

                if (self.val().trim() === '') {
                    self.val(this.defaultValues[index]);
                } else {
                    self.val(self.val().trim());
                }
            }.bind(this));

            // handle file uploading
            $(this.fileUpload).change(function () {
                var file = $(this.fileUpload)[0].files[0];
                this.loadAttachment(file);
            }.bind(this));
        },

        loadAttachment: function (file) {
            if (file) {
                //console.log('attaching...', file.name, file.size / (1024 * 1024));

                var reader = new FileReader();
                reader.readAsDataURL(file);

                // check type
                if (!(/\.(doc|docx|rtf|pdf|odt|txt|wpd|wps)$/i).test(file.name)) {
                    //console.log('unsupported extension');
                    this.errorMessage.html('Unsupported file type.<br/>Please try another one.');
                    this.errorMessage.show();
                    this.errorShown = true;
                    this.uploadBtn.find('.txt').html(this.uploadBtnTxt);

                    this.fileUpload.val('');
                    reader.abort();

                    return;
                }

                // check file size
                if (file.size / (1024 * 1024) > 10) {
                    //console.log('file exceeds 10Mb');
                    this.errorMessage.html('File size exceeds 10Mb.<br/>Please try another one.');
                    this.errorMessage.show();
                    this.errorShown = true;
                    this.uploadBtn.find('.txt').html('Upload Resume');

                    this.fileUpload.val('');
                    reader.abort();

                    return;
                }

                // uploading process
                this.errorMessage.html('');
                this.errorMessage.hide();
                this.errorShown = false;

                reader.onloadstart = function () {
                    //console.log('loading started', file.name);
                    //this.formIsReady = false;
                    this.uploadBtn.find('.txt').html('Uploading...');
                }.bind(this);

                reader.onloadend = function () {
                    this.uploadBtn.find('.txt').html('Replace File');
                    //console.log('loading finished', file.name);
                    //this.formIsReady = true;
                }.bind(this);
            }
        },

        validate: function () {
            //console.log('validate inputs');

            var validFieldNum = 0;

            // check text input fields
            for (var i = 0; i < this.inputFields.length; i++) {
                if (this.checkInput($(this.inputFields[i]), i)) {
                    validFieldNum++;
                }
            }

            // submit form if all input values are valid
            if (validFieldNum === this.inputFields.length && this.formIsReady) {
                this.submit();
            }
        },

        checkInput: function (input, index) {
            var isValid = false;

            switch (input.attr('name')) {
                case 'firstname':
                case 'lastname':
                    // mandatory field
                    isValid = (/^([a-z]+[a-z' -]*)$/i.test(input.val())) && (input.val() !== this.defaultValues[index]);
                    break;
                case 'phone':
                    // mandatory field
                    //var curVal = input.val().replace(/\s+/g, ' ');
                    //input.val(curVal);
                    //isValid = (/^(([+]?\d[- .]{0,3})?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4})$/i.test(input.val())) && (input.val() !== this.defaultValues[index]);
                    var curVal = input.val().replace(/[+\-\s()]/g, '');
                    isValid = /^[\d]{10,13}$/i.test(curVal);
                  break;
                case 'email':
                    // mandatory field
                    isValid = (/^([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})$/i.test(input.val())) && (input.val() !== this.defaultValues[index]);
                    break;
                case 'website':
                    // an optional field but gets validated in case something was input
                    isValid = (/(https?:\/\/)?(w{3}\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi.test(input.val())) || (input.val() === this.defaultValues[index]);
                    break;
                case 'linkedin':
                    // an optional field but gets validated in case something was input
                    isValid = (/^(http(s)?:\/\/)?([\w]+\.)?linkedin\.com\/(pub|in|profile)\/.+/gm.test(input.val())) || (input.val() === this.defaultValues[index]);
                    break;
                default:
                    break;
            }

            if (!isValid) {
                input.addClass('error');
            }

            //console.log(input.attr('name'), isValid);

            return isValid;
        },

        submit: function () {
            this.formIsReady = false;

            var m_data = new FormData();
            m_data.append('subject', $('input[name=subject]').val());
            m_data.append('contact', $('input[name=contact]').val());
            m_data.append('firstname', $('input[name=firstname]').val());
            m_data.append('lastname', $('input[name=lastname]').val());
            m_data.append('email', $('input[name=email]').val());
            m_data.append('phone', $('input[name=phone]').val());
            m_data.append('website', $('input[name=website]').val());
            m_data.append('linkedin', $('input[name=linkedin]').val());
            m_data.append('fileupload', $('input[name=fileupload]')[0].files[0]);
            m_data.append('action', 'mail_before_submit');
            //m_data.append('_ajax_nonce', importNonce);

            $.ajax({
                url: "/wp-admin/admin-ajax.php",
                data: m_data,
                cache: false,
                processData: false,
                contentType: false,
                type: 'POST',
                //timeout: 90000,
                beforeSend: function () {
                    // disable hover
                    this.container.find('.submit-btn').addClass('no-hover');
                    // start sending progress
                    TweenLite.set(this.container.find('.submit-layer'), {width: 0, autoAlpha: 1});
                    TweenLite.to(this.container.find('.submit-layer'), 20, {width: '80%', ease: Sine.easeOut});
                    // add form blocking div
                    TweenLite.set(this.container.find('.form-blocker'), {display: 'block', autoAlpha: 1});
                    // change form elements opacity
                    TweenLite.to([this.container.find('form'), this.container.find('.clear-btn')], 0.8, {autoAlpha: 0.5});
                    TweenLite.set(this.container.find('.checkmark'), {autoAlpha: 0});
                }.bind(this),
                success: function (response) {
                    console.log(response);

                    if (response.trim() != 'sent') {
                        this.handleSubmitError();
                    }
                    // end progress
                    TweenLite.to(this.container.find('.submit-layer'), 0.5, {
                        width: '100%',
                        ease: Linear.easeNone,
                        onComplete: function () {
                            TweenLite.to(this.container.find('.checkmark'), 0.2, {autoAlpha: 1, delay: 0.2});
                        }.bind(this)
                    });

                    console.log('form submitted');
                }.bind(this),
                error: function () {
                    this.handleSubmitError();
                }.bind(this)
            });
        },

        handleSubmitError: function () {
            this.formIsReady = true;

            this.container.find('.fail').show();
            // re-enable hover
            this.container.find('.submit-btn').removeClass('no-hover');
            // reset sending progress on error
            TweenLite.set(this.container.find('.submit-layer'), {autoAlpha: 0});
            // remove form blocking div
            TweenLite.set(this.container.find('.form-blocker'), {display: 'none', autoAlpha: 0});
            // reset form elements opacity
            TweenLite.to([this.container.find('form'), this.container.find('.clear-btn')], 0.8, {autoAlpha: 1});
            TweenLite.set(this.container.find('.checkmark'), {autoAlpha: 0});

            console.log('submission failed');
        },

        onResize: function () {
            var btnContainer = this.container.find('.btn-container');

            if (Global.isMobile) {
                if ($(window).width() < 745) {
                    btnContainer.width($(this.container.find('input')[0]).outerWidth());
                }

                // never show file upload error for mobile
                if (this.errorShown) {
                    this.container.find('.error-message').hide();
                }
            } else {
                btnContainer.width(this.container.find('form').width());

                // show file upload error if that was hidden on resize
                if (this.errorShown) {
                    this.container.find('.error-message').show();
                }
            }

            this.container.find('.form-blocker').height(this.container.find('.form-wrapper').height());
        },

        animateInNavTitle: function () {
            var splash = $('.work-title-slash');
            var arrow = $('.nav-back-arrow');
            var title = $('.inner-holder');
            var timeline = new TimelineLite();

            $('.nav-button-text').addClass('clickable');
            TweenLite.set(splash, {x: -10});
            TweenLite.set($('.work-title'), {autoAlpha: 1});
            TweenLite.set(arrow, {x: 10});

            TweenLite.set(title, {autoAlpha: 1, position: 'relative', left: '-100%'});
            timeline.add(TweenLite.to(splash, 0.3, {autoAlpha: 1, x: 0, delay: 0.5, ease: Expo.easeOut}));
            timeline.add(TweenLite.to(title, 1.1, {left: 0, delay: 0, ease: Expo.easeOut}));
            timeline.add(TweenLite.to(arrow, 0.2, {width: 28, x: 0, delay: '-0.4', ease: Linear.easeIn}));
        }
    });
});
