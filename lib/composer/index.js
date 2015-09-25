// Load modules

var path = require('path');
var Promise = require('bluebird');
var _ = require('lodash');

var internals = {};
internals.require = require;

module.exports = function () {

    var self = this;
    var args = Array.prototype.slice.call(arguments, 0);
    var context;
    var headAdapter;
    var adapters;

    function assigner(adapters, context) {
        return function (page) {
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
    }

    function mapper(association, assocName) {
        return [ assocName, _.map(association, function (component) {

            var _adapter;
            var adapter;
            var Model;

            try  {
                // use provided adapter and resolve with given data
                _adapter = internals.require(path.join(self.settings.rootDir, (self.settings.paths[component.component] || path.join('components', component.component)), 'adapter'));
                adapter = function (data) {
                    return new Promise(function (resolve, reject) {
                        _adapter(data).then(function (data) {
                            data.component = component.component;
                            resolve(data);
                        });
                    });
                };
            } catch (e) {
                try {
                    // resolve with new model
                    Model = internals.require(path.join(self.settings.rootDir, (self.settings.paths[component.component] || path.join('components', component.component)), 'Model'));
                    adapter = function (data) {
                        return new Promise(function (resolve, reject) {
                            var inst = new Model(data);
                            inst.component = component.component;
                            resolve(inst);
                        });
                    };
                } catch (e) {
                    // resolve with component data
                    adapter = function () {
                        return new Promise(function (resolve, reject) {
                            resolve(component);
                        });
                    };
                }
            }

            return adapter(component.data);
        }) ];
    }

    function defaulter(page) {
        return new Promise(function (resolve, reject) {
            page.layout = page.layout || 'default';
            page.attributes = page.attributes || {};
            page.associations = page.associations || {};
            resolve(page);
        });
    }

    function resolver(page) {
        return new Promise(function (resolve, reject) {
            var promiseMap = _.object(_.map(page.associations, mapper));
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
    }


    return new Promise(function (resolve, reject) {

        if (!args[1]) reject('You must supply at least two arguments');

        context = args.shift();
        headAdapter = args.shift();

        if (!args[0]) {

            headAdapter(context)
                .then(defaulter)
                .then(resolver)
                .then(resolve)
                .catch(reject);

        } else {

            adapters = _.map(args, function (v) {
                if (typeof v !== 'function') reject('adapters must be functions');
                return v;
            });

            headAdapter(context)
                .then(defaulter)
                .then(assigner(adapters, context))
                .then(resolver)
                .then(resolve)
                .catch(reject);
        }
    });
};
