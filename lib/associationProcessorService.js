"use strict";

/**
 * Created by jcsokolow on 5/3/16.
 */
var _ = require('lodash');
var Promise = require("bluebird");
/**
 * This function processes child associations before parents.
 */
function Component(implementation) {
    this.implementation = implementation;
}

Component.prototype.hasAdapter = function () {
    return _.isFunction(this.implementation.adapter);
};

Component.prototype.runAdapter = function (data, context, request) {
    var result = this.implementation.adapter(data, context, request);

    if (!_.isFunction(result.then)) {
        return Promise.resolve(result);
    } else {
        return result;
    }
};

Component.prototype.hasModel = function () {
    var hasModel = _.isFunction(this.implementation.Model);

    if (hasModel) {
        console.warn("Use of models is Deprecated, please refactor your code to just use an adapter");
    }

    return hasModel;
};


Component.prototype.evaluate = function (definition, context, request) {

    var promise;
    var componentData = definition.data || definition;

    if (this.hasAdapter()) {
        promise = this.runAdapter(componentData, context, request);
    } else if (this.hasModel()) {
        promise = Promise.resolve(new this.implementation.Model(componentData));
    } else {
        promise = Promise.resolve(componentData);
    }

    return promise.then(function (data) {

        var result = {};

        result.data = {
            name: definition.component,
            layout: definition.layout,
            data: data.data || data
        };

        if (_.isObject(data.export)) {
            var exported = {
                data: data.export,
                exportAs: data.exportAs || definition.component
            };
            result.exported = exported;
        }

        // console.log(result);
        return result;
    });

};

function componentProcessor(context, componentDefinition, request, components) {

    var childAssociations = {};
    childAssociations.associationData = {};
    var componentData = componentDefinition.data || {};
    _.defaultsDeep(componentData, childAssociations.associationData);

    var component = new Component(components[componentDefinition.component]);

    function getPackagedComponent() {
        var result = component.evaluate(componentDefinition, context, request);
        result.data = result.data || {};
        result.data.associations = childAssociations.associationData;
        return result;
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
