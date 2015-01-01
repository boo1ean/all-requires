var detective = require('detective');
var _ = require('lodash');
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

var onlyDepenencies = function(filename) {
	return !local.test(filename)
		&& !core(filename);
};

var find = function(path, cb) {
	recursive(path, function (err, filenames) {
		var jsFiles = filenames.filter(onlySourceFiles);

		var counter = 0;
		var requires = [];

		for (var i in jsFiles) {
			counter++;
			var filename = jsFiles[i];

			fs.readFile(filename, function(err, content) {
				if (err) {
					return cb(err, null);
				}

				counter--;
				requires = requires.concat(detective(content));

				if (counter === 0) {
					cb(null, _.unique(requires.filter(onlyDepenencies)));
				}
			});
		}
	});
};

module.exports = find;
