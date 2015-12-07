"use strict";

var path = require('path');
var Promise = require('bluebird');
var _ = require('lodash');

var internals = {};
internals.require = require;

// TODO: pass adapters as array, don't do this...
module.exports = function (...args) {

    var self = this;
    var context;
    var headAdapter;
    var adapters;

    function assigner(adapters, context) {
        return function (page) {

            var adapterPromises = [];

            adapters.forEach(function (adapter) {
                adapterPromises.push(adapter(context).then(function (assignMe) {
                    _.assign(page.attributes, assignMe.attributes || {});
                    _.assign(page.associations, assignMe.associations || {});
                }));
            });

            return Promise.all(adapterPromises).then(function () {
                return page;
            });
        };
    }

    function mapper(page) {
        return function (association, assocName) {
            return [assocName, _.map(association, function (component) {

                var _adapter;
                var adapter;
                var Model;
                var _promise;

                try {
                    // use provided adapter and resolve with given data
                    _adapter = internals.require(path.join(self.settings.rootDir, (self.settings.paths[component.component] || path.join('components', component.component)), 'adapter'));
                    adapter = function (data) {

                        if (_adapter.length <= 1) {
                            _promise = _adapter(data);
                        } else if (_adapter.length === 2) {
                            _promise = _adapter(data, _.cloneDeep(page));
                        } else if (_adapter.length === 3) {
                            _promise = _adapter(data, _.cloneDeep(page), _.cloneDeep(context));
                        }

                        return _promise.then(function (data) {
                            data.component = component.component;
                            return data;
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
            })];
        };
    }

    function defaulter(page) {
        page.layout = page.layout || 'default';
        page.attributes = page.attributes || {};
        page.associations = page.associations || {};
        return page;
    }

    function resolver(page) {
        return new Promise(function (resolve, reject) {

            var promiseMap = _.object(_.map(page.associations, mapper(page)));
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
