"use strict";

var fs = require('fs');
var path = require('path');
var Hoek = require('hoek');
var Joi = require('joi');
var handlebars = require('handlebars');

var Composer = require('./composer');
var Renderer = require('./renderer');
var Router = require('./router');

var optionsSchema = Joi.object().keys({
    rootDir: Joi.string().required(),
    paths: Joi.object().default({}),
    handlebars: Joi.object().default(handlebars),
});

module.exports.register = register;
module.exports.register.attributes = {
    pkg: require('../package.json')
};

function register(server, options, next) {
    var validation = Joi.validate(options, optionsSchema);
    if (validation.error)
        return next(validation.error);

    options = validation.value;

    server.log(['info', 'windshield'], 'application directory identified as: ' + options.rootDir);

    try {
        server.views({
            engines: { html: options.handlebars },
            relativeTo: options.rootDir,
            path: './',
            helpersPath: 'helpers'
        });
    } catch(err) {
        return next(err);
    }

    if (!fs.existsSync(path.join(options.rootDir, 'components')))
        return next(new Error('`components` directory not found'));

    var windshield = {
        server: server,
        options: options
    };
    windshield.composer = Composer(windshield);
    windshield.renderer = Renderer(windshield);
    windshield.router = Router(windshield);

    server.expose(windshield);

    next();
}
