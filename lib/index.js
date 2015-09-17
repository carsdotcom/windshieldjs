// Load modules

var path = require('path');
var Hapi = require('hapi');
var composer = require('./composer');
var renderer = require('./renderer');
var router = require('./router');
var logger = require('./logger');
var Hoek = require('hoek');
var Joi = require('joi');
var fs = require('fs');


// Delcare internals

var internals = {};


internals.defaults = {
    paths: {}
};

internals.optionsSchema = Joi.object().keys({
    rootDir: Joi.string().required(),
    paths: Joi.object()
});

internals.Windshield = function (options) {
    Joi.validate(options, internals.optionsSchema, function (err, msg) {
        if (err) {
            logger.error(msg);
            throw err;
        }
    });
    this.settings = {};
    this.settings = Hoek.applyToDefaults(internals.defaults, options);
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

    try {
        fs.realpathSync(path.join(windshield.settings.rootDir, 'components'));
    } catch (e) {
        windshield.logger.error('`components` directory not found');
        process.exit(1);
    }

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
