"use strict";

var path = require('path');
var Promise = require('bluebird');
var _ = require('lodash');
var Boom = require('boom');

module.exports = Renderer;

function Renderer(windshield) {
    var options = windshield.options;
    var server = windshield.server;
    return renderer;

    function renderer(reply) {
        function createTemplatePartial(component) {
            var template = (component.template || 'default');
            var templates = (component.templates || {});
            component.component = component.component || 'componentNotFound';
            component.partial = 'partial_' + component.component + '_' + template;
            var filePromise = templates[template] || Promise.reject('default template for ' + component.component + ' not defined.');
            var notFoundPromise = Promise.resolve('<p>Component not found</p>');

            return filePromise.catch(function(e) {
                e.message = 'component template not found.';
                server.log('error', e);
                return notFoundPromise;
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
                partials.forEach(function (data) {
                    options.handlebars.registerPartial(data[0], data[1]);
                });

                var layoutPath = options.paths[data.layout];
                if (layoutPath == null) layoutPath = path.join('layouts', data.layout);

                return reply.view(layoutPath, data);
            });
        };
    }
}
