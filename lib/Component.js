/**
 * Created by jcsokolow on 6/28/16.
 *
 */
var _ = require('lodash');
var Promise = require('bluebird');
var Handlebars = require("handlebars");

function Component(implementation) {
    this.templates = {};
    this.implementation = implementation;
}

Component.prototype.loadTemplates = function () {
    var self = this;
    var compilePromises = [];

    _.forIn(this.implementation.templates || {}, function (loader, assocName) {

        var promise = loader.then(function (templateSrc) {
            self.templates[assocName] = Handlebars.compile(templateSrc);
        });

        compilePromises.push(promise);
    });

    return Promise.all(compilePromises);
};

Component.prototype.renderTemplate = function (name, data) {

    if (this.templates.hasOwnProperty(name)) {
        return this.templates[name](data);
    } else if (this.templates.default) {
        return this.templates.default(data);
    } else {
        return "";
    }


};

Component.prototype.hasAdapter = function () {
    return _.isFunction(this.implementation.adapter);
};

Component.prototype.runAdapter = function (data, context, request) {
    var result = this.implementation.adapter(data, context, request);

    if (!result) {
        return Promise.resolve(null);
    } else if (!_.isFunction(result.then)) {
        return Promise.resolve(result);
    } else {
        return result;
    }
};

Component.prototype.hasModel = function () {
    var hasModel = _.isFunction(this.implementation.Model);

    if (hasModel) {
        console.warn("Use of models is Deprecated, please refactor your code to just use an adapter");
    }

    return hasModel;
};


Component.prototype.evaluate = function (definition, context, request) {

    var promise;
    var componentData = definition.data || {};

    if (this.hasAdapter()) {
        promise = this.runAdapter(componentData, context, request);
    } else if (this.hasModel()) {
        promise = Promise.resolve(new this.implementation.Model(componentData));
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

Component.prototype.render = function (definition, context, request, assocName) {

    var self = this;
    
    return this.evaluate(definition, context, request).then(function (result) {
        result.data.markup = self.renderTemplate(assocName, result.data.data);
        return result;
    });

};


module.exports = Component;