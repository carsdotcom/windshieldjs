'use strict';
const path = require('path');
const _ = require('lodash');
const Joi = require('joi');
const pageDefinitionService = require('./pageDefinitionService');
const associationProcessorService = require('./associationProcessorService');

module.exports = composer;


const parsePageDataForVision = require('./parsePageDataForVision');
let componentsSchema = Joi.object().default({});


/**
 * Composes a function that processes a Hapi request using Windshield adapters and context.
 *
 * We can't define the function we need at run-time, so this function will build it for
 * us when we're ready.
 *
 * @param {logger} logFunc            - A simple function for accessing Hapi's server.log
 * @param {ComponentMap} componentMap - Description of all available Windshield components
 * @returns {composeTemplateData}
 */
function composer(logFunc, componentMap) {

    const validation = Joi.validate(componentMap, componentsSchema);
    if (validation.error) {
        throw validation.error;
    }

    return composeTemplateData;

    /**
     * Accepts a Hapi request object (containing Windshield config information) and
     * resolves everything Hapi/Vision needs to render an HTML page.
     *
     * @callback {composeTemplateData}
     * @param {Request} request - Hapi request object
     * @returns {Promise.<module:parsePageDataForVision.TemplateData>}
     */
    function composeTemplateData(request) {
        let app = request.route.settings.app;

        let context = _.cloneDeep(app.context);
        let adapters = app.adapters;

        // pageDefinitionService mutates context, and makes sure the changes are complete
        // before allowing runAssociationIterator to proceed.
        return pageDefinitionService(adapters, request, context)
            .then(runAssociationIterator);

        function packagePage(assocData) {
            let assoc = assocData;
            let exported = assocData.exportedData;
            let pageFilter = app.pageFilter;
            let page = {
                assoc: assoc,
                exported: exported,
                layout: context.layout,
                attributes: context.attributes
            };
            if (process.env.WINDSHIELD_DEBUG) {
                logFunc('info', JSON.stringify(page, null, 4));
            }

            if (pageFilter) {
                return pageFilter(page, request);
            }
            return page;
        }

        function runAssociationIterator() {
            // This code doesn't make it clear, but context has been modified by pageDefinitionService
            return associationProcessorService.associationIterator(context, request, componentMap, context.associations)
                .then(packagePage)
                .then(parsePageDataForVision);
        }

    }
}
