"use strict";

var path = require('path');
var Promise = require('bluebird');
var _ = require('lodash');
var Joi = require('joi');

module.exports = Composer;

var optionsSchema = Joi.object().keys({
    components: Joi.object().default({})
});

function packageComponent(componentName, data, associations) {
    data.associations = associations;
    return {
        component: componentName,
        data
    };
}

function componentProcessor(context, moduleDescription, request, moduleImplementations) {

    var moduleImplementation = moduleImplementations[moduleDescription.component] || {};
    var componentData = moduleDescription.data || moduleDescription;
    var adapter = moduleImplementation.adapter || null;
    var Model = moduleImplementation.Model || null;

    var promise;

    if (adapter) {
        promise = adapter(componentData, context, request);
    } else if (Model) {
        promise = Promise.resolve(new Model(componentData));
    } else {
        promise = Promise.resolve(componentData);
    }

    return promise.then(function (data) {
        return getTheMethodThatExecutesAllTheComponentAdaptersByAssociaton(context, request, moduleImplementations)(moduleDescription.associations || []).then(function (associations) {
            var packagedComponent = packageComponent(moduleDescription.component, data, associations);

            //console.log("the component: ", packagedComponent);
            return packagedComponent;
        });
    });


}

function associationProcessor(context, associationModules, request, moduleImplementations) {

    // An association is an array of component descriptions
    var modulePromises = _.map(associationModules, function (module) {
        return componentProcessor(context, module, request, moduleImplementations);
    });

    return Promise.all(modulePromises);
}

function getTheMethodThatExecutesAllTheComponentAdaptersByAssociaton(context, request, moduleImplementations) {
    return function (associations) {

        var associationResults = {};

        var associationPromises = _.map(associations, function (association, name) {
            return associationProcessor(context, association, request, moduleImplementations).then(function (associationData) {
                //return {
                //    name: name,
                //    data: associationData
                //}
                associationResults[name] = associationData;
            });
        });

        return Promise.all(associationPromises).then(function () {
            return associationResults;
        });
    };
}


function Composer(windshield) {

    var options = _.pick(windshield.options, 'components');
    var validation = Joi.validate(options, optionsSchema);
    if (validation.error) throw validation.error;

    var moduleImplementations = options.components;

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
                .then(function () {
                    return getTheMethodThatExecutesAllTheComponentAdaptersByAssociaton(
                        context, request, moduleImplementations)(context.associations).then(function (thePage) {
                        //console.log("thePage: ", JSON.stringify(thePage, null, 4));
                        return {
                            associations: thePage,
                            layout: context.layout,
                            attributes: context.attributes
                        };
                    });
                });

        function run(adapter) {
            return adapter(context, request);
        }

        function assign(toAssign) {
            _.merge(context, toAssign);
        }



    }
}
