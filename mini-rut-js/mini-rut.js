(function () {
    var _this = this;
    var storeName = "guid_mini_rut";
    
    var guid = "not_set";
    if (localStorage.getItem(storeName) === null) {
        // TODO: Create fallback if Local Storage not supported!
        
        // create guid if not found
        guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        
        // save guid to local storage
        localStorage.setItem(storeName, guid);
    } else {
        // get guid that has been set already
        guid = localStorage.getItem(storeName);
    }

    // Define our constructor
    this.MiniRut = function () {
        // Define option defaults
        var defaults = {
            serverURL: window.location.origin + "/rut"
        };
        
        // Create options by extending defaults with the passed in arugments
        if (arguments[0] && typeof arguments[0] === "object") {
            _this.options = extendDefaults(defaults, arguments[0]);
        }

        this.logEvent = function (category, action, label, value, userInteraction) {
            // append query strings
            var queryString = "".concat( 
                    "?g=", (guid) ? guid : "",
                    "&c=", (category) ? category : "", 
                    "&a=", (action) ? action : "", 
                    "&l=", (label) ? label : "", 
                    "&v=", (value) ? value : "", 
                    "&ui=", (userInteraction) ? userInteraction : "",
                    "&cbuster=", Math.random().toString(36).slice(2) 
                );
            
            var i = new Image();
            i.src = _this.options.serverURL + queryString;

            i.onload = function () { /*console.info("Delivery success");*/ };
            i.onerror = function () { 
                // console.info("Delivery failed");
                // should retry in a later version
            };
            
            return this;
        };
    };

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