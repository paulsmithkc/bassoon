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
  try {
    console.log('worker started');
    args.worker = false;
    bassoon(args)
      .on('data', (data) => self.postMessage({ cmd: 'data', data: data }))
      .on('end', (event) => self.postMessage({ cmd: 'end', data: event }))
      .on('error', (error) => self.postMessage({ cmd: 'error', data: error }));
  } catch (error) {
    console.error(error);
    self.postMessage({ cmd: 'error', data: error });
  }
};
