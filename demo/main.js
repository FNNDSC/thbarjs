require(['./config'], function() {
require(['fmjsPackage', 'rendererjsPackage', 'thbarjsPackage', 'jquery', 'jquery_ui'], function(fm, renderer, thbar) {
  // Entry point

  $('#thbarparentcontainer').sortable({
    cursor: 'move',
    //containment: '#thbarparentcontainer',
    distance: '150'
  });

  // Create a file manager object
  var CLIENT_ID = '1050768372633-ap5v43nedv10gagid9l70a2vae8p9nah.apps.googleusercontent.com';
  var driveFm = new fm.GDriveFileManager(CLIENT_ID);

  // thumbnails bar object
  var thBar = null;

  // thumbnails bar options object
  var options = {
    container: document.getElementById('thbarcontainer'),
    position: {
      top: '15px',
      left: '10px'
    },
    layout: 'vertical',
    thumbnailsIdPrefix: 'th'
  };

  // Event handler for the directory loader button
  var dirBtn = document.getElementById('dirbtn');

  dirBtn.onchange = function(e) {
    var files = e.target.files;
    var baseUrl = '/';
    var imgFileArr = [];

    if (thBar) {
      thBar.destroy();
    }

    // Create a thumbnails bar. The second parameter (a file manager) is optional and only required
    // if files are going to be loaded from GDrive
    thBar = new thbar.ThumbnailsBar(options, driveFm);

    if ('webkitRelativePath' in files[0]) {
      baseUrl = files[0].webkitRelativePath;
    }

    for (var i = 0; i < files.length; i++) {
      imgFileArr.push({
        id: i,
        baseUrl: baseUrl,
        imgType: renderer.Renderer.imgType(files[i]),
        files: [files[i]]
      });
    }

    thBar.init(imgFileArr);
  };

});
});
