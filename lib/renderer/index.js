// Load modules

var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var _ = require('lodash');
var shortid = require('shortid');
var handlebars = require('handlebars');
var logger = require('../logger');

// Delcare internals

var internals = {
    cachedFilePromise: _.memoize(Promise.promisify(fs.readFile))
};

module.exports = function (reply) {

    var self = this;

    internals.paths = this.settings.paths;

    function composeTupel(name, source) {
        return new Promise(function (resolve, reject) {
            resolve([ name, source ]);
        });
    }

    function createTemplatePartial(component) {
        var componentPath = internals.paths[component.component] || path.join('components', component.component),
            filePromise;

        component.partial = 'partial' + shortid.generate();

        filePromise = internals.cachedFilePromise(path.join(self.settings.rootDir, componentPath, 'templates', 'default.html'), 'utf-8');

        return new Promise(function (resolve, reject) {
            filePromise.then(function (source) {
                resolve(_.partial(composeTupel, component.partial)(source));
            }).catch(function (e) {
                logger.error("`" + component.component + "` component not found.");
                internals.cachedFilePromise(path.join(__dirname, 'notFound.html'), 'utf-8').then(function (source) {
                    resolve(_.partial(composeTupel, component.partial)(source));
                });
            });
        });
    }

    return function (data) {
        var componentPromises = [];

        _.forEach(data.associations, function (component) {
            componentPromises = componentPromises.concat(_.map(component, createTemplatePartial));
        });

        return Promise.all(componentPromises).then(function (partials) {
            var layoutPath = internals.paths[data.layout] || path.join('layouts', data.layout);
            _.forEach(partials, function (partial) {
                handlebars.registerPartial.apply(handlebars, partial);
            });
            reply.view(layoutPath, data);
        });
    };
};
