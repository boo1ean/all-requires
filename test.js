var test = require('tape');
var find = require('./');

test('it works', function (assert) {
	find('./example', function(err, requires) {
		assert.deepEqual(requires.sort(), ['a', 'b', 'c', 'd']);
		assert.end();
	});
});

test('it works using object', function (assert) {
	find({ path: './example' }, function(err, requires) {
		assert.deepEqual(requires.sort(), ['a', 'b', 'c', 'd']);
		assert.end();
	});
});

test('it should find only local deps', function (assert) {
	find({ path: './example', onlyLocal: true }, function(err, requires) {
		assert.deepEqual(requires.map(lastLetter).sort(), ['b', 'd']);
		assert.end();
	});
});

function lastLetter (string) {
	return string[string.length - 1];
}
