'use strict';
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

module.exports = readTemplate;

async function readTemplate(path) {
    const buf = await readFile(path);
    return buf.toString();
}
