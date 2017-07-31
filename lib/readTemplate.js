'use strict';
const fs = require('fs');
const Promise = require('bluebird');
const readFile = Promise.promisify(fs.readFile, { context: fs });
const cache = require('./cache');

module.exports = readTemplate;

function readTemplate(path, callback) {
    const cacheKey = `template.${path}`;

    if (process.env.NODE_ENV === 'production') {
        return cache.get(cacheKey)
            .catch((err) => {
                return readFile(path)
                    .then((buf) => buf.toString())
                    .then((value) => cache.put(cacheKey, value, { ttl: 0 }));
            })
            .asCallback(callback);
    } else {
        return readFile(path)
            .then((buf) => buf.toString())
            .asCallback(callback);
    }
};
