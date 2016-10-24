'use strict';
const Composer = require('./composer');
const Renderer = require('./renderer');
const Router = require('./router');
const templateInit = require('./templateInit');

module.exports = function (config) {
    let windshield = {};
    windshield.server = config.server;
    windshield.options = config.options;
    windshield.composer = Composer(windshield, config.options.handlebars);
    windshield.renderer = Renderer(windshield);
    windshield.router = Router(windshield);
    templateInit(config.options.handlebars);
};
