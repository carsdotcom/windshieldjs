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

internals.generateAssociationsResolver = _.memoize(function (rootDir) {
    return function (page) {
        return new Promise(function (resolve, reject) {
            var associationPromiseMap = _.object(_.map(page.associations, internals.generateAssociationsMapper(rootDir)));
            var componentPromises = Promise.all(_.map(associationPromiseMap, function (componentPromises, assocName) {
                return new Promise(function (resolve, reject) {
                    Promise.all(componentPromises).then(function (components) {
                        resolve([assocName, components]);
                    });
                });
            }));
            componentPromises.then(function (associations) {
                _.assign(page.associations, _.object(associations));
                resolve(page);
            });
        });
    };
});

internals.generateAssociationsMapper = _.memoize(function (rootDir) {
    return function (association, assocName) {
        return [ assocName, _.map(association, function (component) {
            var adapter;
            try  {
                adapter = require(path.join(rootDir, internals.paths[component.component], 'adapter'));
            } catch (e) {
                adapter = function () {
                    return new Promise(function (resolve, reject) {
                        logger.error('`' + component.component + '` adapter not found');
                        resolve(component);
                    });
                };
            }
            return adapter(component.context);
        }) ];
    };
});


module.exports = function () {

    var self = this;
    var args = Array.prototype.slice.call(arguments, 0);
    var context;
    var pageAdapter;
    var associationAdapters;

    try {
        internals.paths = internals.paths || require(path.join(self.settings.rootDir, 'app', 'mappings', 'paths.json'));
    } catch (e) {
        internals.paths = {};
    }

    return new Promise(function (resolve, reject) {

        if (!args[1]) reject('You must supply at least two arguments');

        context = args.shift();
        pageAdapter = args.shift();

        if (!args[0]) {

            pageAdapter(context)
                .then(internals.generateAssociationsResolver(self.settings.rootDir))
                .then(resolve);

        } else {

            associationAdapters = _.map(args, function (v) {
                if (typeof v !== 'function') reject('Adapters must be functions');
                return v;
            });

            pageAdapter(context)
                .then(internals.generateAssociationsAssigner(associationAdapters, context))
                .then(internals.generateAssociationsResolver(self.settings.rootDir))
                .then(resolve);
        }
    });
};
