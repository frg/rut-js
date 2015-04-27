# rut.js [![Code Climate](https://codeclimate.com/github/frg/rut-js/badges/gpa.svg)](https://codeclimate.com/github/frg/rut-js)
#### A js plugin that tracks user behaviour & page insights

## Version
### **THIS PLUGIN IS STILL IN DEVELOPMENT

## Description
A **javascript** plugin with the aim of making user tracking flexible and effortless. The plugin is in its very early stages of implementation therefore here's my to-do list up front.

## Todo
 - **TEST**
 - add hover in / out event triggers
 - add click triggers
 - add bounce trigger
 - ~~assign queue to current page load~~ (implemented using guid)
 - ~~capture errors~~ (most browsers don't support this.. might remove)
 - ~~capture page load~~
 - ~~capture user agent, plugins, fonts, resolutions~~ (some of these are a bit hacky)
 - ~~local data obfuscation~~

##  Installation

##  Usage
1. Import 'rut.js' from folder 'sauce'
3. Initialise using "var _rut = new Rut();"

Example:

```sh
var _rut = new Rut({
  requestTimeout: 300,
  serverURL: "localhost:5467/rut"
});
```

## API

### Options
Possible options:

* `debugMode` – toggles various options for making debug easier like disable 'incrementSend' – *boolean*: `true`
* `incrementSend` – interval in ms to send data in pipeline – *boolean* / *int*: `5000`
* `serverURL` - url to send data to - *string*: `current url + "/rut"`
* `retryOnFailTimeout` – ms until retry of failed queue send – *int*: `5000`

### LocalStorage
Format:

```sh
{
  "pipeline": {
    "er4cfb96-67bf-4s90-b6d2-86743217a840": [
      {
        "msSincePageLoad": 4249,
        "category": "registration",
        "id": "register",
        "type": "button",
        "action": "click"
      }
    ]
  },
  "queue": {
    "cd2cfb96-87bf-4d90-b6d2-80213217a840": [
      {
        "msSincePageLoad": 4249,
        "category": "registration",
        "id": "register",
        "type": "button",
        "action": "click"
      },
      {
        "msSincePageLoad": 5139,
        "category": "registration",
        "id": "register",
        "type": "button",
        "action": "hover-in"
      },
      {
        "msSincePageLoad": 5139,
        "category": "registration",
        "id": "register",
        "type": "button",
        "action": "right-click"
      },
      {
        "BrowserDetails": {
          "userAgent": "",
          "plugins": ""
        }
      },
      {
        "PageStats": {}
      }
    ]
  }
}
```

## License
MIT
