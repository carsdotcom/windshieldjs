var path = require('path');
var windshield = require('windshieldjs');

module.exports.Model = require('./Model');
module.exports.templates = {
    default: windshield.readTemplate(path.join(__dirname, 'templates/default.html'))
};
