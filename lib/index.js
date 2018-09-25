'use strict';

const handlebars = require('handlebars');

const Joi = require('joi');

const processRoutes = require('./processRoutes');
const templateInit = require('./templateInit');

const ComponentMap = require('./Component/Map');

const handlerGenerator = require('./handler.generator');

const optionsSchema = Joi.object().keys({
    rootDir: Joi.string().required(),
    handlebars: Joi.object().default(handlebars),
    uriContext: Joi.string().allow('').default(''),
    routes: Joi.array().required(),
    components: Joi.object().default({}),
    path: Joi.array().default(['./']),
    helpersPath: Joi.array().default(['helpers'])
});



function register(server, options, next) {

    const validation = Joi.validate(options, optionsSchema);

    if (validation.error) {
        return next(validation.error);
    }

    const {
        components,
        handlebars,
        helpersPath,
        path,
        uriContext,
        routes,
        rootDir
    } = validation.value;

    const componentMap = ComponentMap(components);

    server.log(['info', 'windshield'], "application directory identified as: " + rootDir);

    try {
        server.views({
            engines: {html: handlebars},
            relativeTo: rootDir,
            path,
            helpersPath
        });
    } catch (err) {
        return next(err);
    }

    const hapiHandler = handlerGenerator(()=>server.log(...args), componentMap);

    const hapiRoutes = processRoutes(hapiHandler, {uriContext, routes});

    server.route(hapiRoutes);

    templateInit(handlebars);

    componentMap.init(handlebars).then(function () {
        next();
    });

}


register.attributes = {
    pkg: require('../package.json')
};

const readTemplate = require('./readTemplate');

const windshield = {
    register,
    readTemplate
};

module.exports = windshield;
