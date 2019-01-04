'use strict';

/**
 * @module processRoutes
 */



module.exports = processRoutes;

function flattenDeep(arr) {
    if (Array.isArray(arr)) {
        return arr.reduce((a, b) => a.concat(flattenDeep(b)) , []);
    }
    return [arr];
}

function isPreHandler(a) {
    if (a && a.method) {
        return typeof a.method === "function";
    }
    return null;
}

/**
 * Converts an array of Windshield routes into a an array of Hapi routes.
 * Each route will use the same handler method, which accesses a set of
 * Windshield adapters from the route to build a page object, and define a
 * layout template to compile the page object into a web page.
 *
 * @param {handler} handler                     - Hapi route handler method
 * @param {module:processRoutes.Route[]} routes - Array of Windshield route objects, which are processed into Hapi routes
 * @param {string} uriContext                   - the URI context to be prepended to the paths of each route.
 *
 * @returns {object[]} - An array of Hapi route options objects
 */
function processRoutes(handler, uriContext, routes) {
    return routes.map(setupRoute);

    /**
     * @param {(PreReq|pageAdapter)[]} adapters - Array of adapters and Hapi route prerequisites for processing
     *                                            an incoming request
     * @param {pageFilter} pageFilter           - Function for performing post-processing on page object before
     *                                            templating begins
     * @param {string} method                   - HTTP method for the route
     * @param {string} path                     - Path for the route
     * @param {module:processRoutes.Context} context
     *                                          - Data that should be made available to the adapters and route handler
     *
     * @returns {object} Hapi route options object
     */
    function setupRoute({adapters, pageFilter, method, path, context}) {
        const allAdaptersAndPreHandlers = flattenDeep(adapters);
        const preHandlers = allAdaptersAndPreHandlers.filter(x => isPreHandler(x));
        const pageAdapters = allAdaptersAndPreHandlers.filter(x => !isPreHandler(x));


        const app = {
            context,
            adapters: pageAdapters
        };
        if (pageFilter) {
            app.pageFilter = pageFilter;
        }

        const pre = preHandlers.map(mapToWrappedHandler);

        return {
            method,
            path: uriContext + path,
            handler,
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
    return function wrappedHandler(request, h) {
        const routeSettings = request && request.route && request.route.settings;
        const app = routeSettings && routeSettings.app;
        const context = app.context || {};

        return handler(context, request, h);
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
 * @param {Toolkit} h     - Hapi response toolkit
 * @returns {Response|*} - Hapi response object or any data to be packaged in a response
 */

/**
 * A Hapi route handler method.
 * @callback handler
 * @param {Request} request - Hapi request object
 * @param {Toolkit} h     - Hapi response toolkit
 * @returns {Response|*} - Hapi response object or any data to be packaged in a response
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
 * @property {(PreReq|PreReq[]|pageAdapter|pageAdapter[])[]} adapters
 *                                             - Array of adapters and Hapi route prerequisites for processing
 *                                               an incoming request (may contain nested arrays of adapters and prereqs)
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
 * @property {Object.<string, ComponentDefinition[]>} associations - hashmap of component definition arrays
 */