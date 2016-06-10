"use strict";

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
    childAssociations.associationData = {};

    function getPackagedComponent() {
        var promise;

        _.defaultsDeep(componentData.associations, childAssociations.associationData);

        if (adapter) {
            promise = adapter(componentData, context, request);
        } else if (Model) {
            promise = Promise.resolve(new Model(componentData));
        } else {
            promise = Promise.resolve(componentData);
        }

        return promise.then(function (data) {
            data.associations = childAssociations.associationData;
            var result = {};

            result.data = {
                name: componentDefinition.component,
                layout: componentDefinition.layout,
                data: data.data || data
            };

            if (_.isObject(data.export)) {
                var exported = {
                    data: data.export,
                    exportAs: data.exportAs || componentDefinition.component
                };
                result.exported = exported;
            }

            return result;
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
    var exportedResults = {};

    var associationPromises = _.map(associations, function (association, name) {
        return associationProcessor(context, association, request, components).then(function (packagedData) {
            var exported = _.filter(packagedData, 'exported');
            var exportedComponentNames = _.map(exported, (v) => v.exported.exportAs);
            associationResults[name] = _.map(packagedData, 'data');
            _.forEach(exportedComponentNames, (n) => {
                let filtered = _.filter(exported, function (e) {
                    return (e.exported.exportAs === n);
                });
                let last = filtered.pop();
                if (_.isObject(last) && _.isObject(last.exported)) {
                    exportedResults[n] = last.exported.data;
                }
            });
        });
    });

    return Promise.all(associationPromises).then(function () {
        return {
            associationData: associationResults,
            exportedData: exportedResults
        };
    });
}

module.exports.runAssociationIterator = associationIterator;
