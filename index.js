var detective = require('detective');
var recursive = require('recursive-readdir');
var fs = require('fs');
var core = require('is-core-module');
var _ = require('lodash');
var path = require('path');
var local = /^\./;

function findRequiresForDir (path, cb) {
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

				var fileRequires = detective(content).map(resolvePathOrModule(filename));
				requires = requires.concat(fileRequires);

				if (counter === 0) {
					cb(null, _.unique(requires));
				}
			});
		});
	});

	function getPath (opts) {
		if (typeof opts === 'string') {
			return opts;
		}

		if (typeof opts === 'object') {
			assertOptions(opts);

			return opts.path;
		}

		function assertOptions (opts) {
			if (!opts.path) {
				throw new Error('Path is required.');
			}
		}
	}

	function getSettings (opts) {
		if (typeof opts === 'object') {
			return opts;
		}

		return {};
	}
};

function findRequiredModules (path, cb) {
	findRequiresForDir(path, function (err, requires) {
		if (err) {
			return cb(err);
		}

		cb(null, requires.filter(isModule).map(baseModule));
	});
}

function resolvePathOrModule (basepath) {
	return function (relative) {
		if (isLocal(relative)) {
			return path.resolve(basepath, relative);
		}

		// Really ugly workaround to mark module dependencies

		return '=' + relative;
	}
}

function findDependencies (index, requires) {
	if (index >= requires.length) {
		return requires;
	}

	var deps = findFileDependencies(requires[index++]);
	var diff = _.difference(deps, requires);
	requires = requires.concat(diff);

	return findDependencies(index, requires);
}

function findFileDependencies (filepath) {
	var content = fs.readFileSync(filepath).toString();
	return detective(content).filter(onlyLocals).map(resolve(filepath));
}

// Only js and not from node_modules
function onlySourceFiles (filename) {
	return filename
		&& filename.slice(filename.length - 3) === '.js'
		&& filename.indexOf('node_modules') === -1;
}

function isThirdParty (filename) {
	return !local.test(filename)
		&& !core(filename);
}

function isModule (filepath) {
	return filepath[0] === '=';
}

function baseModule (filename) {
	return filename.split('/')[0].slice(1);
}

function isLocal (filename) {
	return local.test(filename);
}

module.exports = findRequiredModules;

//findRequiredModules('/Users/boo1ean/src/tds/redirect', function (err, res) {
	//console.log(res);
//});
