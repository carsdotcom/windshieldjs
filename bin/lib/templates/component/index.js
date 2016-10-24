'use strict';
const path = require('path');
const windshield = require('windshieldjs');

module.exports.adapter = require('./adapter');
module.exports.templates = {
    default: windshield.readTemplate(path.join(__dirname, 'templates/default.html'))
};
