define(['Class', 'jquery', 'TweenLite', 'TimelineLite', 'Global'], function(Class, $, TweenLite, TimelineLite, Global) {

  return new Class({

    initialize: function(data) {
      //console.log('Cells init', data);

      // images data
      var imageURL = data.featured_image && data.featured_image.source;
      var sizes = data.featured_image && data.featured_image.attachment_meta.sizes;

      // note we need to check for sizes to exist in the following lines of code
      // and load default feature image in case thumbnails were not regenerated to avoid code failure
      var imageAttr = {
        tabletPortrait: (sizes && sizes.desktopHomeMobile) ? sizes.desktopHomeMobile.url : imageURL,
        tabletLandscape:  (sizes && sizes.desktopHomeTabletLandscape) ? sizes.desktopHomeTabletLandscape.url : imageURL,
        desktop: (sizes && sizes.desktopHomeTabletLandscape) ? sizes.desktopHomeTabletLandscape.url : imageURL,
        mobile: (sizes && sizes.desktopHomeMobile) ? sizes.desktopHomeMobile.url : imageURL
      };

      // client or subtitle
      // this one is tricky because WP API doesn't get acf by default, so the are options:
      // 1. Use 'acf-to-wp-api' plugin that exposes afc in response but it significantly increases response time
      // 2. Use a separate taxonomy for client name
      var subtitle = '';
      if (data.acf) {
        // if acf-to-wp-api plugin enabled
        subtitle = data.acf.work_section_subtitle;
      } else   if (data.terms.clients) {
        // if 'client name' taxonomy is set
        subtitle = data.terms.clients[0].name;
      }

      // work categories
      var categories = data.terms['work-category'];
      var categoriesList = '';
      var classList = [];
      if (categories) {
        categories.forEach(function(c) {
          classList.push(c.slug);
          categoriesList += '<li class="work-cat-icon ' + c.slug + '"><i class="icon icon-' + c.slug + '">' + c.name + '</i></li>';
        });
      }
      var classListStr = classList.join(' ');

      // tags
      var tags = data.terms['post_tag'];
      var tagsList = [];
      if (tags) {
        tags.forEach(function(c) {
          if (c.slug.indexOf('featured-for') === -1) tagsList.push('tag-' + c.slug);
        });
      }
      var tagsListStr = tagsList.join(' ');
      if (!tagsListStr) tagsListStr = 'untagged';

      this.dom = $(
          '<li class="mix resize ' + classListStr + '" data-filter="' + classListStr + '">' +
            '<article class="hentry ' + data.slug + ' ' + data.type + ' '  + data.status + ' ' + tagsListStr + '">' +
              '<div class="image-wrapper">' +
                '<a href="' + data.link + '" rel="bookmark" data-postid="' + data.ID + '" data-postslug="' + data.slug + '">' +
                  '<div class="swipe-arrow"><i class="icon icon-angle-left"></i><div class="swipe-text">SWIPE</div></div>' +
                  '<div class="loadOverlay"></div>' +
                  '<img  src="' + imageURL + '" ' + 'class="responsive panel wp-post-image" ' +
                        'alt="' + data.featured_image.title + '" ' +
                        'data-src-tabletportrait="' + imageAttr.tabletPortrait + '" ' +
                        'data-src-tabletlandscape="' + imageAttr.tabletLandscape + '" ' +
                        'data-src-mobile="' + imageAttr.mobile + '" ' +
                        'data-src-desktop="' + imageAttr.desktop + '" >' +
                  '<div class="image-overlay-color"></div>' +
                  '<div class="overlay panel">' +
                    '<span class="grey-bg-wrap"><span class="grey-bg"></span></span>' +
                    '<header>' +
                      '<h2 class="overlay-title">' + data.title + '</h2>' +
                      '<h3 class="overlay-sub-title">' + subtitle + '</h3>' +
                      '<ul>' + categoriesList + '</ul>' +
                    '</header>' +
                  '</div>' +
                '</a>' +
              '</div>' +
            '</article>' +
          '</li>'
      );
    }
  })
});