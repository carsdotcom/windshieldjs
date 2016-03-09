"use strict";

var path = require('path');
var Promise = require('bluebird');
var _ = require('lodash');
var Joi = require('joi');

module.exports = Composer;

var optionsSchema = Joi.object().keys({
    components: Joi.object().default({})
});

function packageComponent(name, data, associations) {
    data.associations = associations;

    return {
        name,
        data
    };
}

function componentProcessor(context, moduleAttrs, request, modules) {

    var moduleImpl = modules[moduleAttrs.component] || {};
    var componentData = moduleAttrs.data || moduleAttrs;
    var adapter = moduleImpl.adapter || null;
    var Model = moduleImpl.Model || null;

    var promise;

    if (adapter) {
        promise = adapter(componentData, context, request);
    } else if (Model) {
        promise = Promise.resolve(new Model(componentData));
    } else {
        promise = Promise.resolve(componentData);
    }

    return promise.then(function (data) {
        return associationIterator(context, request, modules, moduleAttrs.associations || []).then(function (associations) {
            var packagedComponent = packageComponent(moduleAttrs.component, data, associations);

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

function associationIterator(context, request, modules, associations) {

    var associationResults = {};

    var associationPromises = _.map(associations, function (association, name) {
        return associationProcessor(context, association, request, modules).then(function (associationData) {
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

    var moduleImpls = options.components;

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
                    return associationIterator(context, request, moduleImpls, context.associations).then(function (thePage) {
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
