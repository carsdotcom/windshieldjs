"use strict";

var fs = require('fs');
var Promise = require('bluebird');
var readFile = Promise.promisify(fs.readFile, { context: fs });

module.exports = function (path, callback) {
    return readFile(path)
        .then((buf) => buf.toString())
        .asCallback(callback);
};
