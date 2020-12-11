# Bassoon.js
A simplified and optimized fork of [oboejs.](http://oboejs.com/) This package will allow you to easily stream an array of JSON objects to your front-end.

## Install w/ Express
First install the npm package.
```
npm install bassoon
```
Then serve the built script files up.
```
app.use('/bassoon', express.static('node_modules/bassoon/dist'));
```
And finally link the script in your HTML/view.
```
<script src="/bassoon/bassoon.min.js"></script>
```

## Basic Usage
To stream an array of JSON objects subscribe to the **data,** **end,** and **error** events.

```
bassoon('/api/example/list')
  .on('data', (data) => { /* object received... */ }))
  .on('end', (evt) => { /* end of stream... */ })
  .on('error', (err) => { /* error occurred, stream stopped... */ });
```

- The **data** event is fired every time an object is parsed from the response.
- The **end** event is fired once the response is fully loaded.
- The **error** event is fired if anything goes wrong.

## Advanced Usage
A variety of arguments can be passed to bassoon as well.

```
bassoon({
  url: '/api/example/list',
  method: 'GET',
  withCredentials: false,
  chunkSize: 10,
})
  .on('data', (data) => { /* object received... */ }))
  .on('end', (evt) => { /* end of stream... */ })
  .on('error', (err) => { /* error occurred, stream stopped... */ });
```

- **url** the URL of the JSON resource to be retrieved and processed incrementally.
- **method** the HTTP verb to retrieve the resource with ("GET" by default)
- **withCredentials** passed to [xhr.withCredentials](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials) (false by default)
- **chunkSize** Rather than triggering a data event for each object, group them into chunks and send each chunk as an array. chunkSize specifies the maximum size for each chunk, but chunks may be smaller than the chunkSize. (chunking disabled by default)

## Web Worker
For better performance bassoon can stream data using the provided web worker script.

```
bassoon({ url: '/api/example/list', worker: true })
  .on('data', (data) => { /* object received... */ }))
  .on('end', (evt) => { /* end of stream... */ })
  .on('error', (err) => { /* error occurred, stream stopped... */ });
```

## Related
- [Why Oboe.js?](http://oboejs.com/why)
- [oboe](https://www.npmjs.com/package/oboe)
- [clarinet](https://www.npmjs.com/package/clarinet)
- [sax](https://www.npmjs.com/package/sax)
- [SAX Parsers](https://docs.oracle.com/javase/tutorial/jaxp/sax/parsing.html)
- [Node.js Streams](https://nodejs.dev/learn/nodejs-streams)
- [XHR API](https://hpbn.co/xmlhttprequest/)
