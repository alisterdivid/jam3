define(['jquery', 'Class', 'Global', 'ui/VideoControls', 'utils/GA'], function ($, Class, Global, VideoControls, GA) {

  return new Class({
    initialize: function () {
      if ($('.videoPlayer').length > 0) {
        new VideoControls($('.videoPlayer').last());
      } 
      
      GA.setPageID('reel');
    }
  });
});
