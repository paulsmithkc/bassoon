importScripts('bassoon.min.js');

self.onmessage = (evt) => {
  const cmd = evt.data.cmd;
  const args = evt.data.args;
  switch (cmd) {
    case 'start':
      return start(args);
    case 'abort':
      if (req) {
        return req.abort();
      } else {
        return false;
      }
  }
};

let req = null;

const start = (args) => {
  try {
    console.log('worker started');
    args.worker = false;
    req = bassoon(args);
    req.on('data', (data) => self.postMessage({ cmd: 'data', data: data }));
    req.on('end', (event) => self.postMessage({ cmd: 'end', data: event }));
    req.on('error', (error) => self.postMessage({ cmd: 'error', data: error }));
    return true;
  } catch (error) {
    console.error(error);
    if (req) req.abort();
    self.postMessage({ cmd: 'error', data: error });
    return false;
  }
};
