"use strict";

var path = require('path');
var Promise = require('bluebird');
var _ = require('lodash');

module.exports = Composer;

function Composer(windshield) {
    var options = windshield.options;

    return composer;

    function composer(context, adapters) {
        return Promise
                .map(adapters, run)
                .each(assign)
                .then(resolver);

        function run(adapter) {
            return adapter(context);
        }

        function assign(toAssign) {
            _.merge(context, toAssign);
        }

        function resolver() {
            var associations = context.associations;
            return Promise.all(Object.keys(associations).map(function(assocName) {
                var associationPromises = associations[assocName].map(processComponent(context));
                return Promise.all(associationPromises)
                    .then(function(components) {
                        _.assign(associations[assocName], components);
                    });
            })).then(function() { return Promise.resolve(context); });
        }
    };


    function processComponent(context) {
        return function (component) {
            var componentPath = path.join(
                options.rootDir,
                (options.paths[component.component] || path.join('components', component.component))
            );

            var componentModule = tryRequire(path.join(componentPath));
            var adapter = componentModule.adapter || null;
            var Model = componentModule.Model || null;
            var templates = componentModule.templates || {};

            var promise;
            if (adapter) {
                if (adapter.length <= 1) {
                    promise = adapter(component.data);
                } else if (adapter.length === 2) {
                    promise = adapter(component.data, _.cloneDeep(context));
                }
            } else if (Model) {
                promise = Promise.resolve(new Model(component.data));
            } else {
                promise = Promise.resolve(component);
            }

            return promise.then(function (data) {
                data.component = component.component;
                data.templates = templates;
                return data;
            });
        };
    }
}

function tryRequire(path) {
    try {
        return require(path);
    } catch (e) {
        return null;
    }
}