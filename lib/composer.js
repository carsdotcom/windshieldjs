"use strict";

var path = require('path');
var Promise = require('bluebird');
var _ = require('lodash');
var Joi = require('joi');

module.exports = Composer;

var optionsSchema = Joi.object().keys({
    components: Joi.object().default({})
});

function Composer(windshield) {
    var options = _.pick(windshield.options, 'components');
    var validation = Joi.validate(options, optionsSchema);
    if (validation.error) throw validation.error;

    return composer;

    function composer(request) {
        var context = _.cloneDeep(request.route.settings.app.context);
        var adapters = request.route.settings.app.adapters;

        return Promise
                .map(adapters, run)
                .each(assign)
                .then(resolver);

        function run(adapter) {
            return adapter(context, request);
        }

        function assign(toAssign) {
            _.merge(context, toAssign);
        }

        function resolver() {
            return Promise.all(Object.keys(context.associations).map(_.partial(associationProcessor, context)))
                .then(function () {
                    if (process.env.WINDSHIELD_DEBUG) windshield.server.log('info', JSON.stringify(context, null, 4));
                    return context;
                });
        }

        function associationProcessor(context, assocName) {
            var associationPromises = context.associations[assocName].map(generateComponentProcessor(context));
            return Promise.all(associationPromises)
                .then((components) => context.associations[assocName] = components);
        }

        function packageComponent(componentName, data) {
            return {
                component: componentName,
                data: data
            };
        }

        function generateComponentProcessor(context) {

            return function componentProcessor(component) {
                var componentModule = options.components[component.component] || {};
                var componentData = component.data || component;
                var adapter = componentModule.adapter || null;
                var Model = componentModule.Model || null;

                var promise;

                if (adapter) {
                    promise = adapter(componentData, context, request);
                } else if (Model) {
                    promise = Promise.resolve(new Model(componentData));
                } else {
                    promise = Promise.resolve(componentData);
                }

                // process nested components
                if (componentData.associations) {
                    return Promise.all(Object.keys(componentData.associations).map(_.partial(associationProcessor, componentData)))
                        .then(() => promise.then(_.partial(packageComponent, component.component)));
                } else {
                    return promise.then(_.partial(packageComponent, component.component));
                }

            };
        }
    }
}
