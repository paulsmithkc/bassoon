export default function Emitter() {
  return {
    _events: {},
    _get(key) {
      if (!this._events[key]) {
        this._events[key] = { callback: null, queue: [] };
      }
      return this._events[key];
    },
    on(key, callback) {
      const event = this._get(key);
      const queue = event.queue;
      event.callback = callback;
      if (callback && queue.length) {
        // emit missed events
        for (let i = 0; i < queue.length; ++i) {
          callback.call(this, queue[i]);
        }
        event.queue = [];
      }
      return this;
    },
    emit(key, data) {
      const event = this._get(key);
      const callback = event.callback;
      if (callback) {
        // emit current event
        callback.call(this, data);
      } else {
        // save events so that they don't get dropped
        event.queue.push(data);
      }
      return this;
    },
  };
}
