"use strict";

var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var _ = require('lodash');
var Boom = require('boom');

var readFile = _.memoize(Promise.promisify(fs.readFile, { context: fs }))
module.exports = Renderer;

function Renderer(windshield) {
    var options = windshield.options;
    var server = windshield.server;
    return renderer;

    function renderer(reply) {
        function createTemplatePartial(component) {
            component.component = component.component || 'componentNotFound';

            var componentPath = path.join(
                    self.settings.rootDir,
                    options.paths[component.component] || component.component,
                    'templates',
                    'default.html');

            component.partial = 'partial_' + componentPath.replace(/[^a-zA-Z0-9]/, '');

            var filePromise = readFile(componentPath, 'utf-8');
            var notFoundPromise = readFile(path.join(__dirname, 'componentNotFound.html'), 'utf-8');

            return filePromise.catch(function(e) {
                e.message = 'component template not found. falling back to componentNotFound.html';
                server.log('error', e);
                return notFoundPromise
            }).then(function(source) {
                return Promise.resolve([ component.partial, source ]);
            });
        }

        return function (data) {
            var componentPromises = Object.keys(data.associations)
                .map(function(name) {
                    var component = data.associations[name];
                    return _.map(component, createTemplatePartial);
                })
                .reduce(function(a, b) { return a.concat(b); }, []);

            return Promise.all(componentPromises).then(function (partials) {
                partials.forEach(options.handlebars.registerPartial.bind(options.handlebar));

                var layoutPath = options.paths[data.layout];
                if (layoutPath == null) layoutPath = path.join('layouts', data.layout);

                return reply.view(layoutPath, data);
            });
        };
    };
}
