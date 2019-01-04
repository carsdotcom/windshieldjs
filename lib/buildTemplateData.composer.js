'use strict';
const path = require('path');
const clonedeep = require('lodash.clonedeep');
const merge = require('lodash.merge');

const renderComponentSchema = require('./associationProcessorService');

module.exports = composer;



/**
 * An object describing a template file and data that can be used to compile the template
 *
 * @typedef {Object} TemplateData
 * @property {string} template        - The path to a Handlebars template file
 * @property {object} data            - The data that will be used to compile the template into HTML
 * @property {object} data.attributes
 * @property {object} data.exported
 * @property {Object.<string, string>} data.assoc - Hashmap of association names and HTML markup
 */


/**
 * Composes a function that processes a Hapi request using Windshield adapters and context.
 *
 * We can't define the function we need at run-time, so this function will build it for
 * us when we're ready.
 *
 * @param {ComponentMap} componentMap - Description of all available Windshield components
 * @returns {buildTemplateData}
 */
function composer(componentMap) {

    return buildTemplateData;

    /**
     * Accepts a Hapi request object (containing Windshield config information) and
     * resolves everything Hapi/Vision needs to render an HTML page.
     *
     * @callback {buildTemplateData}
     * @param {Request} request - Hapi request object
     * @returns {Promise.<TemplateData>}
     */
    async function buildTemplateData(request) {
        const filterFn = composePageFilter(request);
        const pageContext = await resolvePageContext(request);
        const renderer = componentMap.composeFactory(pageContext, request);
        const renderedComponentCollection = await renderComponentSchema(pageContext.associations, renderer);

        // we only need the data to be in this intermediary format to support
        // the filtering logic.  We should streamline this out but that would
        // be a breaking change.
        const rawPageObject = {
            attributes: pageContext.attributes,
            assoc: renderedComponentCollection,
            layout: pageContext.layout,
            exported: renderedComponentCollection.exportedData
        };

        if (process.env.WINDSHIELD_DEBUG) {
            request.server.log('info', JSON.stringify(rawPageObject, null, 4));
        }

        const {assoc, attributes, layout} = await filterFn(rawPageObject);
        const template = path.join('layouts', layout);

        return {
            template,
            data: {
                attributes,
                assoc: assoc.markup,
                exported: assoc.exported
            }
        };
    }
}


function composePageFilter(request) {
    const routeSettings = request && request.route && request.route.settings;
    const app = routeSettings && routeSettings.app;
    const pageFilter = app.pageFilter;

    /**
     * @param {object} page
     * @param {RenderedComponentCollection} page.assoc
     * @param {object} page.exported
     * @param {String} page.layout
     * @param {object} page.attributes
     * @returns {Promise.<object>} An object in the same format as the original argument.
     */
    return async function (page) {
        if (pageFilter) {
            return pageFilter(page, request);
        }
        return page;
    };
}


/**
 * @async
 * Builds a Windshield page context object for a request, based upon
 * Windshield's context, prehandlers, and adapters that are configured in
 * the route.
 *
 * Runs a series of Windshield adapters and merges the results to the Windshield context
 *
 * @param {Request} request
 *
 * @returns {Promise<module:processRoutes.Context>} A page context object
 */
async function resolvePageContext(request) {
    const routeSettings = request && request.route && request.route.settings;
    const app = routeSettings && routeSettings.app;

    // initialize page context as a copy of the route context.
    const pageContext = clonedeep(app.context);

    // request.pre contains the response values for each prerequisite defined
    // for the route in processRoutes.js
    const preHandlerResults = Object.values(request.pre);
    preHandlerResults.reduce(merge, pageContext);

    // run each page adapter to get an array of promises.
    // note each adapter could perform side effects that mutate page context.
    const pageAdapters = app.adapters;
    const promises = pageAdapters.map(a => a(pageContext, request));
    const adapterResults = await Promise.all(promises);

    // merge the page adapter results into the page context.
    return adapterResults.reduce(merge, pageContext);
}
