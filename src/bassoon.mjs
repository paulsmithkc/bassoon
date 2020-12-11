import Emitter from './Emitter.mjs';
import Parser from './Parser.mjs';

export default function bassoon(arg1) {
  'use strict';

  if (typeof arg1 === 'string') {
    return run({ url: arg1 });
  } else {
    return run(arg1);
  }

  function run(args) {
    // web worker integration
    const emitter = Emitter();
    if (args.worker && Worker) {
      // fix the URL so that it is relative to the current page
      args.url = new URL(args.url, location).toString();
      // start the worker
      const workerObj = new Worker('/bassoon/bassoon-worker.min.js');
      workerObj.onmessage = function (evt) {
        emitter.emit(evt.data.cmd, evt.data.data);
      };
      workerObj.postMessage({ cmd: 'start', args });
      return emitter;
    }

    // arguments
    const url = args.url;
    const method = args.method || 'GET';
    const withCredentials = args.withCredentials || false;
    const chunkSize = args.chunkSize;

    // request state
    const parser = Parser(parse);
    let seen = 0;
    let chunk = [];
    let stack = [];
    let curObj = null;
    let curKey = null;

    // methods

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

    function parse({ key, data, depth }) {
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
    }

    // main logic

    try {
      const xhr = new XMLHttpRequest();
      xhr.open(method || 'GET', url);
      xhr.responseType = 'text';
      xhr.withCredentials = withCredentials;

      xhr.onreadystatechange = function (evt) {
        try {
          if (xhr.readyState > 2) {
            const fullText = xhr.responseText;
            const newText = fullText.substr(seen);
            seen = fullText.length;
            parser.parse(newText);
          }
        } catch (error) {
          xhr.onreadystatechange = null;
          xhr.onload = null;
          xhr.onerror = null;
          xhr.abort();
          emitter.emit('error', error);
        }
      };
      xhr.onload = function (event) {
        try {
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
        } catch (error) {
          emitter.emit('error', error);
        }
      };
      xhr.onerror = function (event) {
        const error = new Error('Network Error');
        error.status = xhr.status;
        error.statusText = xhr.statusText;
        error.timeout = xhr.timeout;
        emitter.emit('error', error);
      };

      xhr.send();
    } catch (error) {
      emitter.emit('error', error);
    }

    return emitter;
  }
}
