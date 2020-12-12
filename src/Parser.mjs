export default function Parser(callback) {
  // states
  const BEGIN = 0;
  const ARRAY = 1;
  const OBJECT = 2;
  const KEY = 3;
  const VALUE = 4;
  const STRING = 5;
  const NUMBER = 6;
  const TRUE = 7;
  const FALSE = 8;
  const NULL = 9;
  const UNDEFINED = 10;
  const END = 11;

  // patterns
  // const whitespacePattern = /^[ \t\n\r]+/;
  const keyPattern = /(("(?<value1>[^\"]+)")|(?<value2>\w+))[ \t\n\r]*:[ \t\n\r]*/y;
  const stringPattern = /"(?<value>(([^\"]+)|(\["\/bfnrtv])|(\u[0-9a-fA-F]{4}))+)"[ \t\n\r,}\]]/y;
  const numberPattern = /(?<value>[-+]?\d+(.\d+)?([eE][-+]?\d+)?)[ \t\n\r,}\]]/y;
  const truePattern = /(?<value>true)[ \t\n\r,}\]]/iy;
  const falsePattern = /(?<value>false)[ \t\n\r,}\]]/iy;
  const nullPattern = /(?<value>null)[ \t\n\r,}\]]/iy;
  const undefinedPattern = /[^ \t\n\r,}\]]+[ \t\n\r,}\]]/y;

  // parser state
  const stack = [];
  let state = BEGIN;
  let key = null;
  let value = null;
  let match = null;
  let buffer = '';
  let i = 0;

  // build and return parser object
  const parser = { parse, end, callback };
  return parser;

  function emit(key, data) {
    // console.log(' '.repeat(stack.length * 2), key, data);
    callback = parser.callback;
    if (callback) {
      callback({ key, data, depth: stack.length - 1 });
    }
  }

  function parseKey() {
    let pattern = keyPattern;
    pattern.lastIndex = i;
    match = pattern.exec(buffer);
    if (match) {
      i = pattern.lastIndex - 1;
      key = match.groups.value1 || match.groups.value2;
      emit('key', key);
      state = VALUE;
      return true;
    } else {
      // console.log('key incomplete', buffer.substr(i, 20), '...');
      return false;
    }
  }

  function parseValue(type) {
    let pattern = null;
    switch (type) {
      case STRING:
        pattern = stringPattern;
        break;
      case NUMBER:
        pattern = numberPattern;
        break;
      case TRUE:
        pattern = truePattern;
        break;
      case FALSE:
        pattern = falsePattern;
        break;
      case NULL:
        pattern = nullPattern;
        break;
      case UNDEFINED:
        pattern = undefinedPattern;
        break;
    }

    pattern.lastIndex = i;
    match = pattern.exec(buffer);
    if (match) {
      // exclude the terminating ,}]
      i = pattern.lastIndex - 2;

      switch (type) {
        case STRING:
          value = match.groups.value;
          break;
        case NUMBER:
          value = parseFloat(match.groups.value);
          break;
        case TRUE:
          value = true;
          break;
        case FALSE:
          value = false;
          break;
        case NULL:
          value = null;
          break;
        case UNDEFINED:
          value = undefined;
          break;
      }

      emit('value', value);
      if (state !== BEGIN) {
        state = stack.pop();
      }
      return true;
    } else {
      // console.log('value incomplete', buffer.substr(i, 20), '...');
      return false;
    }
  }

  function parse(chunk) {
    buffer += chunk;
    // console.log('parse', buffer.substr(i, 20), '...');
    // console.log('parse state', state);

    for (; i < buffer.length; ++i) {
      const c = buffer[i];
      switch (state) {
        case END:
          // skip all remaining text
          i = buffer.length;
          break;
        case BEGIN:
        case VALUE:
          switch (c) {
            case ' ':
            case '\t':
            case '\n':
            case '\r':
              // ignore whitespace
              break;
            case '[':
              emit('openarray');
              state = ARRAY;
              break;
            case '{':
              emit('openobject');
              state = OBJECT;
              break;
            case '"':
              if (!parseValue(STRING)) {
                // continue parsing when we get more data
                return;
              }
              break;
            case '-':
            case '+':
            case '.':
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
              if (!parseValue(NUMBER)) {
                // continue parsing when we get more data
                return;
              }
              break;
            case 't':
            case 'T':
              if (!parseValue(TRUE)) {
                // continue parsing when we get more data
                return;
              }
              break;
            case 'f':
            case 'F':
              if (!parseValue(FALSE)) {
                // continue parsing when we get more data
                return;
              }
              break;
            case 'n':
            case 'N':
              if (!parseValue(NULL)) {
                // continue parsing when we get more data
                return;
              }
              break;
            default:
              if (!parseValue(UNDEFINED)) {
                // continue parsing when we get more data
                return;
              }
              break;
          }
          break;
        case ARRAY:
          switch (c) {
            case ' ':
            case '\t':
            case '\n':
            case '\r':
              // ignore whitespace
              break;
            case ']':
              emit('closearray');
              state = stack.length ? stack.pop() : BEGIN;
              break;
            case ',':
              // ignore extra commas
              break;
            default:
              stack.push(state);
              state = VALUE;
              --i;
              break;
          }
          break;
        case OBJECT:
          switch (c) {
            case ' ':
            case '\t':
            case '\n':
            case '\r':
              // ignore whitespace
              break;
            case '}':
              emit('closeobject');
              state = stack.length ? stack.pop() : BEGIN;
              break;
            case '{':
            case '[':
            case ']':
            case ',':
              // ignore stray characters
              break;
            default:
              stack.push(state);
              state = KEY;
              --i;
              break;
          }
          break;
        case KEY:
          if (!parseKey()) {
            // continue parsing when we get more data
            return;
          }
          break;
        default:
          throw new Error('unexpected state ' + state);
      }
    }

    buffer = buffer.substring(i);
    i = 0;
  }

  function end() {
    return parse(',');
  }
}
