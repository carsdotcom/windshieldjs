'use strict';
const path = require('path');
const Joi = require('joi');
const pageDefinitionService = require('./pageDefinitionService');
const renderComponentSchema = require('./associationProcessorService');

module.exports = composer;


const parsePageDataForVision = require('./parsePageDataForVision');
const componentsSchema = Joi.object().default({});


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

    const validation = Joi.validate(componentMap, componentsSchema);
    if (validation.error) {
        throw validation.error;
    }

    return buildTemplateData;

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


        function logPageObject(page) {
            if (process.env.WINDSHIELD_DEBUG) {
                request.log('info', JSON.stringify(page, null, 4));
            }
            return page;
        }



        function runAssociationIterator(updatedContext) {
            let {layout, attributes} = updatedContext;


            const renderer = componentMap.composeFactory(updatedContext, request);
            const {associations} = updatedContext;

            return renderComponentSchema(associations, renderer)
                .then((assocData) => packagePage(assocData, layout, attributes));
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

/**
 *
 * @param {RenderedAssocMap} assocData
 * @param {String} layout
 * @param {object} attributes
 * @returns {{assoc: RenderedAssocMap, exported: object, layout: string, attributes: {object}}}
 */
function packagePage(assoc, layout, attributes) {
    let exported = assoc.exportedData;
    return {
        assoc,
        exported,
        layout,
        attributes
    };
}