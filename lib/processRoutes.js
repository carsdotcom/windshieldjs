'use strict';

/**
 * @module processRoutes
 */

const Joi = require('joi');
const _ = require('lodash');

let contextSchema = Joi.object().keys({
   layout: Joi.string().default('default'),
   attributes: Joi.object().default({}),
   associations: Joi.object().default({})
}).default({
   layout: 'default',
   attributes: {},
   associations: {}
}).unknown();

let routeSchema = Joi.object().keys({
    method: Joi.string().default('GET'),
    path: Joi.string().required(),
    context: contextSchema,
    adapters: Joi.array().items().default([]),
    pageFilter: Joi.func().optional()
});

let optionsSchema = Joi.object().keys({
    uriContext: Joi.string().allow('').default(''),
    routes: Joi.array().items(routeSchema).default([])
});

module.exports = processRoutes;



/**
 * Converts an array of Windshield routes into a an array of Hapi routes.
 * Each route will use the same handler method, which accesses a set of
 * Windshield adapters from the route to build a page object, and define a
 * layout template to compile the page object into a web page.
 *
 * @param {handler} handler             - Hapi route handler method
 * @param {module:processRoutes.Route[]} [options.routes]
 *                                      - Array of Windshield route objects, which are processed into Hapi routes
 * @param {string} [options.uriContext] - the URI context to be prepended to the paths of each route.
 *
 * @param {object[]} An array of Hapi route options objects
 */
function processRoutes(handler, options) {
    const validation = Joi.validate(options, optionsSchema);
    if (validation.error) {
        throw validation.error;
    }

    const {uriContext, routes} = validation.value;



    return routes.map(setupRoute);


    function setupRoute({adapters, pageFilter, method, path, context}) {
        let flattened = _.flatMap(adapters);
        let preHandlers = _.remove(flattened, (a) => _.isFunction(a.method));

        let app = {
            context,
            adapters: flattened
        };
        if (pageFilter) {
            app.pageFilter = pageFilter;
        }

        let pre = _.map(preHandlers, mapToWrappedHandler);

        return {
            method: method,
            path: uriContext + path,
            handler: handler,
            config: {
                state: {
                    failAction: 'log'
                },
                app,
                pre
            }
        };
    }

}

function WrappedHandler(handler) {
    return function wrappedHandler(request, reply) {
        let context;
        if (request.route) {
            context = request.route.settings.app.context;
        } else {
            context = {};
        }
        return handler(context, request, reply);
    };
}

function mapToWrappedHandler(handler) {
    return {
        method: WrappedHandler(handler.method),
        assign: handler.assign
    };
}


/**
 * A Windshield page adapter method.  Each Windshield route may use one or more of these to
 * process an incoming request against the given context, to produce new data.  Windshield
 * uses the result of this function to decorate the context, although that does not happen
 * here.
 *
 * Note that this version of Windshield does not prevent page adapters from mutating
 * the context.
 *
 * @callback pageAdapter
 * @param {object} context
 * @param {Request} request
 *
 * @returns {object} A set of properties that can be assigned to the context
 */

/**
 * A Hapi route prerequisite object.  See https://hapijs.com/api/16.6.2#route-prerequisites
 *
 * Hapi assigns the response of a prerequisite to the request.pre namespace, based
 * on the prereq's assign property.  Windshield uses these values to modify its context
 * object.  See pageDefinitionService.js
 *
 * @typedef {Object} PreReq
 * @property {windshieldprehandler} method  - A specialized Windshield version of a prerequisite method
 * @property {string} assign   - key name to assign the result of the function to within request.pre
 *
 */

/**
 * Similar to a Hapi prerequisite method, the Windshield version takes an additional parameter
 * to get the Windshield context object.
 *
 * @callback windshieldprehandler
 * @param {module:processRoutes.Context} context
 * @param {Request} request - Hapi request object
 * @param {Reply} reply     - Hapi reply object
 * @returns {undefined}
 */

/**
 * A Hapi route handler method.
 * @callback handler
 * @param {Request} request - Hapi request object
 * @param {Reply} reply     - Hapi reply object
 * @returns {undefined}
 */

/**
 * @callback pageFilter
 * @param {object} pageObj - Windshield page object
 * @param {Request} request - Hapi request object
 *
 * @returns {object} A Windshield page object
 */

/**
 * A Windshield route config object
 * @typedef {Object} module:processRoutes.Route
 *
 * @property {(PreReq|pageAdapter)[]} adapters - Array of adapters and Hapi route prerequisites for processing
 *                                               an incoming request
 * @property {pageFilter} pageFilter           - Function for performing post-processing on page object before
 *                                               templating begins
 * @property {string} method                   - HTTP method for the route
 * @property {string} path                     - Path for the route
 * @property {module:processRoutes.Context} context
 *                                             - Data that should be made available to the adapters and route handler
 */

/**
 * A Windshield context object
 * @typedef {Object} module:processRoutes.Context
 * @property {String} layout
 * @property {object} attributes
 * @property {object} associations
 */