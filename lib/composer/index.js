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
                var associationPromises = associations[assocName].map(processComponent);
                return Promise.all(associationPromises)
                    .then(function(components) {;
                        _.assign(associations[assocName], components);
                    });
            })).then(function() { return Promise.resolve(context); });
        }
    };

    function processComponent(component) {
        var basePath = path.join(
            options.rootDir,
            (options.paths[component.component] || path.join('components', component.component))
        );

        // TODO this should have been required and cached when the route was
        // loaded, not when it iss being handled also, in that case, that
        // should be done is not a tryRequire but a fs.existsSync
        var adapter = tryRequire(path.join(basePath, 'adapter'));
        var Model = tryRequire(path.join(basePath, 'Model'));

        var promise;
        if (adapter) {
            if (adapter.length <= 1) {
                promise = adapter(component.data);
            } else if (adapter.length === 2) {
                promise = adapter(component.data, _.cloneDeep(page));
            } else if (adapter.length === 3) {
                promise = adapter(component.data, _.cloneDeep(page), _.cloneDeep(context));
            }
        } else if (Model) {
            promise = Promise.resolve(new Model(component.data));
        } else {
            promise = Promise.resolve(component);
        }

        return promise.then(function (data) {
            data.component = component.component;
            return data;
        });
    }
}

function tryRequire(path) {
    try { return require(path); }
    catch(e) { return null; }
}
