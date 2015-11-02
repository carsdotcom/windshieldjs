// Load modules

var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var _ = require('lodash');
var Boom = require('boom');

var internals = {
    cachedFilePromise: _.memoize(Promise.promisify(fs.readFile))
};

module.exports = function (reply) {

    var self = this;

    function composeTupel(name, source) {
        return new Promise(function (resolve, reject) {
            resolve([ name, source ]);
        });
    }

    function createTemplatePartial(component) {
        var componentPath;
        var filePromise;
        var notFoundPromise;

        component.component = component.component || 'notFound';

        if (self.settings.paths[component.component]) {
            componentPath = path.join(self.settings.rootDir, self.settings.paths[component.component], 'templates', 'default.html');
        } else {
            componentPath = path.join(self.settings.rootDir, 'components', component.component, 'templates', 'default.html');
        }

        component.partial = 'partial_' + componentPath.replace(/[^a-zA-Z0-9]/, '');

        filePromise = internals.cachedFilePromise(componentPath, 'utf-8');
        notFoundPromise = internals.cachedFilePromise(path.join(__dirname, 'notFound.html'), 'utf-8');

        return new Promise(function (resolve, reject) {
            function resolver(source) {
                resolve(_.partial(composeTupel, component.partial)(source));
            };
            function catchFileError(e) {
                self.server.log('error', 'component template not found. falling back to notFound.html');
                notFoundPromise
                    .then(resolver)
                    .catch(reject);
            };
            filePromise.then(resolver)
                .catch(catchFileError);
        });
    }

    return function (data) {
        var componentPromises = [];

        _.forEach(data.associations, function (component) {
            componentPromises = componentPromises.concat(_.map(component, createTemplatePartial));
        });

        return Promise.all(componentPromises).then(function (partials) {
            var layoutPath;

            _.forEach(partials, function (partial) {
                self.handlebars.registerPartial.apply(self.handlebars, partial);
            });

            layoutPath = self.settings.paths[data.layout];
            if (layoutPath == null) layoutPath = path.join('layouts', data.layout);

            return reply.view(layoutPath, data);

        }).catch(function (err) {
            self.server.log('error', err);
        });
    };
};
