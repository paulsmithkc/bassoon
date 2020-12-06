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
    let chunk = [];
    let chunkSize = args.chunkSize;

    function emitData(data) {
      if (chunkSize) {
        chunk.push(data);
        if (chunk.length >= chunkSize) {
          emitter.emit('data', chunk);
          chunk = [];
        }
      } else {
        emitter.emit('data', data);
      }
    }

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
              emitData(curObj);
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
            emitData(data);
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
          parser.parse(newText);
        }
      };
      xhr.onload = function (event) {
        // let the parser terminate any partial values
        parser.end();
        // emit the last object, even if it is incomplete
        if (stack.length) {
          emitData(stack[0]);
        } else if (curObj) {
          emitData(curObj);
        }
        // emit the last chunk
        if (chunk.length) {
          emitter.emit('data', chunk);
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
