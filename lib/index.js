'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var Hoek = require('hoek');
var handlebars = require('handlebars');

var Joi = require('joi');
var Windshield = require('./Windshield');
var ComponentMap = require('./Component/Map');

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
    var validation = Joi.validate(options, optionsSchema);

    if (validation.error) return next(validation.error);
    options = validation.value;

    options.components = ComponentMap(options.components);

    server.log(['info', 'windshield'], "application directory identified as: " + options.rootDir);

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

    Windshield({
        server: server,
        options: options
    });

    options.components.init(handlebars).then(function () {
        next();
    });

};

module.exports.register.attributes = {
    pkg: require('../package.json')
};

module.exports.readTemplate = require('./readTemplate');
