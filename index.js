var detective = require('detective');
var recursive = require('recursive-readdir');
var fs = require('fs');
var core = require('is-core-module');
var _ = require('lodash');
var path = require('path');
var local = /^\./;

function find (opts, cb) {
	var path = getPath(opts);
	var settings = getSettings(opts);

	if (settings.onlyLocal) {
		return findLocalRequires(path, cb);
	}

	return findRequiredModules(path, cb);

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
}

function findRequiredModules (path, cb) {
	findRequiresForDir(path, function (err, requires) {
		if (err) {
			return cb(err);
		}

		cb(null, requires.filter(isMarkedModule).map(baseModule));
	});
}

function findLocalRequires (path, cb) {
	findRequiresForDir(path, function (err, requires) {
		if (err) {
			return cb(err);
		}

		cb(null, findLocalDependencies(0, requires.filter(isNotMarkedModule)));
	});
}

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
}

function resolvePathOrModule (basepath) {
	return function (relative) {
		if (isLocal(relative)) {
			return path.resolve(path.dirname(basepath), relative);
		}

		// Really ugly workaround to mark module dependencies

		return '=' + relative;
	}
}

function findLocalDependencies (index, requires) {
	if (index >= requires.length) {
		return requires;
	}

	var deps = findFileDependencies(requires[index++]);
	var diff = _.difference(deps, requires);
	requires = requires.concat(diff);

	return findLocalDependencies(index, requires);
}

function findFileDependencies (filepath) {
	try {
		var content = fs.readFileSync(jsify(filepath)).toString();
		return detective(content).filter(isLocal).map(resolvePathOrModule(filepath));
	} catch (e) {
		if (_.endsWith(filepath, 'index')) {
			return [];
		}

		// Assume it was dir
		return findFileDependencies(filepath + '/index');
	}
}

function jsify (filepath) {
	if (_.endsWith(file, '.js')) {
		return filepath;
	}

	return filepath + '.js';
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

function isMarkedModule (filepath) {
	return filepath[0] === '=';
}

function isNotMarkedModule (filepath) {
	return filepath[0] !== '=';
}

function baseModule (filename) {
	return filename.split('/')[0].slice(1);
}

function isLocal (filename) {
	return local.test(filename);
}

module.exports = find;
