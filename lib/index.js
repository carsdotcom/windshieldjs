'use strict';

const handlebars = require('handlebars');

const Joi = require('joi');

const processRoutes = require('./processRoutes');
const templateInit = require('./templateInit');

const ComponentMap = require('./Component/Map');

const handlerComposer = require('./handler.composer');

const optionsSchema = Joi.object().keys({
    rootDir: Joi.string().required(),
    handlebars: Joi.object().default(handlebars),
    uriContext: Joi.string().allow('').default(''),
    routes: Joi.array().required(),
    components: Joi.object().default({}),
    path: Joi.array().default(['./']),
    helpersPath: Joi.array().default(['helpers'])
});

// Hapi16: function register(server, options, next) {...}
// Hapi17: function register(server, options) {...}


/**
 *
 *
 * @param {Server} server             - the Hapi server object the plugin is being registered to.
 * @param {WindshieldOptions} options - an object passed to the plugin during registration.

 * @param {registerCallback} next     - a callback method the function must call to return control back to the
 *                                      Hapi framework to complete the plugin registration process
 *
 * @returns {undefined}
 */
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

    const componentMap = ComponentMap(components);

    const hapiHandler = handlerComposer(() => server.log(...args), componentMap);

    const hapiRoutes = processRoutes(hapiHandler, {uriContext, routes});

    server.route(hapiRoutes);

    templateInit(handlebars);

    // Hapi16: We have to call next() to let Hapi know the plugin is ready
    // Hapi17: next is gone, just return componentMap.init(handlebars)
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


/**
 * @typedef {Object} WindshieldOptions
 * @property {object} options.components       - hashmap where each key is the name of a Windshield component, and
 *                                               each value is the raw config data for a Component instance
 * @property {Handlebars} [options.handlebars] - The instance of Handlebars that will be used for the Hapi/Vision
 *                                               rendering engine
 * @property {string} options.helpersPath      - the directory path, or array of directory paths, where Handlebars
 *                                               helpers are located.
 * @property {string} options.path             - the root file path, or array of file paths, used to resolve and load
 *                                               the template
 * @property {string} options.rootDir          - a base path used as prefix for path
 * @property {module:processRoutes.Route[]} options.routes
 *                                             - Array of Windshield route objects, which are processed into Hapi routes
 * @property {string} [options.uriContext]     - the URI context to be prepended to the paths of each route.
 */


/**
 * @callback registerCallback
 * @param {Error} err - any plugin registration error.
 */



module.exports = windshield;
