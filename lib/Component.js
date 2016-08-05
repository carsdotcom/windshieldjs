/**
 * Created by jcsokolow on 6/28/16.
 *
 */
var _ = require('lodash');
var Promise = require('bluebird');
var Handlebars = require("handlebars");

function Component(implementation) {
    var self = {};
    self.implementation = implementation;
    var templates = {};

    self.loadTemplates = function () {
        var compilePromises = [];

        _.forIn(implementation.templates || {}, function (loader, assocName) {

            var promise = loader.then(function (templateSrc) {
                templates[assocName] = Handlebars.compile(templateSrc);
            });

            compilePromises.push(promise);
        });

        return Promise.all(compilePromises);
    };

    self.renderTemplate = function (name, data) {

        if (templates.hasOwnProperty(name)) {
            return templates[name](data);
        } else if (templates.default) {
            return templates.default(data);
        } else {
            return "";
        }

    };

    self.hasAdapter = function () {
        return _.isFunction(implementation.adapter);
    };

    self.runAdapter = function (data, context, request) {
        var result = implementation.adapter(data, context, request);

        if (!result) {
            return Promise.resolve(null);
        } else if (!_.isFunction(result.then)) {
            return Promise.resolve(result);
        } else {
            return result;
        }
    };

    self.hasModel = function () {
        var hasModel = _.isFunction(implementation.Model);

        if (hasModel) {
            console.warn("Use of models is Deprecated, please refactor your code to just use an adapter");
        }

        return hasModel;
    };

    self.evaluate = function (definition, context, request) {

        var promise;
        var componentData = definition.data || {};

        if (self.hasAdapter()) {
            promise = self.runAdapter(componentData, context, request);
        } else if (self.hasModel()) {
            promise = Promise.resolve(new implementation.Model(componentData));
        } else {
            promise = Promise.resolve(componentData);
        }

        return promise.then(function (data) {

            var result = {};
            data = data || {};

            result.data = {
                name: definition.component,
                layout: definition.layout,
                data: data.data || data || {}
            };

            if (_.isObject(data.export)) {
                var exported = {
                    data: data.export,
                    exportAs: data.exportAs || definition.component
                };
                result.exported = exported;
            }

            // console.log(result);
            return result;
        });

    };

    self.render = function (definition, context, request, assocName) {

        return self.evaluate(definition, context, request).then(function (result) {

            var data = result.data.data;
            data.exported = definition.associations.exported;
            data.assoc = definition.associations.markup;

            return {
                markup: self.renderTemplate(assocName, data),
                exported: result.exported
            };

        }).catch(function (e) {
            return {
                markup: "Component failed to render " + e.message
            }
        });

    };


    return self;
}


module.exports = Component;