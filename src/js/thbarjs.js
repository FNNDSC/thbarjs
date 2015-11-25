/**
 * This module implements a thumbnails bar
 */

// define a new module
define(['utiljs', 'rendererjs', 'jquery_ui'], function(util, renderer) {

  /**
   * Provide a namespace for the thumbnails bar module
   *
   * @namespace
   */
   var thbarjs = thbarjs || {};

   /**
    * Class implementing the thumbnails bar
    *
    * @constructor
    * @param {Object} thumbnails bar's options with properties:
    *   -container: thumbnails bar's container's DOM id or DOM object
    *   -position: thumbnails bar's css position object with possible properties top, bottom, left, right
    *   -layout: thumbnails bar's layout, either of the strings 'vertical', 'horizontal' or 'grid'
    *   -thumbnailsIdPrefix: a prefix string for the DOM ids used for all of the thumbnails' containers
    * @param {Object} optional file manager object to enable reading of files from the cloud or HTML5
    * sandboxed filesystem.
    */
    thbarjs.ThumbnailBar = function(options, fileManager) {

      this.version = 0.0;

      // thumbnails bar's container
      if (typeof options.container === 'string') {

        // a DOM id was passed
        this.container = $('#' + options.container);

      } else {

        // a DOM object was passed
        this.container = $(options.container);
      }

      // thumbnails bar's css position object with possible properties top, bottom, left, right
      if (options.position) {
        this.position = options.position;
      } else {
        this.position = {};
      }

      // layout: vertical or horizontal
      this.layout = 'vertical';
      if (options.layout) {
        this.layout = options.layout;
      }

      // prefix string for the DOM ids that are going to be used for the thumbnails' containers
      this.thumbnailsIdPrefix = options.thumbnailsIdPrefix;

      // jQuery object for the sortable div element inside the thumbnails bar
      this.jqSortable = null;

      // number of thumbnails in the thumbnails bar
      this.numThumbnails = 0;

      // number of currently loaded thumbnails
      this.numOfLoadedThumbnails = 0;

      // file manager object
      this.fileManager = null;
      if (fileManager) {this.fileManager = fileManager;}
    };

    /**
     * Initialize the thumbnails bar.
     *
     * @param {Array} array of image file objects. Each object contains the following properties:
     *  -id: Integer, the object's id
     *  -baseUrl: String ‘directory/containing/the/files’
     *  -imgType: String neuroimage type. Any of the possible values returned by rendererjs.Renderer.imgType
     *  -files: Array of HTML5 File objects or custom file objects with properties:
     *     -remote: a boolean indicating whether the file has not been read locally (with a filepicker)
     *     -url the file's url
     *     -cloudId: the id of the file in a cloud storage system if stored in the cloud
     *     -name: file name
     *  The files array contains a single file for imgType different from 'dicom' or 'dicomzip'
     *  -thumbnail: Optional HTML5 or custom File object (optional jpg file for a thumbnail image)
     * @param {Function} optional callback to be called when the thumbnails bar is ready
     */
     thbarjs.ThumbnailBar.prototype.init = function(imgFileArr, callback) {
       var self = this;
       var rendererId = self.thumbnailsIdPrefix + '_renderer';

       // append an internal renderer
       var jqR = $('<div></div>');
       self.container.append(jqR);

       // internal renderer options object
       var options = {
         container: jqR[0],
         rendererId: rendererId, // for the internal XTK renderer container
       };

       // create the internal renderer
       self.renderer = new renderer.Renderer(options, self.fileManager);
       self.renderer.init();

       // append a bar handle
       self.container.append('<div class="view-thumbnailsbar-handle">...</div>');

       // append sortable div
       self.jqSortable = $('<div class="view-thumbnailsbar-sortable"></div>');
       self.container.append(self.jqSortable);

       // add the appropriate classes
       self.container.addClass("view-thumbnailsbar");

       // jQuery UI options object for sortable elems
       // ui-sortable CSS class is by default added to the containing elem
       // an elem being moved is assigned the ui-sortable-helper class
       var sort_opts = {
         cursor: 'move',
         containment: self.container.parent(), // within which elem displacement is restricted
         helper: 'clone', // visually moving element is a clone of the corresponding thumbnail
         dropOnEmpty: true, // allows depositing items into an empty list

         //event handlers
         // beforeStop is called when the placeholder is still in the list
         beforeStop: function(evt, ui) {
           self.onBeforeStop(evt, ui);
         }
      };

      // make the sortable div within the thumbnails bar a jQuery UI's sortable element
      self.jqSortable.sortable(sort_opts);

      var checkIfThumbnailBarIsReady =  function() {

        if (++self.numOfLoadedThumbnails === self.numThumbnails) {
          // all thumbnails loaded

          // destroy and remove internal renderers box
          self.renderer.destroy();
          self.renderer.container.remove();

          if (callback) {callback();}
        }
      };

      // load thumbnail images and create their UIs when ready
      self.numThumbnails = imgFileArr.length;
      for (var i=0; i<self.numThumbnails; i++) {
        self.loadThumbnail(imgFileArr[i], checkIfThumbnailBarIsReady);
      }

      // set the layout and position of the thumbnails bar
      self.setLayout(self.layout);
    };

    /**
     * Set thumbnails bar's layout.
     *
     * @param {String} layout: "vertical", "horizontal" or "grid".
     */
     thbarjs.ThumbnailBar.prototype.setLayout = function(layout) {
       var cont = this.container;
       var ths = $('.view-thumbnail', cont);

       this.layout = layout;

       if (layout === 'vertical') {

         cont.removeClass("view-thumbnailsbar-x");
         cont.addClass("view-thumbnailsbar-y");
         ths.removeClass("view-thumbnail-x");
         ths.addClass("view-thumbnail-y");

       } else if (layout === 'horizontal') {

         cont.removeClass("view-thumbnailsbar-y");
         cont.addClass("view-thumbnailsbar-x");
         ths.removeClass("view-thumbnail-y");
         ths.addClass("view-thumbnail-x");

       } else if (layout === 'grid') {
         cont.removeClass("view-thumbnailsbar-y view-thumbnailsbar-x");
         ths.removeClass("view-thumbnail-y");
         ths.addClass("view-thumbnail-x");
       }

       this.setPosition(this.position);
     };

    /**
     * Set a new css position for the thumbnails bar.
     *
     * @param {Object} css position object with possible properties: "top", "bottom", "left" and "right".
     */
     thbarjs.ThumbnailBar.prototype.setPosition = function(pos) {
       var cont = this.container;
       var layout = this.layout;
       var t = "", r = "", b = "", l = "";

       if (pos) {

         if (pos.top) {
           this.position.top = pos.top;
           cont.css({ top: pos.top });
           t = ' - ' + pos.top;
         }

         if (pos.right) {
           this.position.right = pos.right;
           cont.css({ right: pos.right });
           r = ' - ' + pos.right;
         }

         if (pos.bottom) {
           this.position.bottom = pos.bottom;
           cont.css({ bottom: pos.bottom });
           b = ' - ' + pos.bottom;
         }

         if (pos.left) {
           this.position.left = pos.left;
           cont.css({ left: pos.left });
           l = ' - ' + pos.left;
         }

         if ((layout === 'vertical') && (t || b)) {
           cont.css({ height: 'calc(100%' + t + b + ')' });

         } else if ((layout === 'horizontal') && (r || l)) {
           cont.css({ width: 'calc(100%' + r + l + ')' });

         } else if (layout === 'grid') {

           if (t || b) {
             cont.css({ height: 'calc(100%' + t + b + ')' });
           }

           if (r || l) {
             cont.css({ width: 'calc(100%' + r + l + ')' });
           }
         }
       }
     };

    /**
    * This method is called just before dropping a moving thumbnail's visual element on a complementary
    * jQuery UI's sortable element.
     *
     * @param {Object} jQuery UI event object.
     * @param {Object} jQuery UI ui object.
     */
     thbarjs.ThumbnailBar.prototype.onBeforeStop = function(evt, ui) {

       console.log('onBeforeStop not overwritten!');
       console.log('event obj: ', evt);
       console.log('ui obj: ', ui);
     };

   /**
    * Set complementary jQuery UI sortable elements which the moving helper can be visually appended to.
    *
    * @param {String} css selector indicating the complementary sortable elements.
    */
    thbarjs.ThumbnailBar.prototype.setComplementarySortableElems = function(cssSelector) {

      // the moving helper element can be appended to these elements
      this.jqSortable.sortable( "option", "appendTo", cssSelector);

      // connect with these sortable elements
      this.jqSortable.sortable( "option", "connectWith", cssSelector);
    };

    /**
     * Return a thumbnail's container DOM id.
     *
     * @param {Number} thumbnail's integer id.
     * @return {String} the thumbnail's container DOM id.
     */
     thbarjs.ThumbnailBar.prototype.getThumbnailContId = function(thumbnailId) {

       // the thumbnail's container DOM id is related to the thumbnail's integer id
       return this.contId + "_th" + thumbnailId;
    };

    /**
     * Returns a thumbnail's integer id.
     *
     * @param {String} thumbnail's container DOM id.
     * @return {Number} thumbnail's integer id.
     */
     thbarjs.ThumbnailBar.prototype.getThumbnailId = function(thumbnailContId) {

       // the thumbnail's integer id is related to the thumbnail's container DOM id
       return  parseInt(thumbnailContId.replace(this.contId + "_th", ""));
    };

    /**
     * Load the thumbnail corresponding to the imgFileObj argument. If there is a thumbnail
     * property in the imgFileObj then load it otherwise automatically create the thumbnail
     * from a renderer's canvas object
     *
     * @param {Oject} Image file object.
     * @param {Function} optional callback to be called when the thumbnail has been loaded
     */
     thbarjs.ThumbnailBar.prototype.loadThumbnail = function(imgFileObj, callback) {
       var fname, info, title, jqTh, jqImg;
       var id = imgFileObj.id;
       var jqSortable = this.jqSortable;
       var renderer = this.renderer;

       // we assume the name of the thumbnail can be of the form:
       // 1.3.12.2.1107.5.2.32.35288.30000012092602261631200043880-AXIAL_RFMT_MPRAGE-Sag_T1_MEMPRAGE_1_mm_4e_nomoco.jpg
       if (imgFileObj.thumbnail) {
         fname = imgFileObj.thumbnail.name;
       } else if (imgFileObj.imgType !== 'dicom'){
         fname = imgFileObj.files[0].name;
       } else {
         fname = ''; title = ''; info = '';
       }

       if (fname) {
         if (fname.lastIndexOf('-') !== -1) {
           title = fname.substring(0, fname.lastIndexOf('.'));
           title = title.substring(title.lastIndexOf('-') + 1);
           info = title.substr(0, 10);
         } else {
           title = fname;
           info = fname.substring(0, fname.lastIndexOf('.')).substr(-10);
         }
       }

       // append this thumbnail to the sortable div within the thumbnails bar
       jqSortable.append(
         '<div id="' + this.getThumbnailContId(id) + '" class="view-thumbnail">' +
           '<img class="view-thumbnail-img" title="' + title + '">' +
           '<div class="view-thumbnail-info">' + info + '</div>' +
         '</div>'
       );

       jqTh = $('#' + this.getThumbnailContId(id));
       jqImg = $('.view-thumbnail-img', jqTh);

       // internal function to read the thumbnail's url so it can be assigned to the src of <img>
       function readThumbnailUrl(thumbnail) {
         renderer.readFile(thumbnail, 'readAsDataURL', function(data) {
           jqImg.attr('src', data);

           if (callback) {callback();}
         });
       }

       // internal function to create and read the thumbnails' url so it can be assigned to the src of <img>
       function createAndReadThumbnailUrl() {
         var filedata = [];
         var numFiles = 0;
         var vol = r.createVolume(imgFileObj);
         var render;
         var tempRenderContId = jqTh.attr('id') + '_temp';
         var imgWidth = jqImg.css('width');
         var imgHeight = jqImg.css('height');

         // hide the <img> and prepend a div for a renderer canvas with the same size as the hidden <img>
         jqImg.css({ display:'none' });
         jqTh.prepend('<div id="' + tempRenderContId + '"></div>');
         $('#' + tempRenderContId).css({ width: imgWidth, height: imgHeight });
         render = r.createRenderer(tempRenderContId, 'Z');

         render.afterRender = function() {
           var canvas = $('#' + tempRenderContId + ' > canvas')[0];

           renderer.readFile(util.dataURItoJPGBlob(canvas.toDataURL('image/jpeg')), 'readAsDataURL', function(data) {
             jqImg.attr('src', data);
             render.remove(vol);
             vol.destroy();
             $('#' + tempRenderContId).remove();
             render.destroy();
             // restore the hidden <img>
             jqImg.css({ display:'block' });

             if (callback) {callback();}
           });
         };

         function readFile(file, pos) {
           renderer.readFile(file, 'readAsArrayBuffer', function(data) {
             filedata[pos] = data;

             if (++numFiles === imgFileObj.files.length) {
               // all files have been read
               if (imgFileObj.imgType === 'dicom' || imgFileObj.imgType === 'dicomzip') {

                 // if the files are zip files of dicoms then unzip them and sort the resultant files
                 if (imgFileObj.imgType === 'dicomzip') {
                   var fDataArr = [];

                   for (var i=0; i<filedata.length; i++) {
                     fDataArr = fDataArr.concat(r.unzipFileData(filedata[i]));
                   }
                   fDataArr = util.sortObjArr(fDataArr, 'name');

                   filedata = [];
                   var urls = [];
                   for (i=0; i<fDataArr.length; i++) {
                     filedata.push(fDataArr[i].data);
                     urls.push(imgFileObj.baseUrl + fDataArr[i].name);
                   }
                   vol.file = urls;
                 }

                 //update the thumbnail info with the series description
                 try {
                   var dicomInfo = renderer.Renderer.parseDicom(filedata[0]);

                   title = dicomInfo.seriesDescription;
                   info = title.substr(0, 10);

                   jqImg.attr('title', title);
                   $('.view-thumbnail-info', jqTh).text(info);

                 } catch(err) {
                   console.log('Could not parse dicom ' + imgFileObj.baseUrl + ' Error - ' + err);
                 }
               }

               vol.filedata = filedata;
               render.add(vol);
               // start the rendering
               render.render();
             }
           });
         }

         // read all files belonging to the volume
         for (var i=0; i<imgFileObj.files.length; i++) {
           readFile(imgFileObj.files[i], i);
         }
       }

       if (imgFileObj.thumbnail) {
         readThumbnailUrl(imgFileObj.thumbnail);
       } else {
         createAndReadThumbnailUrl();
       }
    };

    /**
     * Remove event handlers and html interface.
     */
     thbarjs.ThumbnailBar.prototype.destroy = function() {

       this.numThumbnails = 0;
       this.numOfLoadedThumbnails = 0;
       this.container.empty();
       this.container = null;
     };


    return thbarjs;
  });
