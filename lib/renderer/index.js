// Load modules

var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var _ = require('lodash');
var shortid = require('shortid');
var handlebars = require('handlebars');
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

        if (component.component) {
            if (self.settings.paths[component.component]) {
                componentPath = path.join(self.settings.rootDir, self.settings.paths[component.component], 'templates', 'default.html');
            } else {
                componentPath = path.join(self.settings.rootDir, 'components', component.component, 'templates', 'default.html');
            }
        } else {
            self.server.log("`" + component.component + "` component not found.", { error: true });
            componentPath = path.join(__dirname, 'notFound.html');
        }
        component.partial = 'partial_' + componentPath.replace(/[^a-zA-Z0-9]/, '');

        filePromise = internals.cachedFilePromise(componentPath, 'utf-8');
        notFoundPromise = internals.cachedFilePromise(path.join(__dirname, 'notFound.html'), 'utf-8');

        return new Promise(function (resolve, reject) {
            function logError(e) {
                self.server.log('component template not found. falling back to notFound.html', { error: true, rejectionError: e });
            };
            function resolver(source) {
                resolve(_.partial(composeTupel, component.partial)(source));
            };
            function catchFileError(e) {
                logError(e);
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

        if (!data.layout) self.server.error("Page definition is missing `layout` property. Here's the object that was passed to renderer: " + JSON.stringify(data), { error: true });

        _.forEach(data.associations, function (component) {
            componentPromises = componentPromises.concat(_.map(component, createTemplatePartial));
        });

        return Promise.all(componentPromises).then(function (partials) {
            var layoutPath;

            _.forEach(partials, function (partial) {
                handlebars.registerPartial.apply(handlebars, partial);
            });

            layoutPath = self.settings.paths[data.layout];
            if (layoutPath == null) layoutPath = data.layout ? path.join('layouts', data.layout) : path.join('layouts', 'default');

            return reply.view(layoutPath, data);

        }).catch(function (err) {
            self.server.log(err, { error: true });
        });
    };
};
