'use strict';
var Composer = require('./composer');
var Renderer = require('./renderer');
var Router = require('./router');
var templateInit = require('./templateInit');

module.exports = function (config) {
    var windshield = {};
    windshield.server = config.server;
    windshield.options = config.options;
    windshield.composer = Composer(windshield, config.options.handlebars);
    windshield.renderer = Renderer(windshield);
    windshield.router = Router(windshield);
    templateInit(config.options.handlebars);
};
