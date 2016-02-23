require.config({
  baseUrl: '../bower_components',
  paths: {
    jquery: ['https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min', 'jquery/dist/jquery.min'],
    jquery_ui: ['https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min', 'jquery-ui/jquery-ui.min'],
  },
  packages: [

    // bower packages
    {
      name: 'fmjs',
      location: 'fmjs/src',
      main: 'js/fmjs'
    },
    {
      name: 'rendererjs', // used for mapping...
      location: 'rendererjs/src',   // relative to base url
      main: 'js/rendererjs'
    },

    // local packages
    {
      name: 'thbarjs', // used for mapping...
      location: './',   // relative to base url
      main: 'thbarjs/src/js/thbarjs'
    }
  ]
});
