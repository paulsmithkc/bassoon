importScripts('bassoon.min.js');

self.onmessage = (evt) => {
  const cmd = evt.data.cmd;
  const args = evt.data.args;
  switch (cmd) {
    case 'start':
      return start(args);
  }
};

const start = (args) => {
  console.log('worker started');
  bassoon(args)
    .on('data', (data) => self.postMessage({ cmd: 'data', data }))
    .on('end', (event) => self.postMessage({ cmd: 'end' }))
    .on('error', (event) => self.postMessage({ cmd: 'error' }));
};
