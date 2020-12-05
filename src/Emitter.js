export default function Emitter() {
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