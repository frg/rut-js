# rut.js [![Code Climate](https://codeclimate.com/github/frg/rut-js/badges/gpa.svg)](https://codeclimate.com/github/frg/rut-js)
#### A js plugin that tracks user behaviour & page insights

## Version
### **THIS PLUGIN IS STILL IN DEVELOPMENT

## Description
A javascript plugin with the aim of making user tracking flexible and effortless. The plugin is in its very early stages of implementation therefore here's my to-do list up front.

## Todo
 - **TEST**
 - assign queue to current page load (will implement using guid)
 - add hover in / out event triggers
 - add click triggers
 - add bounce trigger
 - ~~capture errors~~ (most browsers don't support this.. might remove)
 - ~~capture page load~~
 - ~~capture user agent, plugins, fonts, resolutions~~ (some of these are a bit hacky)
 - ~~local data obfuscation~~ (implemented using base64)

##  Installation

##  Usage
1. Import 'rut.js' from folder 'sauce'
3. Initialise using "var _rut = new Rut();"

Example:

```sh
var _rut = new Rut({
  requestTimeout: 300,
  cacheSecret: "abc123",
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


## License
MIT
