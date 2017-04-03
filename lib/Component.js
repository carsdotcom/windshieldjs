/**
 * Created by jcsokolow on 6/28/16.
 *
 */
"use strict";
var _ = require('lodash');
var Promise = require('bluebird');

function Component(implementation, componentName) {
    var thisHandlebars;
    var self = {};
    self.implementation = implementation;
    var templates = {};

    self.loadTemplates = function (handlebars) {
        var compilePromises = [];
        thisHandlebars = handlebars;
        _.forIn(implementation.templates || {}, function (loader, assocName) {

            var promise = loader.then(function (templateSrc) {
                templates[assocName] = thisHandlebars.compile(templateSrc);
            });

            compilePromises.push(promise);
        });

        _.forIn(implementation.partials || {}, function (loader, name) {
            var promise = loader.then(function (templateSrc) {
                console.log("Registering partial: ", componentName + "." + name);
                handlebars.registerPartial(componentName + "." + name, templateSrc);
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
        var componentData = _.merge({}, definition.data || {});

        if(definition.associations){
            componentData = _.merge(componentData, {
                exported: definition.associations.exported
            });
        }

        // if(componentName === 'mmyReviews'){
        //     console.log('definition: ', definition);
        // }


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
            var layoutName = definition.layout || assocName;



            if (definition && definition.associations) {

                data.exported = definition.associations.exported || {};
                data.assoc = definition.associations.markup;
            } else {
                data.exports = {};
                data.assoc = {};
            }


            let exported = {};
            let markup = self.renderTemplate(layoutName, data);

            if(result.exported){
                if(result.exported.exportAs){
                    exported[result.exported.exportAs] = result.exported.data;
                } else {
                    exported[componentName] = result.exported.data;
                }
            }

            return {
                markup,
                exported
            };

        }).catch(function (e) {
            if(e) {
                return {
                    markup: "<!-- Component failed to render " + e.message  + "-->"
                };
            } else {
                return {
                    markup: "<!-- Component failed to render -->"
                };
            }
        });

    };


    return self;
}


module.exports = Component;