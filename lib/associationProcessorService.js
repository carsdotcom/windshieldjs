"use strict";

/**
 * Created by jcsokolow on 5/3/16.
 */
var _ = require('lodash');
var Promise = require("bluebird");
/**
 * This function processes child associations before parents.
 */
var Component = require('./Component');

function componentProcessor(context, componentDefinition, request, components) {

    var childAssociations = {};
    childAssociations.associationData = {};
    var componentData = componentDefinition.data || {};
    _.defaultsDeep(componentData, childAssociations.associationData);

    var component = new Component(components[componentDefinition.component]);

    function getPackagedComponent(associations) {
        return component.evaluate(componentDefinition, context, request).then(function (result) {
            result.data = result.data || {};
            if(associations){
                result.data.associations = associations.associationData;
            } else {
                result.data.associations = {};
            }
            // console.log("Component results: ", result);
            return result;
        });

    }

    console.log(componentDefinition);

    if (componentDefinition.associations && _.size(componentDefinition.associations)) {
        return associationIterator(context, request, components, componentDefinition.associations).then(getPackagedComponent);
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
