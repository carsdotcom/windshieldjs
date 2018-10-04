'use strict';
const path = require('path');
const pageDefinitionService = require('./pageDefinitionService');
const renderComponentSchema = require('./associationProcessorService');

module.exports = composer;


const parsePageDataForVision = require('./parsePageDataForVision');


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
     * @returns {Promise.<module:parsePageDataForVision.TemplateData>}
     */
    function buildTemplateData(request) {
        return pageDefinitionService(request)
            .then(runAssociationIterator)
            .then(logPageObject)
            .then(composePageFilter(request))
            .then(parsePageDataForVision);


        /**
         * @param {object} page
         * @param {RenderedComponentCollection} page.assoc
         * @param {object} page.exported
         * @param {String} page.layout
         * @param {object} page.attributes
         * @returns {object} The same page object, unaltered
         */
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
                .then((renderedComponentCollection) => packagePage(renderedComponentCollection, layout, attributes));
        }

    }
}


function composePageFilter(request) {
    let app = request.route.settings.app;
    let pageFilter = app.pageFilter;


    /**
     * @param {object} page
     * @param {RenderedComponentCollection} page.assoc
     * @param {object} page.exported
     * @param {String} page.layout
     * @param {object} page.attributes
     * @returns {object} An object in the same format as the original argument.
     */
    return function (page) {
        if (pageFilter) {
            return pageFilter(page, request);
        }
        return page;
    };

}

/**
 *
 * @param {RenderedComponentCollection} renderedComponentCollection
 * @param {String} layout
 * @param {object} attributes
 * @returns {{assoc: RenderedComponentCollection, exported: object, layout: string, attributes: {object}}}
 */
function packagePage(renderedComponentCollection, layout, attributes) {
    let exported = renderedComponentCollection.exportedData;
    return {
        assoc: renderedComponentCollection,
        exported,
        layout,
        attributes
    };
}