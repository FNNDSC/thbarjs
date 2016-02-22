/**
 * This module implements the thumbnail bar 's specification (tests).
 *
 */

define(['thbarjsPackage'], function(thbarjs) {

  describe('thbarjs', function() {
    var thBar;

    // thumbnails bar options object
    var options = {
      container: 'thbarcontainer',
      position: {
        top: '15px',
        left: '10px'
      },
      layout: 'vertical',
      thumbnailsIdPrefix: 'th'
    };

    // Append container div
    $(document.body).append('<div id="thbarcontainer"></div>');

    beforeEach(function() {
      thBar = new thbarjs.ThumbnailsBar(options);
      thBar.init([{
        id: 0,
        baseUrl: '/',
        imgType: 'nii',
        files: [{name: 'vol0.nii'}]
      },
      {
        id: 1,
        baseUrl: '/',
        imgType: 'nii',
        files: [{name: 'vol1.nii'}]
      }]);
    });

    afterEach(function() {
      thBar.destroy();
    });

    it('thbarjs.ThumbnailsBar.prototype.getThumbnailContId(0) returns th0',
      function() {
        expect(thBar.getThumbnailContId(0)).toEqual('th0');
      }
    );

  });
});
