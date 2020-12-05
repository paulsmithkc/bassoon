function bassoon(arg1) {
  'use strict';

  if (typeof arg1 === 'string') {
    return run({ url: arg1 });
  } else {
    return run(arg1);
  }

  function run(args) {
    const emitter = Emitter();
    const parser = Parser();
    let seen = 0;

    parser.callback = function ({ key, data, depth }) {
      console.log(' '.repeat(depth * 2), key, data);
    };

    try {
      const xhr = new XMLHttpRequest();
      xhr.open(args.method || 'GET', args.url);
      xhr.responseType = 'text';
      xhr.withCredentials = args.withCredentials || false;

      xhr.onreadystatechange = function (evt) {
        if (xhr.readyState > 2) {
          const fullText = xhr.responseText;
          const newText = fullText.substr(seen);
          seen = fullText.length;
          // emitter.emit('text', newText);
          parser.parse(newText);
        }
      };
      xhr.onload = function (event) {
        emitter.emit('end', {
          status: xhr.status,
          statusText: xhr.statusText,
        });
      };
      xhr.onerror = function (event) {
        emitter.emit('error', {
          status: xhr.status,
          statusText: xhr.statusText,
          timeout: xhr.timeout,
          event: event,
        });
      };

      xhr.send();
    } catch (error) {
      emitter.emit('error', { error });
    }

    return emitter;
  }

  function Emitter() {
    const events = {};
    const emitter = { on, emit };
    return emitter;

    function get(key) {
      if (!events[key]) {
        events[key] = { callback: null, queue: [] };
      }
      return events[key];
    }
    function on(key, callback) {
      const event = get(key);
      const queue = event.queue;
      event.callback = callback;
      if (callback && queue.length) {
        // emit missed events
        for (let i = 0; i < queue.length; ++i) {
          callback(queue[i]);
        }
        event.queue = [];
      }
      return emitter;
    }
    function emit(key, data) {
      const event = get(key);
      const callback = event.callback;
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

  function Parser(callback) {
    // states
    const BEGIN = 0;
    const ARRAY = 1;
    const OBJECT = 2;
    const KEY = 3;
    const VALUE = 4;
    const STRING = 5;
    const NUMBER = 6;
    const TRUE = 7;
    const FALSE = 8;
    const NULL = 9;
    const UNDEFINED = 10;
    const END = 11;

    // patterns
    // const whitespacePattern = /^[ \t\n\r]+/;
    const keyPattern = /\s*(("(?<value1>[^\"]+)")|(?<value2>\w+))\s*:\s*/y;
    const stringPattern = /\s*"(?<value>(([^\"]+)|(\["\/bfnrtv])|(\u[0-9a-fA-F]{4}))+)"\s*[,}\]]/y;
    const numberPattern = /\s*(?<value>[-+]?\d+(.\d+)?([eE][-+]?\d+)?)\s*[,}\]]/y;
    const truePattern = /\s*(?<value>true)\s*[,}\]]/iy;
    const falsePattern = /\s*(?<value>false)\s*[,}\]]/iy;
    const nullPattern = /\s*(?<value>null)\s*[,}\]]/iy;
    const undefinedPattern = /[^,}\]]*[,}\]]/y;

    // parser state
    const stack = [END];
    let state = BEGIN;
    let key = null;
    let value = null;
    let match = null;
    let buffer = '';
    let i = 0;

    // build and return parser object
    const parser = { parse, end, callback };
    return parser;

    function emit(key, data) {
      // console.log(' '.repeat(stack.length * 2), key, data);
      callback = parser.callback;
      if (callback) {
        callback({ key, data, depth: stack.length - 1 });
      }
    }

    function parseKey() {
      let pattern = keyPattern;
      pattern.lastIndex = i;
      match = pattern.exec(buffer);
      if (match) {
        i = pattern.lastIndex - 1;
        key = match.groups.value1 || match.groups.value2;
        emit('key', key);
        state = VALUE;
        return true;
      } else {
        console.log('key incomplete', buffer.substr(i, 20), '...');
        return false;
      }
    }

    function parseValue(type) {
      let pattern = null;
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
        console.log('value incomplete', buffer.substr(i, 20), '...');
        return false;
      }
    }

    function parse(chunk) {
      buffer += chunk;
      // console.log('parse', buffer.substr(i, 20), '...');
      // console.log('parse state', state);

      for (; i < buffer.length; ++i) {
        const c = buffer[i];
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
}
