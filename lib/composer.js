'use strict';
const path = require('path');
const _ = require('lodash');
const Joi = require('joi');
const pageDefinitionService = require('./pageDefinitionService');
const associationProcessorService = require('./associationProcessorService');

module.exports = Composer;


let componentsSchema = Joi.object().default({});


function Composer(server, componentMap) {

    const validation = Joi.validate(componentMap, componentsSchema);
    if (validation.error) {
        throw validation.error;
    }

    return composer;

    function composer(request) {
        let context = _.cloneDeep(request.route.settings.app.context);
        let adapters = request.route.settings.app.adapters;

        return pageDefinitionService(adapters, request, context)
            .then(runAssociationIterator);

        function packagePage(assocData) {
            let assoc = assocData;
            let exported = assocData.exportedData;
            let pageFilter = request.route.settings.app.pageFilter;
            let page = {
                assoc: assoc,
                exported: exported,
                layout: context.layout,
                attributes: context.attributes
            };
            if (process.env.WINDSHIELD_DEBUG) {
                server.log('info', JSON.stringify(page, null, 4));
            }

            if (pageFilter) return pageFilter(page, request);
            return page;
        }

        function runAssociationIterator() {
            return associationProcessorService.associationIterator(context, request, componentMap, context.associations)
                .then(packagePage);
        }

    }
}
