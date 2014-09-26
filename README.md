all-requires
============

Get list of all required modules recursively for a given dir

## Usage

```javascript
var find = require('all-requires');

find('./', function(err, requires) {
	console.log(requires);

	// [ 'all-requires' ]
});
```

## LICENSE
MIT
