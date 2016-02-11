"use strict";
var _ = require("lodash");
var fs = require('fs');
var path = require('path');
var Hoek = require('hoek');
var handlebars = require('handlebars');

var Composer = require('./composer');
var Renderer = require('./renderer');
var Router = require('./router');

function registerPartialForComponent(handlebars, componentName, component){

    var promises = _.map(component.templates || {}, function (templatePromise, templateName) {

        return templatePromise.then(function (source) {
            handlebars.registerPartial('partial_' + componentName + '_' + templateName, source);
        });

    });

    return Promise.all(promises);
}

function registerPartials(handlebars, components){
    var partialPromises = _.map(components, function (component, name) {
        return registerPartialForComponent(handlebars, name, component);
    });

    return Promise.all(partialPromises);
}

module.exports.register = function register(server, options, next) {

    var routes = options.routes;
    var rootDir = options.rootDir;
    var handlebars = options.handlebars;
    var uriContext = options.uriContext;
    var components = options.components;

    server.log(['info', 'windshield'], 'application directory identified as: ' + options.rootDir);

    handlebars.registerHelper('assoc', function (name, options) {
        var page = this;
        var assoc = this.associations;
        if (assoc && assoc[name]) {
            var html =  assoc[name].map(function (a) {
                var template = handlebars.compile(handlebars.partials[a.partial] || '');
                var context = a;
                context.root = page;
                return template(context);
            }).join("\n");
            return new handlebars.SafeString(html);
        }
    });

    try {
        server.views({
            engines: { html: handlebars },
            relativeTo: rootDir,
            path: './',
            helpersPath: 'helpers'
        });
    } catch (err) {
        return next(err);
    }

    var windshield = {
        server: server,
        options: options
    };

    windshield.composer = Composer(windshield);
    windshield.renderer = Renderer(windshield);
    windshield.router = Router(windshield);

    registerPartials(handlebars, components).then(function () {
        next();
    });
};

module.exports.register.attributes = {
    pkg: require('../package.json')
};

module.exports.readTemplate = require('./readTemplate');
