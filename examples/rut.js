// [rut.js] is a native js plugin that tracks user behaviour & gathers page insights
// [version] 0.1
// [by] Jean Farrugia (http://github.com/frg)

(function () {
    var _this = this;
    var localStorageName = "__rut";
    var dateOfPageStart = performance.timing.responseEnd;
    var serverResponded = true;
    // hard url limit should be around 2100 characters
    var urlStringLimit = 1800;
    var guid = "";
    var instanceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    // Enable the passing of the 'this' object through the JavaScript timers
    // https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval#The_.22this.22_problem

    // Define our constructor
    this.Rut = function () {

        // Define option defaults
        var defaults = {
            debugMode: false,
            incrementSend: 5000,
            serverURL: window.location.origin + "/rut",
            retryOnFailTimeout: 5000,

            // capture additional data
            captureErrors: false,
            captureBrowserDetails: true,
            capturePageStats: true,

            // if switched data loss should be expected
            obfuscateLocalData: false
        };

        // Create options by extending defaults with the passed in arugments
        if (arguments[0] && typeof arguments[0] === "object") {
            _this.options = extendDefaults(defaults, arguments[0]);
        }

        _this.options.serverURL = _this.options.serverURL + "?guid=" + guid + "&";

        // check for local storage support
        try {
            ('localStorage' in window && window.localStorage !== null)
        } catch (e) {
            _this.options.incrementSend = false;
        }

        // log event to queue
        this.logEvent = function () {
            console.info("Logging event.");

            appendQueueToPageInstance({
                msSincePageLoad: new Date() - dateOfPageStart
            });
        };

        // send current queue to server
        this.sendQueue = function () {
            console.info("Sending queue.");

            var pipeline = appendPipelineWithQueue().pipeline;

            // if pipeline is noot empty
            // and server has returned a response
            if (serverResponded && pipeline.length > 0) {
                serverResponded = false;
                var i = new Image();
                i.src = _this.options.serverURL + 'data=' + JSON.stringify(pipeline);

                // load / fail events
                i.onload = function () {
                    serverResponded = true;
                    console.info("Pipeline delivery success");
                    clearPipeline();
                };
                i.onerror = function () {
                    serverResponded = true;
                    console.info("Pipeline delivery failed");

                    // retry send queue
                    window.setTimeout(_this.sendQueue,
                                        _this.options.retryOnFailTimeout);
                };
            }
        };

        if (!_this.options.debugMode && isInt(_this.options.incrementSend) && _this.options.incrementSend > 0) {
            window.setInterval(_this.sendQueue,
                                _this.options.incrementSend);
        } else {
            // enables insta-send
            // append log function to send data on log
            var _oldLogEvent = this.logEvent;
            this.logEvent = function () {
                _oldLogEvent.apply(this, arguments); // use .apply() to call it

                this.sendQueue();
            };
        }

        /*// Capture errors
        if (_this.options.captureErrors == true) {
            window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
                if (errorMsg.indexOf('Script error.') > -1) {
                    // if error message is useless.. do nothing
                    return;
                }

                console.info('Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber + ' Column: ' + column + ' StackTrace: ' + errorObj);
            };
        }

        // Get page load time
        if (_this.options.capturePageStats == true) {
            // to log attributes and such
            var currentURL = window.location.href;

            var URLreferrer = document.referrer;

            window.onload = function () {
                setTimeout(function () {
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
            };
        }

        // Get browser details
        if (_this.options.captureBrowserDetails === true) {
            // TO CAPTURE
            // navigator.userAgent
            // navigator.appVersion
            // navigator.platform
            // navigator.cookieEnabled
            // window.outerWidth
            // window.outerHeight
            // window.innerWidth
            // window.innerHeight
            // window.navigator.javaEnabled()

            console.info("Plugins: ", getPlugins());
            console.info("Fonts: ", getFonts());
        }*/
    };

    // Public Methods

    Rut.prototype.trackElement = function (element, eventsTrigger, eventID, elementID, description) {

    };

    Rut.prototype.trackEvent = function (eventID, elementID, description) {

    };

    // Private Methods

    // append current queue to pipeline
    function appendPipelineWithQueue() {
        var localData = getLocalData();

        // loop through queue items
        for (var queueItem in localData.queue) {
            if (localData.queue.hasOwnProperty(queueItem)) {
                // check if page instance guid exists in pipeline
                if (localData.pipeline.hasOwnProperty(queueItem)) {
                    // cache old pipeline
                    var newPipeline = localData.pipeline;
                    // append queue item
                    newPipeline = newPipeline.queueItem.concat(localData.queue.queueItem);

                    // check if string limit is reached
                    if ((_this.options.serverURL + 'data=' + JSON.stringify(newPipeline)).length >= urlStringLimit) {
                        console.info("Rut-js: url string too long");
                        return null;
                    }

                    // append page instance to pipeline
                    localData.pipeline = newPipeline;
                    // delete page instance
                    delete localData.queue.queueItem;
                }
            }
        }

        // save localdata
        setLocalData(localData);

        return localData;
    }

    // append queueItem to queue ready to be sent
    function appendQueueToPageInstance(queueItem) {
        var localData = getLocalData();

        // append queue
        localData.queue.push(queueItem);

        if (!localData.queue.hasOwnProperty(instanceId)) {
            // if page instance does not already exist
            // create it in queue
            localData.queue.instanceId = [];   
        }

        // append to queue
        localData.queue.instanceId.push(queueItem);

        setLocalData(localData);
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
        setLocalData(localData);
    }

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

    // Sets rut data in local storage
    function setLocalData(data) {
        data = JSON.stringify(data);

        if (_this.options.obfuscateLocalData === true) {
            data = btoa(data);
        }

        localStorage.setItem(localStorageName, data);
    }

    // Gets rut data from local storage
    function getLocalData() {
        // Retrieve the object from storage
        var json = localStorage.getItem(localStorageName);

        if (_this.options.obfuscateLocalData === true) {
            // decode base64
            try {
                json = atob(json);
            } catch (e) {
                return createDefaultJson();
            }
        }

        if (json !== null && isDataValid(json)) {
            return JSON.parse(json);
        }

        return createDefaultJson();
    }

    // UTILS

    // Credit for font and plugin code
    // https://panopticlick.eff.org
    function getPlugins() {
        // fetch and serialize plugins
        var plugins = "";

        // in Mozilla and most non-IE browsers
        if (navigator.plugins) {
            var np = navigator.plugins;
            var plist = [];

            // sorting navigator.plugins is a right royal pain
            // but it seems to be necessary because their order
            // is non-constant in some browsers
            for (var i = 0; i < np.length; i++) {
                plist[i] = np[i].name + "; ";
                plist[i] += np[i].description + "; ";
                plist[i] += np[i].filename + ";";

                for (var n = 0; n < np[i].length; n++) {
                    plist[i] += " (" + np[i][n].description + "; " + np[i][n].type +
                               "; " + np[i][n].suffixes + ")";
                }

                plist[i] += ". ";
            }

            plist.sort();
            for (i = 0; i < np.length; i++) {
                plugins += "Plugin " + i + ": " + plist[i];
            }
        }

        return plugins;
    }

    function getFonts() {
        // Try flash first
        var fonts = "";
        // <embed height="1" flashvars="" pluginspage="http://www.adobe.com/go/getflashplayer" src="resources/fonts2.swf" type="application/x-shockwave-flash" width="1" swliveconnect="true" id="flashfontshelper" name="flashfontshelper">
        var obj = document.getElementById("flashfontshelper");

        if (obj && typeof (obj.GetVariable) !== "undefined") {
            fonts = obj.GetVariable("/:user_fonts");
            fonts = fonts.replace(/,/g, ", ");
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
            } catch (ex) { }
        }

        if ("" === fonts) {
            fonts = "No Flash or Java fonts detected";
        }

        return fonts;
    }

    function isInt(n) {
        return Number(n) === n && n % 1 === 0;
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
