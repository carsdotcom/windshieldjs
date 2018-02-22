'use strict';
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

const Joi = require('joi');
const Windshield = require('./Windshield');
const ComponentMap = require('./Component/Map');

let optionsSchema = Joi.object().keys({
    rootDir: Joi.string().required(),
    handlebars: Joi.object().default(handlebars),
    uriContext: Joi.string().allow('').default(''),
    routes: Joi.array().required(),
    components: Joi.object().default({})
});

module.exports.register = function register(server, options, next) {

    let routes = options.routes;
    let rootDir = options.rootDir;
    let handlebars = options.handlebars;
    let uriContext = options.uriContext;
    let validation = Joi.validate(options, optionsSchema);

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
