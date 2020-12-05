/*! @version bassoon 1.0.0 */
window.bassoon =
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 722:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => /* binding */ bassoon
});

;// CONCATENATED MODULE: ./src/Emitter.js
function Emitter() {
  var events = {};
  var emitter = {
    on: on,
    emit: emit
  };
  return emitter;

  function get(key) {
    if (!events[key]) {
      events[key] = {
        callback: null,
        queue: []
      };
    }

    return events[key];
  }

  function on(key, callback) {
    var event = get(key);
    var queue = event.queue;
    event.callback = callback;

    if (callback && queue.length) {
      // emit missed events
      for (var i = 0; i < queue.length; ++i) {
        callback(queue[i]);
      }

      event.queue = [];
    }

    return emitter;
  }

  function emit(key, data) {
    var event = get(key);
    var callback = event.callback;

    if (callback) {
      // emit current event
      callback(data);
    } else {
      // save events so that they don't get dropped
      event.queue.push(data);
    }

    return emitter;
  }
}
;// CONCATENATED MODULE: ./src/Parser.js
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _wrapRegExp(re, groups) { _wrapRegExp = function _wrapRegExp(re, groups) { return new BabelRegExp(re, undefined, groups); }; var _RegExp = _wrapNativeSuper(RegExp); var _super = RegExp.prototype; var _groups = new WeakMap(); function BabelRegExp(re, flags, groups) { var _this = _RegExp.call(this, re, flags); _groups.set(_this, groups || _groups.get(re)); return _this; } _inherits(BabelRegExp, _RegExp); BabelRegExp.prototype.exec = function (str) { var result = _super.exec.call(this, str); if (result) result.groups = buildGroups(result, this); return result; }; BabelRegExp.prototype[Symbol.replace] = function (str, substitution) { if (typeof substitution === "string") { var groups = _groups.get(this); return _super[Symbol.replace].call(this, str, substitution.replace(/\$<([^>]+)>/g, function (_, name) { return "$" + groups[name]; })); } else if (typeof substitution === "function") { var _this = this; return _super[Symbol.replace].call(this, str, function () { var args = []; args.push.apply(args, arguments); if (_typeof(args[args.length - 1]) !== "object") { args.push(buildGroups(args, _this)); } return substitution.apply(this, args); }); } else { return _super[Symbol.replace].call(this, str, substitution); } }; function buildGroups(result, re) { var g = _groups.get(re); return Object.keys(g).reduce(function (groups, name) { groups[name] = result[g[name]]; return groups; }, Object.create(null)); } return _wrapRegExp.apply(this, arguments); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function Parser(callback) {
  // states
  var BEGIN = 0;
  var ARRAY = 1;
  var OBJECT = 2;
  var KEY = 3;
  var VALUE = 4;
  var STRING = 5;
  var NUMBER = 6;
  var TRUE = 7;
  var FALSE = 8;
  var NULL = 9;
  var UNDEFINED = 10;
  var END = 11; // patterns
  // const whitespacePattern = /^[ \t\n\r]+/;

  var keyPattern = /*#__PURE__*/_wrapRegExp(new RegExp("((\"((?:(?!\")[\\s\\S])+)\")|([0-9A-Z_a-z]+))[\\t\\n\\r ]*:[\\t\\n\\r ]*", "y"), {
    value1: 3,
    value2: 4
  });

  var stringPattern = /*#__PURE__*/_wrapRegExp(new RegExp("\"((((?:(?!\")[\\s\\S])+)|(\\[\"\\/bfnrtv\\])|(u[0-9A-Fa-f]{4}))+)\"[\\t\\n\\r ,\\]\\}]", "y"), {
    value: 1
  });

  var numberPattern = /*#__PURE__*/_wrapRegExp(new RegExp("([\\+\\x2D]?[0-9]+(.[0-9]+)?([Ee][\\+\\x2D]?[0-9]+)?)[\\t\\n\\r ,\\]\\}]", "y"), {
    value: 1
  });

  var truePattern = /*#__PURE__*/_wrapRegExp(new RegExp("(true)[\\t\\n\\r ,\\]\\}]", "iy"), {
    value: 1
  });

  var falsePattern = /*#__PURE__*/_wrapRegExp(new RegExp("(false)[\\t\\n\\r ,\\]\\}]", "iy"), {
    value: 1
  });

  var nullPattern = /*#__PURE__*/_wrapRegExp(new RegExp("(null)[\\t\\n\\r ,\\]\\}]", "iy"), {
    value: 1
  });

  var undefinedPattern = new RegExp("[^ \\t\\n\\r,}\\]]+[ \\t\\n\\r,}\\]]", "y"); // parser state

  var stack = [END];
  var state = BEGIN;
  var key = null;
  var value = null;
  var match = null;
  var buffer = '';
  var i = 0; // build and return parser object

  var parser = {
    parse: parse,
    end: end,
    callback: callback
  };
  return parser;

  function emit(key, data) {
    // console.log(' '.repeat(stack.length * 2), key, data);
    callback = parser.callback;

    if (callback) {
      callback({
        key: key,
        data: data,
        depth: stack.length - 1
      });
    }
  }

  function parseKey() {
    var pattern = keyPattern;
    pattern.lastIndex = i;
    match = pattern.exec(buffer);

    if (match) {
      i = pattern.lastIndex - 1;
      key = match.groups.value1 || match.groups.value2;
      emit('key', key);
      state = VALUE;
      return true;
    } else {
      // console.log('key incomplete', buffer.substr(i, 20), '...');
      return false;
    }
  }

  function parseValue(type) {
    var pattern = null;

    switch (type) {
      case STRING:
        pattern = stringPattern;
        break;

      case NUMBER:
        pattern = numberPattern;
        break;

      case TRUE:
        pattern = truePattern;
        break;

      case FALSE:
        pattern = falsePattern;
        break;

      case NULL:
        pattern = nullPattern;
        break;

      case UNDEFINED:
        pattern = undefinedPattern;
        break;
    }

    pattern.lastIndex = i;
    match = pattern.exec(buffer);

    if (match) {
      // exclude the terminating ,}]
      i = pattern.lastIndex - 2;

      switch (type) {
        case STRING:
          value = match.groups.value;
          break;

        case NUMBER:
          value = parseFloat(match.groups.value);
          break;

        case TRUE:
          value = true;
          break;

        case FALSE:
          value = false;
          break;

        case NULL:
          value = null;
          break;

        case UNDEFINED:
          value = undefined;
          break;
      }

      emit('value', value);
      state = stack.pop();
      return true;
    } else {
      // console.log('value incomplete', buffer.substr(i, 20), '...');
      return false;
    }
  }

  function parse(chunk) {
    buffer += chunk; // console.log('parse', buffer.substr(i, 20), '...');
    // console.log('parse state', state);

    for (; i < buffer.length; ++i) {
      var c = buffer[i];

      switch (state) {
        case END:
          // skip all remaining text
          i = buffer.length;
          break;

        case BEGIN:
        case VALUE:
          switch (c) {
            case ' ':
            case '\t':
            case '\n':
            case '\r':
              // ignore whitespace
              break;

            case '[':
              emit('openarray');
              state = ARRAY;
              break;

            case '{':
              emit('openobject');
              state = OBJECT;
              break;

            case '"':
              if (!parseValue(STRING)) {
                // continue parsing when we get more data
                return;
              }

              break;

            case '-':
            case '+':
            case '.':
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
              if (!parseValue(NUMBER)) {
                // continue parsing when we get more data
                return;
              }

              break;

            case 't':
            case 'T':
              if (!parseValue(TRUE)) {
                // continue parsing when we get more data
                return;
              }

              break;

            case 'f':
            case 'F':
              if (!parseValue(FALSE)) {
                // continue parsing when we get more data
                return;
              }

              break;

            case 'n':
            case 'N':
              if (!parseValue(NULL)) {
                // continue parsing when we get more data
                return;
              }

              break;

            default:
              if (!parseValue(UNDEFINED)) {
                // continue parsing when we get more data
                return;
              }

              break;
          }

          break;

        case ARRAY:
          switch (c) {
            case ' ':
            case '\t':
            case '\n':
            case '\r':
              // ignore whitespace
              break;

            case ']':
              emit('closearray');
              state = stack.pop();
              break;

            case ',':
              // ignore extra commas
              break;

            default:
              stack.push(state);
              state = VALUE;
              --i;
              break;
          }

          break;

        case OBJECT:
          switch (c) {
            case ' ':
            case '\t':
            case '\n':
            case '\r':
              // ignore whitespace
              break;

            case '}':
              emit('closeobject');
              state = stack.pop();
              break;

            case '{':
            case '[':
            case ']':
            case ',':
              // ignore stray characters
              break;

            default:
              stack.push(state);
              state = KEY;
              --i;
              break;
          }

          break;

        case KEY:
          if (!parseKey()) {
            // continue parsing when we get more data
            return;
          }

          break;

        default:
          throw new Error('unexpected state ' + state);
      }
    }

    buffer = buffer.substring(i);
    i = 0;
  }

  function end() {
    return parse(',');
  }
}
;// CONCATENATED MODULE: ./src/bassoon.js


function bassoon(arg1) {
  'use strict';

  if (typeof arg1 === 'string') {
    return run({
      url: arg1
    });
  } else {
    return run(arg1);
  }

  function run(args) {
    var emitter = Emitter();
    var parser = Parser();
    var seen = 0;
    var stack = [];
    var curObj = null;
    var curKey = null;

    parser.callback = function (_ref) {
      var key = _ref.key,
          data = _ref.data,
          depth = _ref.depth;

      //console.log(' '.repeat(depth * 2), key, data);
      if (curObj) {
        // processing object/array
        switch (key) {
          case 'openarray':
            stack.push({
              curObj: curObj,
              curKey: curKey
            });
            curObj = [];
            curKey = null;
            break;

          case 'openobject':
            stack.push({
              curObj: curObj,
              curKey: curKey
            });
            curObj = {};
            curKey = null;
            break;

          case 'closearray':
          case 'closeobject':
            if (stack.length) {
              var _data = curObj;

              var _stack$pop = stack.pop();

              curObj = _stack$pop.curObj;
              curKey = _stack$pop.curKey;

              if (curKey !== null) {
                curObj[curKey] = _data;
                curKey = null;
              } else {
                curObj.push(_data);
              }
            } else {
              emitter.emit('data', curObj);
              curObj = curKey = null;
            }

            break;

          case 'key':
            curKey = data;
            break;

          case 'value':
            if (curKey !== null) {
              curObj[curKey] = data;
              curKey = null;
            } else {
              curObj.push(data);
            }

            break;
        }
      } else {
        // processing root
        switch (key) {
          case 'openarray':
          case 'closearray':
            // ignore root array
            break;

          case 'openobject':
            curObj = {};
            break;

          case 'value':
            emitter.emit('data', data);
            break;
        }
      }
    };

    try {
      var xhr = new XMLHttpRequest();
      xhr.open(args.method || 'GET', args.url);
      xhr.responseType = 'text';
      xhr.withCredentials = args.withCredentials || false;

      xhr.onreadystatechange = function (evt) {
        if (xhr.readyState > 2) {
          var fullText = xhr.responseText;
          var newText = fullText.substr(seen);
          seen = fullText.length; // emitter.emit('text', newText);

          parser.parse(newText);
        }
      };

      xhr.onload = function (event) {
        parser.end();

        if (stack.length) {
          emitter.emit('data', stack[0]);
        } else if (curObj) {
          emitter.emit('data', curObj);
        }

        emitter.emit('end', {
          status: xhr.status,
          statusText: xhr.statusText
        });
      };

      xhr.onerror = function (event) {
        emitter.emit('error', {
          status: xhr.status,
          statusText: xhr.statusText,
          timeout: xhr.timeout,
          event: event
        });
      };

      xhr.send();
    } catch (error) {
      emitter.emit('error', {
        error: error
      });
    }

    return emitter;
  }
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(722);
/******/ })()
.default;