'use strict';
const fs = require('fs');
const Promise = require('bluebird');
const readFile = Promise.promisify(fs.readFile, { context: fs });

module.exports = readTemplate;

function readTemplate(path, callback) {
    return readFile(path)
        .then((buf) => buf.toString())
        .asCallback(callback);
};
