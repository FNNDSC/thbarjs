/**
 * This module implements the thumbnail bar 's specification (tests).
 *
 */

define(['thbarjs'], function(thbarjs) {

  describe('thbarjs', function() {

    var thBar;

    window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

    var testDataDir = 'bower_components/mri_testdata/';

    // Image file object
    var imgFileObj = {
      id: 0,
      baseUrl: testDataDir + 'volumes/nii/',
      imgType: 'vol',
      files: [{url: testDataDir + 'volumes/nii/s34654_df.nii', name: 's34654_df.nii', remote: true}]
    };

    // append a container for the thumbnails bar
    var container = $('<div></div>');
    $(document.body).append(container);

    // thumbnails bar options object
    var options = {
      container: container,
      position: {
        top: '15px',
        left: '10px'
      },
      layout: 'vertical',
    };

    beforeEach(function(done) {

      thBar = new thbarjs.ThumbnailsBar(options);

      thBar.init([imgFileObj], function() {

        done();
      });
    });

    afterEach(function() {

      thBar.destroy();
    });

    it('thbarjs.ThumbnailsBar container has class view-thumbnailsbar',

      function() {

        var val = thBar.container.hasClass('view-thumbnailsbar');
        expect(val).toEqual(true);
      }
    );

  });
});
