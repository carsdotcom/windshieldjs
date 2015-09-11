// Load modules

var path = require('path');
var Promise = require('bluebird');
var _ = require('lodash');
var logger = require('../logger');

// Declare internals

var internals = {};

internals.generateAssociationsAssigner = function (associationAdapters, context) {
    return function (page) {
        return new Promise(function (resolve, reject) {
            associationAdapters.forEach(function (assocAdapter) {
                assocAdapter(context).then(function (associations) {
                    _.assign(page.associations, associations);
                });
            });
            resolve(page);
        });
    };
};

module.exports = function () {

    var self = this;
    var args = Array.prototype.slice.call(arguments, 0);
    var context;
    var pageAdapter;
    var associationAdapters;
    var assignAssociations;

    internals.paths = internals.paths || require(path.join(self.settings.rootDir, 'app', 'mappings', 'paths.json'));

    var mapAssocToComponentAdapters = function (assoc, name) {
        return [name, _.map(assoc, function (component) {
            var adapter;
            try  {
                adapter = require(path.join(self.settings.rootDir, internals.paths[component.component], 'adapter'));
            } catch (e) {
                adapter = function () {
                    return new Promise(function (resolve, reject) {
                        //reject('`' + component.component + '` adapter not found');
                        logger.error('`' + component.component + '` adapter not found');
                        resolve(component);
                    });
                };
            }
            return adapter(component.context);
        })];
    };

    return new Promise(function (resolve, reject) {

        if (!args[1]) reject('You must supply at least two arguments');

        context = args.shift();
        pageAdapter = args.shift();

        if (!args[0]) {

            pageAdapter(context).then(function (page) {
                var associationPromises = _.object(_.map(page.associations, mapAssocToComponentAdapters));
                var all = Promise.all(_.map(associationPromises, function (componentPromises, name) {
                    return new Promise(function (resolve, reject) {
                        Promise.all(componentPromises).then(function (components) {
                            resolve([name, components]);
                        });
                    });
                }));
                all.then(function (associations) {
                    _.assign(page.associations, _.object(associations));
                    resolve(page);
                });
            });

        } else {

            associationAdapters = _.map(args, function (v) {
                if (typeof v !== 'function') reject('Adapters must be functions');
                return v;
            });

            assignAssociations = internals.generateAssociationsAssigner(associationAdapters, context);

            pageAdapter(context).then(assignAssociations).then(function (page) {
                var associationPromises = _.object(_.map(page.associations, mapAssocToComponentAdapters));
                var all = Promise.all(_.map(associationPromises, function (componentPromises, name) {
                    return new Promise(function (resolve, reject) {
                        Promise.all(componentPromises).then(function (components) {
                            resolve([name, components]);
                        });
                    });
                }));
                all.then(function (associations) {
                    _.assign(page.associations, _.object(associations));
                    resolve(page);
                });
            });
        }
    });
};
