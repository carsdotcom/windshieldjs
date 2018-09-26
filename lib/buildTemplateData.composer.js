'use strict';
const path = require('path');
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
 * @returns {buildTemplateData}
 */
function composer(logFunc, componentMap) {

    const validation = Joi.validate(componentMap, componentsSchema);
    if (validation.error) {
        throw validation.error;
    }

    return buildTemplateData;

    function logPageObject(page) {
        if (process.env.WINDSHIELD_DEBUG) {
            logFunc('info', JSON.stringify(page, null, 4));
        }
        return page;
    }


    /**
     * Accepts a Hapi request object (containing Windshield config information) and
     * resolves everything Hapi/Vision needs to render an HTML page.
     *
     * @callback {buildTemplateData}
     * @param {Request} request - Hapi request object
     * @returns {Promise.<module:parsePageDataForVision.TemplateData>}
     */
    function buildTemplateData(request) {
        return pageDefinitionService(request)
            .then(runAssociationIterator)
            .then(logPageObject)
            .then(composePageFilter(request))
            .then(parsePageDataForVision);

        function runAssociationIterator(updatedContext) {
            return associationProcessorService.associationIterator(updatedContext, request, componentMap, updatedContext.associations)
                .then((assocData) => packagePage(assocData, updatedContext));
        }

    }
}


function composePageFilter(request) {
    let app = request.route.settings.app;
    let pageFilter = app.pageFilter;

    return function (page) {
        if (pageFilter) {
            return pageFilter(page, request);
        }
        return page;
    };

}


function packagePage(assocData, context) {
    let assoc = assocData;
    let exported = assocData.exportedData;
    return {
        assoc: assoc,
        exported: exported,
        layout: context.layout,
        attributes: context.attributes
    };
}