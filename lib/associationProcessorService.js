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
            var exported = _.map(packagedData, 'exported');
            var exportedComponentNames = _.filter(_.map(exported, 'exportAs'), _.isString);
            associationResults[name] = _.map(packagedData, 'data');
            _.forEach(exportedComponentNames, (n) => {
                try {
                exportedResults[n] = _.filter(exported, (e) => (e.exportAs === n)).pop().data;
                } catch (err) {}
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
