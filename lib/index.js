// Load modules

var path = require('path');
var Hapi = require('hapi');
var composer = require('./composer');
var renderer = require('./renderer');
var router = require('./router');
var logger = require('./logger');
var Hoek = require('hoek');
var Joi = require('joi');


// Delcare internals

var internals = {};


internals.defaults = {
    appDirName: 'app'
};

internals.optionsSchema = Joi.object().keys({
    rootDir: Joi.string().required(),
    appDirName: Joi.string()
});

internals.Windshield = function (options) {
    Joi.validate(options, internals.optionsSchema, function (err, msg) {
        if (err != null) logger.error(msg);
    });
    this.settings = {};
    this.settings = Hoek.applyToDefaults(internals.defaults, options);
    this.settings.appDir = path.join(this.settings.rootDir, this.settings.appDirName);
    logger.info('application directory identified as:', this.settings.rootDir);
};

internals.Windshield.prototype.composer = composer;
internals.Windshield.prototype.renderer = renderer;
internals.Windshield.prototype.logger = logger;


module.exports.register = function (server, options, next) {
    var windshield = new internals.Windshield(options);

    windshield.router = router(server);

    server.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: windshield.settings.rootDir,
        path: './'
    });

    server.expose('settings', windshield.settings);
    server.expose('router', windshield.router);
    server.expose('composer', windshield.composer);
    server.expose('renderer', windshield.renderer);
    server.expose('logger', windshield.logger);

    next();
};


module.exports.register.attributes = {
    pkg: require('../package.json')
};
