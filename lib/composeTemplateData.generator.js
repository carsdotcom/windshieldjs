'use strict';
const path = require('path');
const _ = require('lodash');
const Joi = require('joi');
const pageDefinitionService = require('./pageDefinitionService');
const associationProcessorService = require('./associationProcessorService');

module.exports = generator;


const parsePageDataForVision = require('./parsePageDataForVision');
let componentsSchema = Joi.object().default({});


function generator(logFunc, componentMap) {

    const validation = Joi.validate(componentMap, componentsSchema);
    if (validation.error) {
        throw validation.error;
    }

    return composeTemplateData;

    function composeTemplateData(request) {
        let app = request.route.settings.app;

        let context = _.cloneDeep(app.context);
        let adapters = app.adapters;

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
            return associationProcessorService.associationIterator(context, request, componentMap, context.associations)
                .then(packagePage)
                .then(parsePageDataForVision);
        }

    }
}
