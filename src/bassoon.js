import Emitter from './Emitter';
import Parser from './Parser';

export default function bassoon(arg1) {
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
    let stack = [];
    let curObj = null;
    let curKey = null;

    parser.callback = function ({ key, data, depth }) {
      //console.log(' '.repeat(depth * 2), key, data);
      if (curObj) {
        // processing object/array
        switch (key) {
          case 'openarray':
            stack.push({ curObj, curKey });
            curObj = [];
            curKey = null;
            break;
          case 'openobject':
            stack.push({ curObj, curKey });
            curObj = {};
            curKey = null;
            break;
          case 'closearray':
          case 'closeobject':
            if (stack.length) {
              let data = curObj;
              ({ curObj, curKey } = stack.pop());
              if (curKey !== null) {
                curObj[curKey] = data;
                curKey = null;
              } else {
                curObj.push(data);
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
        parser.end();
        if (stack.length) {
          emitter.emit('data', stack[0]);
        } else if (curObj) {
          emitter.emit('data', curObj);
        }
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
}
