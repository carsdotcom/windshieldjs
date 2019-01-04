'use strict';
const validateOptions = require('./validateOptions');
const processRoutes = require('./processRoutes');
const templateInit = require('./templateInit');
const ComponentMap = require('./Component/Map');
const handlerComposer = require('./handler.composer');
const readTemplate = require('./readTemplate');

/**
 * @async
 *
 * @param {Server} server             - the Hapi server object the plugin is being registered to.
 * @param {WindshieldOptions} options - an object passed to the plugin during registration.
 *
 * @returns {Promise.<null>}
 */
async function register(server, options) {
    const validation = validateOptions(options);

    if (validation.error) {
        throw validation.error;
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

    server.views({
        engines: {html: handlebars},
        relativeTo: rootDir,
        path,
        helpersPath
    });

    const componentMap = ComponentMap(components);

    const hapiHandler = handlerComposer(componentMap);
    const hapiRoutes = processRoutes(hapiHandler, uriContext, routes);
    server.route(hapiRoutes);
    templateInit(handlebars);

    return componentMap.init(handlebars);
}


register.attributes = {
    pkg: require('../package.json')
};

const windshield = {
    name: 'windshield',
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



module.exports = windshield;
