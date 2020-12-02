function oboe(arg1) {
  if (typeof arg1 === 'string') {
    return oboeImpl({ url: arg1 });
  } else {
    return oboeImpl(arg1);
  }

  function oboeImpl(args) {
    var emitter = oboeEmitter();
    var parser = oboeParser(emitter);
    var seen = 0;

    try {
      var xhr = new XMLHttpRequest();
      xhr.open(args.method || 'GET', args.url);
      xhr.responseType = 'text';

      xhr.onreadystatechange = function (evt) {
        if (xhr.readyState > 2) {
          var fullText = xhr.responseText;
          var newText = fullText.substr(seen);
          seen = fullText.length;
          emitter.emit('text', newText);
        }
      };
      xhr.onload = function (event) {
        emitter.emit('end', { event });
      };
      xhr.onerror = function (event) {
        emitter.emit('error', { event });
      };

      xhr.send();
    } catch (error) {
      emitter.emit('error', { error });
    }

    return emitter;
  }

  function oboeEmitter() {
    var events = {};
    var emitter = { on, emit };
    return emitter;

    function get(key) {
      if (!events[key]) {
        events[key] = { callback: null, queue: [] };
      }
      return events[key];
    }
    function on(key, callback) {
      var event = get(key);
      var queue = event.queue;
      event.callback = callback;
      if (queue.length) {
        // emit missed events
        for (var i = 0; i < queue.length; ++i) {
          callback(queue[i]);
        }
        event.queue = [];
      }
      return emitter;
    }
    function emit(key, data) {
      var event = get(key);
      var callback = event.callback;
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

  function oboeParser(emitter) {
    return {};
  }
}
