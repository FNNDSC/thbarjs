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
    thbarjs.ThumbnailsBar = function(options, fileManager) {

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
     thbarjs.ThumbnailsBar.prototype.init = function(imgFileArr, callback) {
       var self = this;

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
         zIndex: 9999,
         cursor: 'move',
         containment: self.container.parent(), // within which elem displacement is restricted
         helper: 'clone', // visually moving element is a clone of the corresponding thumbnail
         dropOnEmpty: true, // allows depositing items into an empty list

         //event handlers
         // beforeStop is called when the placeholder is still in the list
         beforeStop: function(evt, ui) {

           self.onBeforeStop(evt, ui);
         },

         start: function(evt, ui) {

           self.onStart(evt, ui);
         }
      };

      // make the sortable div within the thumbnails bar a jQuery UI's sortable element
      self.jqSortable.sortable(sort_opts);

      var checkIfThumbnailsBarIsReady =  function() {

        if (++self.numOfLoadedThumbnails === self.numThumbnails) {

          // all thumbnails loaded, thumbnails bar is ready
          if (callback) {callback();}
        }
      };

      // load thumbnail images and create their UIs when ready
      self.numThumbnails = imgFileArr.length;
      for (var i=0; i<self.numThumbnails; i++) {
        self.addThumbnail(imgFileArr[i], checkIfThumbnailsBarIsReady);
      }

      // set the layout and position of the thumbnails bar
      self.setLayout(self.layout);
    };

    /**
     * Set thumbnails bar's layout.
     *
     * @param {String} layout: "vertical", "horizontal" or "grid".
     */
     thbarjs.ThumbnailsBar.prototype.setLayout = function(layout) {
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
     thbarjs.ThumbnailsBar.prototype.setPosition = function(pos) {
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
     thbarjs.ThumbnailsBar.prototype.onBeforeStop = function(evt, ui) {

       console.log('onBeforeStop not overwritten!');
       console.log('event obj: ', evt);
       console.log('ui obj: ', ui);
     };

    /**
     * This method is called at the beginning of moving a thumbnail's visual element
     *
     * @param {Object} jQuery UI event object.
     * @param {Object} jQuery UI ui object.
     */
     thbarjs.ThumbnailsBar.prototype.onStart = function(evt, ui) {

       console.log('onStart not overwritten!');
       console.log('event obj: ', evt);
       console.log('ui obj: ', ui);
     };

    /**
     * Set complementary jQuery UI sortable elements which the moving helper can be visually appended to.
     *
     * @param {String} css selector indicating the complementary sortable elements.
     */
     thbarjs.ThumbnailsBar.prototype.setComplementarySortableElems = function(cssSelector) {

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
     thbarjs.ThumbnailsBar.prototype.getThumbnailContId = function(thumbnailId) {

       // the thumbnail's container DOM id is related to the thumbnail's integer id
       return this.thumbnailsIdPrefix + thumbnailId;
    };

    /**
     * Returns a thumbnail's integer id.
     *
     * @param {String} thumbnail's container DOM id.
     * @return {Number} thumbnail's integer id.
     */
     thbarjs.ThumbnailsBar.prototype.getThumbnailId = function(thumbnailContId) {

       // the thumbnail's integer id is related to the thumbnail's container DOM id
       return  parseInt(thumbnailContId.replace(this.thumbnailsIdPrefix, ""));
    };

    /**
     * Add a thumbnail corresponding to the imgFileObj argument to the thumbnails bar. If there is
     * a thumbnail property in the imgFileObj then load it otherwise automatically create the thumbnail
     * from an internal renderer's canvas object
     *
     * @param {Oject} Image file object with the properties:
     *  -id: Integer, the object's id
     *  -baseUrl: String ‘directory/containing/the/files’
     *  -imgType: String neuroimage type. Any of the possible values returned by rendererjs.Renderer.imgType
     *  -files: Array of HTML5 File objects or custom file objects with properties:
     *     -remote: a boolean indicating whether the file has not been read locally (with a filepicker)
     *     -url the file's url
     *     -cloudId: the id of the file in a cloud storage system if stored in the cloud
     *     -name: file name
     *  The files array contains a single file for imgType different from 'dicom' or 'dicomzip'
     *  -thumbnail: Optional HTML5 File or custom file object (optional jpg file for a thumbnail image)
     * @param {Function} optional callback to be called when the thumbnail has been added
     */
     thbarjs.ThumbnailsBar.prototype.addThumbnail = function(imgFileObj, callback) {
       var fname, info, title;
       var id = imgFileObj.id;
       var self = this;

       // we assume the name of an already existing thumbnail (eg. generated on the server side) is of the form:
       // 1.3.12.2.1107.5.2.32.35288.30000012092602261631200043880-AXIAL_RFMT_MPRAGE-Sag_T1_MEMPRAGE_1_mm_4e_nomoco.jpg
       if (imgFileObj.thumbnail) {

         fname = imgFileObj.thumbnail.name;

       } else if (imgFileObj.imgType !== 'dicom') {

         fname = imgFileObj.files[0].name;

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

       } else {

         title = imgFileObj.files[0].name;
         info = title.substr(-10);
       }

       // append this thumbnail to the sortable div within the thumbnails bar
       var jqTh = $(
         '<div id="' + self.getThumbnailContId(id) + '" class="view-thumbnail">' +
           '<img class="view-thumbnail-img" title="' + title + '">' +
           '<div class="view-thumbnail-info">' + info + '</div>' +
         '</div>'
       );

       self.jqSortable.append(jqTh);

       if (imgFileObj.thumbnail) {

         self.loadThumbnail(imgFileObj.thumbnail, jqTh, function() {

           if (callback) {callback();}
         });

       } else {

         self.createThumbnail(imgFileObj, jqTh, function() {

           if (callback) {callback();}
         });
       }
     };

     /**
      * Load a thumbnail image.
      *
      * @param {Oject} HTML5 File object or custom file object with properties:
      *   -remote: a boolean indicating whether the file has not been read locally (with a filepicker)
      *   -url the file's url
      *   -cloudId: the id of the file in a cloud storage system if stored in the cloud
      *   -name: file name
      * @param {Function} jQuery object for the thumbnail's div frame.
      * @param {Function} callback to be called when the thumbnail has been loaded.
      */
      thbarjs.ThumbnailsBar.prototype.loadThumbnail = function(thFile, jqTh, callback) {
        var jqThImg = $('.view-thumbnail-img', jqTh);

        // renderer options object
        var options = {
          container: null,
          rendererId: '',
        };

        var tmpRenderer = new renderer.Renderer(options, this.fileManager);

        tmpRenderer.readFile(thFile, 'readAsDataURL', function(thData) {

          jqThImg.attr('src', thData);
          if (callback) { callback(); }
        });
      };

    /**
     * Create a thumbnail image from the canvas of an internal renderer object.
     *
     * @param {Oject} Image file object as in the addThumbnail method.
     * @param {Function} jQuery object for the thumbnail's div frame.
     * @param {Function} callback to be called when the thumbnail has been created.
     */
     thbarjs.ThumbnailsBar.prototype.createThumbnail = function(imgFileObj, jqTh, callback) {
       var self = this;
       var jqThImg = $('.view-thumbnail-img', jqTh);
       var jqThInfo = $('.view-thumbnail-info', jqTh);

       // append a container for the internal temporal renderer
       var tempRenderCont = $('<div></div>');
       self.container.append(tempRenderCont);

       // renderer options object
       var options = {
         container: tempRenderCont[0],
         rendererId: self.thumbnailsIdPrefix + '_tmprenderer' + imgFileObj.id, // for the internal XTK renderer container
       };

       // append a container for the temporal renderer's internal XTK renderer
       tempRenderCont.append('<div id="' + options.rendererId + '"></div>');

       // make div for the renderer's canvas the same size as the <img> element
       var imgWidth = jqThImg.css('width');
       var imgHeight = jqThImg.css('height');
       $('#' + options.rendererId).css({ width: imgWidth, height: imgHeight });

       // create the temporal renderer object
       var tmpRenderer = new renderer.Renderer(options, self.fileManager);

       tmpRenderer.imgFileObj = imgFileObj;
       tmpRenderer.createRenderer();
       tmpRenderer.createVolume();

       tmpRenderer.readVolumeFiles( function() {

         if (tmpRenderer.imgFileObj.dicomInfo) {

           //update the thumbnail info with the series description
           var title = tmpRenderer.imgFileObj.dicomInfo.seriesDescription;
           var info = title.substr(0, 10);
           jqThImg.attr('title', title);
           jqThInfo.text(info);
         }

         tmpRenderer.renderVolume( function() {

           if (tmpRenderer.error) {
             // hide image
             jqThImg.hide();
             // create invalid data container to be displayed instead
             $( '<div class="badData"> <i class="fa fa-times"></i> Invalid data <div/>').prependTo(jqThImg.parent());

             tmpRenderer.destroy();
             tempRenderCont.remove();

             if (callback) {callback();}

           } else {

             tmpRenderer.getThumbnail( function(thData) {

               jqThImg.attr('src', thData);

               tmpRenderer.destroy();
               tempRenderCont.remove();

               if (callback) {callback();}
             });
           }
         });
       });
     };

     /**
      * Remove a thumbnail from the thumbnails bar.
      *
      * @param {Number} thumbnail's integer id.
      */
      thbarjs.ThumbnailsBar.prototype.removeThumbnail = function(thumbnailId) {

        var contId = this.getThumbnailContId(thumbnailId);

        $('#' + contId).remove();

        this.numThumbnails--;
        this.numOfLoadedThumbnails--;
      };

    /**
     * Remove event handlers and html interface.
     */
     thbarjs.ThumbnailsBar.prototype.destroy = function() {

       this.numThumbnails = 0;
       this.numOfLoadedThumbnails = 0;
       this.container.empty();
       this.container = null;
     };


    return thbarjs;
  });
