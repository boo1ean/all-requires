var detective = require('detective');
var unique = require('array-unique');
var recursive = require('recursive-readdir');
var fs = require('fs');
var core = require('is-core-module');
var local = /^\.|\//;

// Only js and not from node_modules
var onlySourceFiles = function(filename) {
	return filename
		&& filename.slice(filename.length - 3) === '.js'
		&& filename.indexOf('node_modules') === -1;
};

var onlyDependencies = function(filename) {
	return !local.test(filename)
		&& !core(filename);
};

var find = function(path, cb) {
	recursive(path, function (err, filenames) {
		if (err) {
			return cb(err);
		}

		var jsFiles = filenames.filter(onlySourceFiles);

		var counter = 0;
		var requires = [];

		jsFiles.forEach(function(filename) {
			counter++;

			fs.readFile(filename, function(err, content) {
				if (err) {
					return cb(err, null);
				}

				counter--;
				requires = requires.concat(detective(content));

				if (counter === 0) {
					cb(null, unique(requires.filter(onlyDependencies)));
				}
			});
		});
	});
};

module.exports = find;
