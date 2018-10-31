'use strict';
const handlebars = require('handlebars');

const Joi = require('joi');

const processRoutes = require('./processRoutes');
const templateInit = require('./templateInit');

const ComponentMap = require('./Component/Map');

const handlerComposer = require('./handler.composer');

const componentDefinitionSchema = Joi.object()
    .keys({
        data: Joi.object().optional(),
        component: Joi.string().required(),
        layout: Joi.string().optional(),
        associations: Joi.lazy(() => componentAssociationSchema)
    })
    .unknown();

const componentAssociationSchema = Joi.object()
    .pattern(/\w/, componentDefinitionSchema)
    .default({});


const contextSchema = Joi.object().keys({
    layout: Joi.string().default('default'),
    attributes: Joi.object().default({}),
    associations: componentAssociationSchema
}).default({
    layout: 'default',
    attributes: {},
    associations: {}
}).unknown();

const hapiPreReqSchema = Joi.object().keys({
    method: Joi.func().required(),
    assign: Joi.string().optional()
});

const adaptersArraySchema = Joi.array().items(
    Joi.func(),
    hapiPreReqSchema,
    Joi.lazy(() => adaptersArraySchema)
).default([]);

const routeSchema = Joi.object().keys({
    method: Joi.string().default('GET'),
    path: Joi.string().required(),
    context: contextSchema,
    adapters: adaptersArraySchema,
    pageFilter: Joi.func().optional()
});

const componentConfigSchema = Joi.object()
    .keys({
        adapter: Joi.func().optional(),
        defaults: Joi.object().optional(),
        templates: Joi.object().optional(),
        partials: Joi.object().optional(),
        Model: Joi.func().optional()
    })
    .unknown();

const optionsSchema = Joi.object().keys({
    rootDir: Joi.string().required(),
    handlebars: Joi.object().default(handlebars),
    uriContext: Joi.string().allow('').default(''),
    routes: Joi.array().items(routeSchema).default([]),
    components: Joi.object().pattern(/\w/, componentConfigSchema).default({}),
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
 *
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

    const hapiHandler = handlerComposer(componentMap);
    const hapiRoutes = processRoutes(hapiHandler, uriContext, routes);
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
 * @property {Object.<string, ComponentConfig>} components - hashmap where each key is the name of a Windshield
 *                                                           component, and each value is the raw config data to
 *                                                           generate a RenderedComponent
 * @property {Handlebars} [handlebars]                     - The instance of Handlebars that will be used for the
 *                                                           Hapi/Vision rendering engine
 * @property {(string|string[])} helpersPath               - the directory path, or array of directory paths, where
 *                                                           Handlebars helpers are located.
 * @property {(string|string[])} path                      - the root file path, or array of file paths, used to
 *                                                           resolve and load the template
 * @property {string} rootDir                              - a base path used as prefix for path
 * @property {module:processRoutes.Route[]} routes         - Array of Windshield route objects, which are processed
 *                                                           into Hapi routes
 * @property {string} [uriContext]                         - the URI context to be prepended to the paths of each route.
 */


/**
 * @callback registerCallback
 * @param {Error} err - any plugin registration error.
 */



module.exports = windshield;
