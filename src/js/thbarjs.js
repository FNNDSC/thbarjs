/**
 * This module implements a thumbnail bar
 */

// define a new module
define(['utiljs', 'rboxjs', 'jquery_ui'], function(util, rbox) {

  /**
   * Provide a namespace for the thumbnail bar module
   *
   * @namespace
   */
   var thbarjs = thbarjs || {};

   /**
    * Class implementing the thumbnail bar
    *
    * @constructor
    * @param {Object} thumbnail bar's options with properties: contId, layout, position.
    * @param {Object} optional file manager object to enable reading of files from the cloud or HTML5
    * sandboxed filesystem.
    */
    thbarjs.ThumbnailBar = function(options, fileManager) {

      this.version = 0.0;
      // thumbnail bar container's ID
      this.contId = options.contId;
      // layout: vertical or horizontal
      this.layout = 'vertical';
      if (options.layout) {
        this.layout = options.layout;
      }
      // thumbnail bar's css position object with possible properties top, bottom, left, right
      if (options.position) {
        this.position = options.position;
      } else {
        this.position = {};
      }
      // jQuery object for the bar's div element (thumbnail bar container)
      this.jqThBar = null;
      // jQuery object for the sortable div element inside the thumbnail bar
      this.jqSortable = null;
      // number of thumbnails in the thumbnail bar
      this.numThumbnails = 0;
      // number of currently loaded thumbnails
      this.numOfLoadedThumbnails = 0;
      // file manager object
      this.fileManager = null;
      if (fileManager) {this.fileManager = fileManager;}
    };

    /**
     * Initialize the thumbnail bar.
     *
     * @param {Array} array of image file objects. Each object contains the following properties:
     *  -id: Integer, the object's id
     *  -baseUrl: String ‘directory/containing/the/files’
     *  -imgType: String neuroimage type. Any of the possible values returned by rboxjs.RenderersBox.imgType
     *  -files: Array of HTML5 File objects (it contains a single file for imgType different from 'dicom')
     *         DICOM files with the same base url/path are assumed to belong to the same volume
     *  -thumbnail: HTML5 or custom File object (optional jpg file for a thumbnail image)
     * @param {Function} optional callback to be called when the thumbnail bar is ready
     */
     thbarjs.ThumbnailBar.prototype.init = function(imgFileArr, callback) {
       var self = this;
       var tmpRBoxContId = this.contId + '_temprbox'; // container id of the internal temporal renderers box
       var jqThBar;

       // return if thumbnail bar already initialized
       if (this.jqThBar) {
         if (callback) {callback();}
         return;
       }

       // set jQuery obj for the thumbnail bar
       this.jqThBar = jqThBar = $('#' + this.contId);

       // append a temporal renderer box
       jqThBar.append('<div id="' + tmpRBoxContId + '"></div>');
       this.rBox = new rbox.RenderersBox({contId: tmpRBoxContId}, this.fileManager);
       this.rBox.init();

       // append a bar handle
       jqThBar.append('<div class="view-thumbnailbar-handle">...</div>');

       // append sortable div
       this.jqSortable = $('<div class="view-thumbnailbar-sortable"></div>');
       jqThBar.append(this.jqSortable);

       // add the appropriate classes
       jqThBar.addClass("view-thumbnailbar");

       // jQuery UI options object for sortable elems
       // ui-sortable CSS class is by default added to the containing elem
       // an elem being moved is assigned the ui-sortable-helper class
       var sort_opts = {
         cursor: 'move',
         containment: jqThBar.parent(), // within which elem displacement is restricted
         helper: 'clone', // visually moving element is a clone of the corresponding thumbnail
         dropOnEmpty: true, // allows depositing items into an empty list

         //event handlers
         // beforeStop is called when the placeholder is still in the list
         beforeStop: function(evt, ui) {
           self.onBeforeStop(evt, ui);
         }
      };

      // make the sortable div within the thumbnail bar a jQuery UI's sortable element
      this.jqSortable.sortable(sort_opts);

      var checkIfThumbnailBarIsReady =  function() {

        if (++self.numOfLoadedThumbnails === self.numThumbnails) {
          // all thumbnails loaded

          // destroy and remove temporal renderers box
          self.rBox.destroy();
          $('#' + tmpRBoxContId).remove();

          if (callback) {callback();}
        }
      };

      // load thumbnail images and create their UIs when ready
      this.numThumbnails = imgFileArr.length;
      for (var i=0; i<this.numThumbnails; i++) {
        this.loadThumbnail(imgFileArr[i], checkIfThumbnailBarIsReady);
      }

      // set the layout and position of the thumbnail bar
      this.setLayout(this.layout);
    };

    /**
     * Set thumbnail bar's layout.
     *
     * @param {String} layout: "vertical", "horizontal" or "grid".
     */
     thbarjs.ThumbnailBar.prototype.setLayout = function(layout) {
       var jqThBar = this.jqThBar;
       var jqThs = $('.view-thumbnail', jqThBar);

       this.layout = layout;

       if (layout === 'vertical') {

         jqThBar.removeClass("view-thumbnailbar-x");
         jqThBar.addClass("view-thumbnailbar-y");
         jqThs.removeClass("view-thumbnail-x");
         jqThs.addClass("view-thumbnail-y");

       } else if (layout === 'horizontal') {

         jqThBar.removeClass("view-thumbnailbar-y");
         jqThBar.addClass("view-thumbnailbar-x");
         jqThs.removeClass("view-thumbnail-y");
         jqThs.addClass("view-thumbnail-x");

       } else if (layout === 'grid') {
         jqThBar.removeClass("view-thumbnailbar-y view-thumbnailbar-x");
         jqThs.removeClass("view-thumbnail-y");
         jqThs.addClass("view-thumbnail-x");
       }

       this.setPosition(this.position);
     };

    /**
     * Set a new css position for the thumbnail bar.
     *
     * @param {Object} css position object with possible properties: "top", "bottom", "left" and "right".
     */
     thbarjs.ThumbnailBar.prototype.setPosition = function(pos) {
       var jqThBar = this.jqThBar;
       var layout = this.layout;
       var t = "", r = "", b = "", l = "";

       if (pos) {

         if (pos.top) {
           this.position.top = pos.top;
           jqThBar.css({ top: pos.top });
           t = ' - ' + pos.top;
         }

         if (pos.right) {
           this.position.right = pos.right;
           jqThBar.css({ right: pos.right });
           r = ' - ' + pos.right;
         }

         if (pos.bottom) {
           this.position.bottom = pos.bottom;
           jqThBar.css({ bottom: pos.bottom });
           b = ' - ' + pos.bottom;
         }

         if (pos.left) {
           this.position.left = pos.left;
           jqThBar.css({ left: pos.left });
           l = ' - ' + pos.left;
         }

         if ((layout === 'vertical') && (t || b)) {
           jqThBar.css({ height: 'calc(100%' + t + b + ')' });

         } else if ((layout === 'horizontal') && (r || l)) {
           jqThBar.css({ width: 'calc(100%' + r + l + ')' });

         } else if (layout === 'grid') {

           if (t || b) {
             jqThBar.css({ height: 'calc(100%' + t + b + ')' });
           }

           if (r || l) {
             jqThBar.css({ width: 'calc(100%' + r + l + ')' });
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
       var rBox = this.rBox;

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

       // append this thumbnail to the sortable div within the thumbnailbar
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
         rBox.readFile(thumbnail, 'readAsDataURL', function(data) {
           jqImg.attr('src', data);

           if (callback) {callback();}
         });
       }

       // internal function to create and read the thumbnails' url so it can be assigned to the src of <img>
       function createAndReadThumbnailUrl() {
         var filedata = [];
         var numFiles = 0;
         var vol = rBox.createVolume(imgFileObj);
         var render;
         var tempRenderContId = jqTh.attr('id') + '_temp';
         var imgWidth = jqImg.css('width');
         var imgHeight = jqImg.css('height');

         // hide the <img> and prepend a div for a renderer canvas with the same size as the hidden <img>
         jqImg.css({ display:'none' });
         jqTh.prepend('<div id="' + tempRenderContId + '"></div>');
         $('#' + tempRenderContId).css({ width: imgWidth, height: imgHeight });
         render = rBox.create2DRender(tempRenderContId, 'Z');

         render.afterRender = function() {
           var canvas = $('#' + tempRenderContId + ' > canvas')[0];

           rBox.readFile(util.dataURItoJPGBlob(canvas.toDataURL('image/jpeg')), 'readAsDataURL', function(data) {
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
           rBox.readFile(file, 'readAsArrayBuffer', function(data) {
             filedata[pos] = data;

             if (++numFiles === imgFileObj.files.length) {
               // all files have been read
               if (imgFileObj.imgType === 'dicom' || imgFileObj.imgType === 'dicomzip') {

                 // if the files are zip files of dicoms then unzip them and sort the resultant files
                 if (imgFileObj.imgType === 'dicomzip') {
                   var fDataArr = [];

                   for (var i=0; i<filedata.length; i++) {
                     fDataArr = fDataArr.concat(rBox.unzipFileData(filedata[i]));
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
                   var dicomInfo = rbox.RenderersBox.parseDicom(filedata[0]);

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
       this.jqThBar.empty();
       this.jqThBar = null;
     };


    return thbarjs;
  });
