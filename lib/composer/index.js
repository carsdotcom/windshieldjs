// Load modules

var path = require('path');
var Promise = require('bluebird');
var _ = require('lodash');
var logger = require('../logger');

// Declare internals

var internals = {};

internals.generateAssigner = function (adapters, context) {
    return function (page) {
        page.attributes = page.attributes || {};
        page.associations = page.associations || {};
        return new Promise(function (resolve, reject) {
            adapters.forEach(function (adapter) {
                adapter(context).then(function (assignMe) {
                    _.assign(page.attributes, assignMe.attributes || {});
                    _.assign(page.associations, assignMe.associations || {});
                });
            });
            resolve(page);
        });
    };
};

internals.generateResolver = _.memoize(function (rootDir) {
    return function (page) {
        return new Promise(function (resolve, reject) {
            var promiseMap = _.object(_.map(page.associations, internals.generateMapper(rootDir)));
            var componentPromises = Promise.all(_.map(promiseMap, function (componentPromises, assocName) {
                return new Promise(function (resolve, reject) {
                    Promise.all(componentPromises).then(function (components) {
                        resolve([assocName, components]);
                    }).catch(reject);
                });
            }));
            componentPromises.then(function (associations) {
                _.assign(page.associations, _.object(associations));
                resolve(page);
            }).catch(reject);
        });
    };
});

internals.generateMapper = _.memoize(function (rootDir) {
    return function (association, assocName) {
        return [ assocName, _.map(association, function (component) {

            var adapter,
                Model;

            // try to get adapter
            try  {
                adapter = require(path.join(rootDir, (internals.paths[component.component] || path.join('components', component.component)), 'adapter'));
            } catch (e) {}

            // try to get Model
            try {
                Model = require(path.join(rootDir, (internals.paths[component.component] || path.join('components', component.component)), 'Model'));
            } catch (e) {}


            // if no adapter
            if (typeof adapter !== 'function') {

                // if model
                if (typeof Model === 'function') {

                    // resolve with new model
                    adapter = function (data) {
                        return new Promise(function (resolve, reject) {
                            var component = new Model(data);
                            resolve(component);
                        });
                    };

                // if neither adapter nor model
                } else {

                    // resolve with component data
                    adapter = function () {
                        return new Promise(function (resolve, reject) {
                            logger.error('could not find adapter or Model for `' + component.component + '` component');
                            resolve(component);
                        });
                    };

                }
            }
            return adapter(component.data);
        }) ];
    };
});


module.exports = function () {

    var self = this;
    var args = Array.prototype.slice.call(arguments, 0);
    var context;
    var headAdapter;
    var adapters;

    internals.paths = this.settings.paths;

    return new Promise(function (resolve, reject) {

        if (!args[1]) reject('You must supply at least two arguments');

        context = args.shift();
        headAdapter = args.shift();

        if (!args[0]) {

            headAdapter(context)
                .then(internals.generateResolver(self.settings.rootDir))
                .then(resolve)
                .catch(reject);

        } else {

            adapters = _.map(args, function (v) {
                if (typeof v !== 'function') reject('adapters must be functions');
                return v;
            });

            headAdapter(context)
                .then(internals.generateAssigner(adapters, context))
                .then(internals.generateResolver(self.settings.rootDir))
                .then(resolve)
                .catch(reject);
        }
    });
};
