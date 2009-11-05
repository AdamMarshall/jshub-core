/**
 * jsHub tag module dependencies and configuration
 * @module jshub
 *//*--------------------------------------------------------------------------*/

// JSLint options
/*global YUI, jsHub */
"use strict";

YUI.add("jshub", function (Y) {

  // Initialise lifecycle triggers
  // Can be used to pre-configure data at page level if necessary
  jsHub.trigger("data-capture-start");

  // Data is ready to be parsed by Data Capture plugins
  jsHub.trigger("page-view");

  // Data capture phase is complete
  jsHub.trigger("data-capture-complete");

}, "2.0.0", {
  requires: ["yui", "jquery", "hub", "logger", "image-transport", "form-transport", "utilities", "microformats"], 
  after: ["jquery"]
});