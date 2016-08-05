"use strict";

/**
 * Created by jcsokolow on 5/3/16.
 */
var _ = require('lodash');
var Promise = require("bluebird");
var ComponentMap = require('./ComponentMap');
var AssociationList = require("./AssociationList");
/**
 * This function processes child associations before parents.
 */
var Component = require('./Component');

function componentProcessor(context, componentDefinition, request, components) {

    var component = new Component(components[componentDefinition.component]);

    function getPackagedComponent(associations) {
        componentDefinition.data = componentDefinition.data || {};

        if (associations){
            componentDefinition.data.associations = componentDefinition.data.associations || {};
            _.defaultsDeep(componentDefinition.data.associations, associations.associationData);
        }

        return component.evaluate(componentDefinition, context, request).then(function (result) {
            result.data = result.data || {};
            if(associations){
                result.data.associations = associations.associationData;
            } else {
                result.data.associations = {};
            }
            return result;
        });

    }

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

    // console.log("context: ", context);
    // console.log("associations: ", associations);
    // console.log("components: ", components);
    var componentMap = ComponentMap(components);

    return componentMap.init().then(function () {
        var associationList = AssociationList(associations);
        return associationList.evaluate(context, request, componentMap);
    }).then(function (result) {
        // console.log("Association processor result", JSON.stringify(result, null, 4));
        return result;
    });




    // var associationResults = {};
    // var exportedResults = {};
    //
    // var associationPromises = _.map(associations, function (association, name) {
    //     return associationProcessor(context, association, request, components).then(function (packagedData) {
    //         var exported = _.filter(packagedData, 'exported');
    //         var exportedComponentNames = _.map(exported, (v) => v.exported.exportAs);
    //         associationResults[name] = _.map(packagedData, 'data');
    //         _.forEach(exportedComponentNames, (n) => {
    //             let filtered = _.filter(exported, function (e) {
    //                 return (e.exported.exportAs === n);
    //             });
    //             let last = filtered.pop();
    //             if (_.isObject(last) && _.isObject(last.exported)) {
    //                 exportedResults[n] = last.exported.data;
    //             }
    //         });
    //     });
    // });
    //
    // return Promise.all(associationPromises).then(function () {
    //     return {
    //         associationData: associationResults,
    //         exportedData: exportedResults
    //     };
    // }).then(function (result) {
    //     // console.log("result", result);
    //     return result;
    // });


}

module.exports.runAssociationIterator = associationIterator;
