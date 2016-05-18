/**
 * Created by jcsokolow on 5/3/16.
 */
var _ = require('lodash');
/**
 * This function processes child associations before parents.
 */
function componentProcessor(context, componentDefinition, request, components) {
    var component = components[componentDefinition.component] || {};
    var componentData = componentDefinition.data || componentDefinition;
    var adapter = component.adapter || null;
    var Model = component.Model || null;

    var childAssociations = {};

    function getPackagedComponent() {
        var promise;

        _.defaultsDeep(componentData.associations, childAssociations);

        if (adapter) {
            promise = adapter(componentData, context, request);
        } else if (Model) {
            promise = Promise.resolve(new Model(componentData));
        } else {
            promise = Promise.resolve(componentData);
        }

        return promise.then(function (data) {
            data.associations = childAssociations;

            return {
                name: componentDefinition.component,
                layout: componentDefinition.layout,
                data: data
            };
        });
    }

    if (componentDefinition.associations && _.size(componentDefinition.associations)) {
        return associationIterator(context, request, components, componentDefinition.associations).then(function (associations) {
            childAssociations = associations;
        }).then(getPackagedComponent);
    } else {
        return getPackagedComponent();
    }
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