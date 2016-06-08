"use strict";

var path = require('path');
var _ = require('lodash');
var Joi = require('joi');
var pageDefinitionService = require('./pageDefinitionService');
var associationProcessorService = require('./associationProcessorService');

module.exports = Composer;

var optionsSchema = Joi.object().keys({
    components: Joi.object().default({})
});


function Composer(windshield) {

    var options = _.pick(windshield.options, 'components');
    var validation = Joi.validate(options, optionsSchema);
    if (validation.error) throw validation.error;

    var components = options.components;

    return composer;

    function composer(request) {
        var context = _.cloneDeep(request.route.settings.app.context);
        var adapters = request.route.settings.app.adapters;


        return pageDefinitionService(adapters, request, context)
            .then(runAssociationIterator);

        function packagePage(assocData) {
            var assoc = assocData.associationData;
            var exported = assocData.exportedData;
            var page = {
                associations: assoc,
                exported: exported,
                layout: context.layout,
                attributes: context.attributes
            };
            if (process.env.WINDSHIELD_DEBUG) {
                windshield.server.log('info', JSON.stringify(page, null, 4));
            }
            return page;
        }

        function runAssociationIterator() {
            return associationProcessorService.runAssociationIterator(context, request, components, context.associations)
                .then(packagePage);
        }


    }
}
