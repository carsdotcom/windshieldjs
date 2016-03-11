"use strict";

var path = require('path');
var Promise = require('bluebird');
var _ = require('lodash');
var Joi = require('joi');

module.exports = Composer;

var optionsSchema = Joi.object().keys({
    components: Joi.object().default({})
});

function componentProcessor(context, componentDefinition, request, components) {
    var component = components[componentDefinition.component] || {};
    var componentData = componentDefinition.data || componentDefinition;
    var adapter = component.adapter || null;
    var Model = component.Model || null;

    var promise;

    if (adapter) {
        promise = adapter(componentData, context, request);
    } else if (Model) {
        promise = Promise.resolve(new Model(componentData));
    } else {
        promise = Promise.resolve(componentData);
    }

    return promise.then(function (data) {
        return associationIterator(context, request, components, componentDefinition.associations || []).then(function (associations) {
            data.associations = associations;

            var packagedComponent = {
                name: componentDefinition.component,
                layout: componentDefinition.layout,
                data: data
            };

            return packagedComponent;
        });
    });
}

function associationProcessor(context, association, request, components) {
    var componentPromises = _.map(association, function (component) {
        return componentProcessor(context, component, request, components);
    });

    return Promise.all(componentPromises);
}

function associationIterator(context, request, components, associations) {
    var associationResults = {};

    var associationPromises = _.map(associations, function (association, name) {
        return associationProcessor(context, association, request, components).then(function (associationData) {
            associationResults[name] = associationData;
        });
    });

    return Promise.all(associationPromises).then(function () {
        return associationResults;
    });
}



function Composer(windshield) {

    var options = _.pick(windshield.options, 'components');
    var validation = Joi.validate(options, optionsSchema);
    if (validation.error) throw validation.error;

    var components = options.components;

    return composer;

    function composer(request) {
        var context = _.cloneDeep(request.route.settings.app.context);
        var adapters = request.route.settings.app.adapters;

        _.each(request.pre, function (pre) {
            _.merge(context, pre);
        });

        return Promise
                .map(adapters, run)
                .each(assign)
                .then(runAssociationIterator);

        function packagePage(assoc) {
            var page = {
                associations: assoc,
                layout: context.layout,
                attributes: context.attributes
            };
            if (process.env.WINDSHIELD_DEBUG) {
                windshield.server.log('info', JSON.stringify(page, null, 4));
            }
            return page;
        }

        function runAssociationIterator() {
            return associationIterator(context, request, components, context.associations)
                .then(packagePage);
        }

        function run(adapter) {
            return adapter(context, request);
        }

        function assign(toAssign) {
            _.merge(context, toAssign);
        }

    }
}
