import Emitter from './Emitter.mjs';
import Parser from './Parser.mjs';

export default function bassoon(arg1) {
  'use strict';

  const args = typeof arg1 === 'string' ? { url: arg1 } : arg1;

  // web worker integration
  const emitter = Emitter();
  let aborted = false;
  if (args.worker && Worker) {
    // fix the URL so that it is relative to the current page
    args.url = new URL(args.url, location).toString();
    // start the worker
    const workerPath = args.workerPath || '/bassoon/bassoon-worker.min.js';
    const workerObj = new Worker(workerPath);
    workerObj.onmessage = function (evt) {
      if (!aborted) emitter.emit(evt.data.cmd, evt.data.data);
    };
    workerObj.postMessage({ cmd: 'start', args });
    emitter.abort = function () {
      aborted = true;
      workerObj.postMessage({ cmd: 'abort' });
    };
    return emitter;
  }

  // arguments
  const url = args.url;
  const method = args.method || 'GET';
  const withCredentials = args.withCredentials || false;
  const chunkSize = args.chunkSize;

  // request state
  const parser = Parser(parse);
  let xhr = null;
  let seen = 0;
  let chunk = [];
  let stack = [];
  let curObj = null;
  let curKey = null;

  // methods

  function abort() {
    aborted = true;
    if (xhr) {
      xhr.onreadystatechange = null;
      xhr.onload = null;
      xhr.onerror = null;
      xhr.abort();
    }
  }

  function emitData(data) {
    if (aborted) return;
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
    if (aborted) return;
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
    xhr = new XMLHttpRequest();
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
        abort();
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
    console.error(error);
    abort();
    emitter.emit('error', error);
  }

  emitter.abort = abort;
  return emitter;
}
