/**
 * This module implements the thumbnail bar 's specification (tests).
 *
 */

define(['thbarjs'], function(thbarjs) {

  describe('thbarjs', function() {
    var thBar;

    // Append container div
    $(document.body).append('<div id="thbarcontainer"></div>');


    beforeEach(function() {
      thBar = new thbarjs.ThumbnailBar('thbarcontainer');
      thBar.init([{
        id: 0,
        baseUrl: "/",
        imgType: "nii",
        files: [{name: "vol0.nii"}]
      },
      {
        id: 1,
        baseUrl: "/",
        imgType: "nii",
        files: [{name: "vol1.nii"}]
      }]);
    });

    afterEach(function() {
      thBar.destroy();
    });

    it('thbarjs.ThumbnailBar.prototype.getThumbnailContId(0) returns thbarcontainer_th0',
      function () {
        expect(thBar.getThumbnailContId(0)).toEqual('thbarcontainer_th0');
      }
    );

  });
});
