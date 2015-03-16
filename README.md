all-requires
============

Get list of all required modules recursively for a given dir.    
Based on [detective](https://github.com/substack/node-detective)

## Usage

We have some dir with js files (also could contain subdirs with js)

```
dir
|-- a.js
|-- b.js
`-- c.js
```

a.js

```javascript
var a = require('a');
var b = require('./b');
```

b.js

```javascript
var b = require('b');
var d = require('./d');
```

c.js

```javascript
var c = require('c');
```

Find all `third-party` dependencies for this dir:

```javascript
var find = require('all-requires');

find('./dir', function(err, requires) {
	console.log(requires); // [ 'a', 'b', 'c' ]
});
```

## Find all local requires

Very recursively resolves all local requires

```js
find({ path: './dir', onlyLocal: true }, function (err, requires) {
	console.log(requires); // ['b', 'd']
})
```

## Note

It scans only files with `.js` extension and skips files under `node_modules` dir.

## LICENSE
MIT
