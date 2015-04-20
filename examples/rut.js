// [rut.js] is a native js plugin that tracks user behaviour & gathers page insights
// [version] 0.1
// [by] Jean Farrugia (http://github.com/frg)

(function() {
  var _this = this;
  var localStorageName = "__rut";
  var dateOfPageLoad = new Date();
  var serverResponded = true;
  var urlStringLimit = 1800;
  var guid = "";

  // Define our constructor
  this.Rut = function() {

    // Define option defaults
    var defaults = {
      debugMode: true,
      incrementSend: 5000,
      serverURL: window.location.origin + "/rut",
      retryOnFailTimeout: 5000,
      // to implement
      obfuscateLocalData: false,
      captureErrors: true,
      captureBrowserDetails: true,
      capturePageStats: true
    };

    // Create options by extending defaults with the passed in arugments
    if (arguments[0] && typeof arguments[0] === "object") {
      _this.options = extendDefaults(defaults, arguments[0]);
    }

    // Capture errors
    if (_this.options.captureErrors == true) {
      window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
        if (errorMsg.indexOf('Script error.') > -1) {
          // if error message is useless.. do nothing
          return;
        }

        console.info('Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber + ' Column: ' + column + ' StackTrace: ' +  errorObj);
      }
    }

    // Get page load time
    if (_this.options.capturePageStats == true) {
      // to log attributes and such
      var currentURL = window.location.href;

      var URLreferrer = document.referrer;

      window.onload = function(){
        setTimeout(function(){
          // https://developer.mozilla.org/en-US/docs/Web/Events/DOMContentLoaded
          // might just log all this info
          var t = performance.timing;

          // Network latency
          console.info("Network latency: ", t.responseEnd - t.fetchStart, "ms");

          // The time taken for page load once the page is received from the server
          console.info("Page load: ", t.loadEventEnd - t.responseEnd, "ms");

          // The whole process of navigation and page load
          console.info("Navigation & Page load: ", t.loadEventEnd - t.navigationStart, "ms");

        }, 0);
      }
    }

    // Get browser details
    if (_this.options.captureBrowserDetails == true) {
      navigator.userAgent
      navigator.appVersion
      navigator.platform
      navigator.cookieEnabled
      window.outerWidth
      window.outerHeight
      window.innerWidth
      window.innerHeight
      window.navigator.javaEnabled()

      // Credit to font and plugin code
      // https://panopticlick.eff.org
      function getPlugins(){
        // fetch and serialize plugins
        var plugins = "";

        // in Mozilla and most non-IE browsers
        if (navigator.plugins) {
          var np = navigator.plugins;
          var plist = new Array();

          // sorting navigator.plugins is a right royal pain
          // but it seems to be necessary because their order
          // is non-constant in some browsers
          for (var i = 0; i < np.length; i++) {
            plist[i] = np[i].name + "; ";
            plist[i] += np[i].description + "; ";
            plist[i] += np[i].filename + ";";

            for (var n = 0; n < np[i].length; n++) {
              plist[i] += " (" + np[i][n].description +"; "+ np[i][n].type +
                         "; "+ np[i][n].suffixes + ")";
            }

            plist[i] += ". ";
          }

          plist.sort();
          for (i = 0; i < np.length; i++) {
            plugins+= "Plugin "+i+": " + plist[i];
          }
        }

        return plugins;
      }
      console.info("Plugins: ", getPlugins());

      function getFonts() {
        // Try flash first
      	var fonts = "";
        // <embed height="1" flashvars="" pluginspage="http://www.adobe.com/go/getflashplayer" src="resources/fonts2.swf" type="application/x-shockwave-flash" width="1" swliveconnect="true" id="flashfontshelper" name="flashfontshelper">
      	var obj = document.getElementById("flashfontshelper");

        if (obj && typeof(obj.GetVariable) != "undefined") {
      		fonts = obj.GetVariable("/:user_fonts");
          fonts = fonts.replace(/,/g,", ");
          fonts += " (via Flash)";
      	} else {
          // <script type="text/javascript">
          //   var attributes = {codebase: "java", code: "fonts.class", id: "javafontshelper", name: "javafontshelper", "mayscript": "true", width: 1, height: 1};
          //   if (deployJava.versionCheck('1.1+'))
          //     deployJava.writeAppletTag(attributes);
          // </script>
          // Try java fonts
          try {
            var javafontshelper = document.getElementById("javafontshelper");
            var jfonts = javafontshelper.getFontList();

            for (var n = 0; n < jfonts.length; n++) {
              fonts = fonts + jfonts[n] + ", ";
            }

            fonts += " (via Java)";
          } catch (ex) {}
        }

        if ("" == fonts) {
          fonts = "No Flash or Java fonts detected";
        }

        return fonts;
      }
      console.info("Fonts: ", getFonts());
    }

    _this.options.serverURL = _this.options.serverURL + "?guid=" + guid + "&";

    // check for local storage support
    try {
      ('localStorage' in window && window.localStorage !== null)
    } catch(e) {
      _this.options.incrementSend = false;
    }

    // log event to queue
    this.logEvent = function() {
      console.info("Logging event.");

      appendQueue({
        msSincePageLoad: new Date() - dateOfPageLoad
      });
    };

    if (!_this.options.debugMode && isInt(_this.options.incrementSend) && _this.options.incrementSend > 0) {
      window.setInterval(function() {
        _this.sendQueue(_this.getQueue());
      }, _this.options.incrementSend);
    } else {
      // append log function to send data on log
      var _oldLogEvent = _this.logEvent;
      this.logEvent = function() {
          _oldLogEvent.apply(this, arguments); // use .apply() to call it

          _this.sendQueue();
        };
    }

    // send current queue to server
    this.sendQueue = function() {
      console.info("Sending queue.");

      var pipeline = appendPipelineWithQueue().pipeline;

      // if events exist in pipeline
      if (serverResponded && pipeline.length > 0) {
        serverResponded = false;
        var i = new Image();
        i.src = _this.options.serverURL + 'queue=' + JSON.stringify(pipeline);

        // load / fail events
        i.onload = function(){
          serverResponded = true;
          console.info("info send success");
          clearPipeline();
        };
        i.onerror = function(){
          serverResponded = true;
          console.info("info send failed");

          // retry send queue
          setTimeout(_this.sendQueue, _this.options.retryOnFailTimeout);
        };
      }
    };
  };

  // Public Methods

  Rut.prototype.trackElement = function(element, eventsTrigger, eventID, elementID, description) {

  };

  Rut.prototype.trackEvent = function(eventID, elementID, description) {

  };

  // Private Methods

  // append current queue to pipeline
  function appendPipelineWithQueue() {
    var localData = getLocalData();
    var newPipeline = localData.pipeline.concat(localData.queue);

    if ((_this.options.serverURL + 'queue=' + JSON.stringify(newPipeline)).length >= urlStringLimit) {
      return false;
    }

    localData.pipeline = newPipeline;
    localData.queue = [];

    // save localdata
    localStorage.setItem(localStorageName, JSON.stringify(localData));

    return localData;
  }

  // set pipeline
  // function setPipeline(pipelineArr) {
  //   var localData = getLocalData();
  //   localData.pipeline = pipelineArr;
  //
  //   localStorage.setItem(localStorageName, JSON.stringify(localData));
  // }

  // append event queue ready to be sent
  function appendQueue(event) {
    var localData = getLocalData();

    // append queue
    localData.queue.push(event);

    localStorage.setItem(localStorageName, JSON.stringify(localData));
  }

  // gets events that are waiting for
  // a successful server response
  // function getPipeline() {
  //   return getLocalData().pipeline;
  // }

  // clears pipeline
  function clearPipeline() {
    var localData = getLocalData();

    // clear pipeline
    localData.pipeline = [];

    // save pipeline
    localStorage.setItem(localStorageName, JSON.stringify(localData));
  }

  // gets event queue
  // function getQueue() {
  //   return getLocalData().queue;
  // }

  // clears event queue
  // function clearQueue() {
  //   var localData = getLocalData();
  //
  //   // clear queue
  //   localData.queue = [];
  //
  //   // save queue
  //   localStorage.setItem(localStorageName, JSON.stringify(localData));
  // }

  // Creates the default local storage json object
  function createDefaultJson() {
    return {
      guid: guid,
      pipeline: [],
      queue: []
    };
  }

  function isDataValid(json) {
    try {
      // check if data is json
      json = JSON.parse(json);
    } catch (ex) {
        return false;
    }

    // get default json object
    var defaultFormat = createDefaultJson();

    // loop through default json
    for (var formatProperty in defaultFormat) {
        // check if property exists
        if (!json.hasOwnProperty(formatProperty)) {
          return false;
        }
    }

    return true;
  }

  // Gets rut data from local storage
  function getLocalData() {
    // Retrieve the object from storage
    var json = localStorage.getItem(localStorageName);

    if (json !== null && isDataValid(json)) {
      return JSON.parse(json);
    }

    return createDefaultJson();
  }

  // UTILS

  function isInt(n){
    return Number(n)===n && n%1===0;
  }

  // Merges user options array with defaults array
  function extendDefaults(source, properties) {
    var property;
    for (property in properties) {
      if (properties.hasOwnProperty(property)) {
        source[property] = properties[property];
      }
    }
    return source;
  }

}());
