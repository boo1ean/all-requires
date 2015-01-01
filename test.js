var test = require('tape');
var find = require('./');

test('it works', function(assert) {
	find('./example', function(err, requires) {
		assert.deepEqual(requires, ['a', 'b', 'c']);
		assert.end();
	});
});
