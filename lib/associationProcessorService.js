/**
 * Created by jcsokolow on 5/3/16.
 */
var _ = require('lodash');

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

module.exports.runAssociationIterator = associationIterator;