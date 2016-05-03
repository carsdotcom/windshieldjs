"use strict";

var _ = require("lodash");
var fs = require('fs');
var path = require('path');
var Hoek = require('hoek');
var handlebars = require("handlebars");

var Joi = require('joi');
var Composer = require('./composer');
var Renderer = require('./renderer');
var Router = require('./router');
var templateInit = require("./templateInit");

var optionsSchema = Joi.object().keys({
    rootDir: Joi.string().required(),
    handlebars: Joi.object().default(handlebars),
    uriContext: Joi.string().allow('').default(''),
    routes: Joi.array().required(),
    components: Joi.object().default({})
});

module.exports.register = function register(server, options, next) {

    var routes = options.routes;
    var rootDir = options.rootDir;
    var handlebars = options.handlebars;
    var uriContext = options.uriContext;
    var components = options.components;

    var validation = Joi.validate(options, optionsSchema);

    if (validation.error) return next(validation.error);
    options = validation.value;

    server.log(['info', 'windshield'], 'application directory identified as: ' + options.rootDir);

    try {
        server.views({
            engines: {html: handlebars},
            relativeTo: rootDir,
            path: './',
            helpersPath: 'helpers'
        });
    } catch (err) {
        return next(err);
    }

    var windshield = {
        server: server,
        options: options
    };

    windshield.composer = Composer(windshield);
    windshield.renderer = Renderer(windshield);
    windshield.router = Router(windshield);

    templateInit(handlebars, components).then(() => next());
};

module.exports.register.attributes = {
    pkg: require('../package.json')
};

module.exports.readTemplate = require('./readTemplate');
