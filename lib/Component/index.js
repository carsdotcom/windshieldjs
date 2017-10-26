'use strict';
const _ = require('lodash');
const Promise = require('bluebird');

module.exports = Component;

function Component(implementation, componentName) {

    let component = {
        implementation
    };
    let thisHandlebars;
    let templates = {};

    component.loadTemplates = function (handlebars) {

        let compilePromises = [];
        thisHandlebars = handlebars;
        _.forIn(implementation.templates || {}, function (loader, assocName) {

            let promise = loader.then(function (templateSrc) {
                templates[assocName] = thisHandlebars.compile(templateSrc);
            });

            compilePromises.push(promise);
        });

        _.forIn(implementation.partials || {}, function (loader, name) {
            let promise = loader.then(function (templateSrc) {
                console.log("Registering partial: ", componentName + "." + name);
                handlebars.registerPartial(componentName + "." + name, templateSrc);
            });

            compilePromises.push(promise);
        });

        return Promise.all(compilePromises);
    };

    component.renderTemplate = function (name, data) {

        if (templates.hasOwnProperty(name)) {
            return templates[name](data);
        } else if (templates.default) {
            return templates.default(data);
        } else {
            return "";
        }

    };

    component.hasAdapter = function () {
        return _.isFunction(implementation.adapter);
    };

    component.runAdapter = function (data, context, request) {
        let result = implementation.adapter(data, context, request);

        if (!result) {
            return Promise.resolve(null);
        } else if (!_.isFunction(result.then)) {
            return Promise.resolve(result);
        } else {
            return result;
        }
    };

    component.hasModel = function () {
        let hasModel = _.isFunction(implementation.Model);

        if (hasModel) {
            console.warn("Use of models is Deprecated, please refactor your code to just use an adapter");
        }

        return hasModel;
    };

    component.evaluate = function (definition, context, request, calledName) {

        let promise;
        let componentData = _.merge({}, definition.data, implementation.defaults, {componentName, calledName});

        if(definition.associations){
            componentData = _.merge(componentData, {
                exported: definition.associations.exported
            });
        }

        if (component.hasAdapter()) {
            promise = component.runAdapter(componentData, context, request);
        } else if (component.hasModel()) {
            promise = Promise.resolve(new implementation.Model(componentData));
        } else {
            promise = Promise.resolve(componentData);
        }

        return promise.then(function (data) {

            let result = {};
            data = data || {};

            result.data = {
                name: definition.component,
                layout: definition.layout,
                data: data.data || data || {}
            };

            if (_.isObject(data.export)) {
                let exported = {
                    data: data.export,
                    exportAs: data.exportAs || definition.component
                };
                result.exported = exported;
            }

            return result;
        });
    };

    component.render = function (definition, context, request, assocName, calledName) {

        return component.evaluate(definition, context, request, calledName).then(function (result) {

            let data = result.data.data;
            let layoutName = definition.layout || assocName;

            if (definition && definition.associations) {

                data.exported = definition.associations.exported || {};
                data.assoc = definition.associations.markup;
            } else {
                data.exports = {};
                data.assoc = {};
            }

            let exported = {};
            let markup = component.renderTemplate(layoutName, data);

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

    return component;
}
