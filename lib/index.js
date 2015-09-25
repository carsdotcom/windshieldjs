// Load modules

var path = require('path');
var Hapi = require('hapi');
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
        var err = Joi.validate(options, optionsSchema);
        this.server.log(err, { error: true });
        this.settings = {};
        this.settings = Hoek.applyToDefaults(defaults, options);
        this.server.log('application directory identified as: ' + this.settings.rootDir);
    };

    Windshield.prototype.composer = composer;
    Windshield.prototype.renderer = renderer;
    Windshield.prototype.router = router;

    var windshield = new Windshield(options);

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
        server.log('`components` directory not found', { error: true });
        process.exit(1);
    }

    server.expose('settings', windshield.settings);
    server.expose('router', windshield.router);
    server.expose('composer', windshield.composer);
    server.expose('renderer', windshield.renderer);
    server.expose('server', windshield.server);

    next();
};

module.exports.register.attributes = {
    pkg: require('../package.json')
};
