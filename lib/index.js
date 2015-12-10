"use strict";

var path = require('path');
var composer = require('./composer');
var renderer = require('./renderer');
var router = require('./router');
var Hoek = require('hoek');
var Joi = require('joi');
var fs = require('fs');

module.exports.register = function (server, options, next) {

    var defaults = {
        rootDir: process.cwd(),
        paths: {}
    };

    var optionsSchema = Joi.object().keys({
        rootDir: Joi.string(),
        paths: Joi.object()
    });

    function Windshield(options) {
        this.server = server;
        Joi.validate(options, optionsSchema);
        this.handlebars = options.handlebars || require('handlebars');
        delete options.handlebars;
        this.settings = {};
        this.settings = Hoek.applyToDefaults(defaults, options);
        this.server.log('info', 'application directory identified as: ' + this.settings.rootDir);
    };

    Windshield.prototype.composer = composer;
    Windshield.prototype.renderer = renderer;
    Windshield.prototype.router = router;

    var windshield = new Windshield(options);

    server.views({
        engines: {
            html: windshield.handlebars
        },
        relativeTo: windshield.settings.rootDir,
        path: './',
        helpersPath: 'helpers'
    });

    try {
        fs.realpathSync(path.join(windshield.settings.rootDir, 'components'));
    } catch (e) {
        server.log('error', '`components` directory not found');
        throw e;
    }

    server.expose('settings', windshield.settings);
    server.expose('router', windshield.router);
    server.expose('composer', windshield.composer);
    server.expose('renderer', windshield.renderer);
    server.expose('server', windshield.server);
    server.expose('handlebars', windshield.handlebars);

    next();
};

module.exports.register.attributes = {
    pkg: require('../package.json')
};
