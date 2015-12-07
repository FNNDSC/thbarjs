require.config({
  baseUrl: 'js/components',
  paths: {
    // The left side is the module ID, the right side is the path to the file relative
    // to baseUrl (which is in turn relative to the directory of this config script).
    // Also, the path should NOT include the '.js' file extension.
    // This example tries to load jQuery from Google's CDN first and if failure then falls
    // back to the local jQuery at jquery/dist/jquery.min.js relative to the baseUrl.
    //
    // All JS modules are needed in development mode. However the only modules needed after
    // building are jquery, jquery_ui and minimized thbarjs.

    jquery: ['https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min', 'jquery/dist/jquery.min'],
    jquery_ui: ['https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min', 'jquery-ui/jquery-ui.min'],
    gapi: 'https://apis.google.com/js/api',
    jszip: 'jszip/dist/jszip',
    dicomParser: 'dicomParser/dist/dicomParser.min',
    utiljs: 'utiljs/src/js/utiljs',
    fmjs: 'fmjs/src/js/fmjs',
    xtk: 'rendererjs/src/js/lib/xtk',
    rendererjs: 'rendererjs/src/js/rendererjs',
    thbarjs: '../thbarjs'
  }
});


require(['fmjs', 'rendererjs', 'thbarjs'], function(fm, renderer, thbar) {
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
    var baseUrl = "/";
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

    for (var i=0; i<files.length; i++) {
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
