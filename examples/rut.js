// Create an immediately invoked functional expression to wrap our code
(function() {
  var _this = this;
  var localStorageName = "__rut";
  var dateOfPageLoad = new Date();
  var serverResponded = true;
  var urlStringLimit = 1900;
  var guid = "";

  // Define our constructor
  this.Rut = function() {

    // Define option defaults
    var defaults = {
      debugMode: true,
      incrementSend: 5000,
      serverURL: window.location.origin + "/rut",
      retryOnFailTimeout: 5000
    };

    // Create options by extending defaults with the passed in arugments
    if (arguments[0] && typeof arguments[0] === "object") {
      _this.options = extendDefaults(defaults, arguments[0]);
    }

    _this.options.serverURL = _this.options.serverURL + "?guid=" + guid + "&";

    // check for local storage support
    try {
      ('localStorage' in window && window.localStorage !== null);
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

    pipeline = localData.pipeline.concat(localData.queue);

    if ((_this.options.serverURL + 'queue=' + JSON.stringify(pipeline)).length >= urlStringLimit) {
      return false;
    }

    localData.pipeline = pipeline;
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

    if (json !== null && isDataValid(json))
      return JSON.parse(json);

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
