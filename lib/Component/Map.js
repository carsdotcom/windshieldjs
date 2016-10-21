"use strict";
const _ = require('lodash');
const Promise = require('bluebird');
const Component = require('./');
const defaultComponent = require('./default');

function ComponentMap(components) {
    let self = {};

    self.components = {};
    self.rawComponents = components;

    components.default = components.default || defaultComponent;

    function setupDefault() {
        components.default.defaults = {
            componentList: self.listComponents()
        };
    }


    self.init = function (handlebars) {
        var loadPromises = [];

        _.forIn(self.rawComponents, function (raw, name) {
            var comp = Component(raw, name);
            loadPromises.push(comp.loadTemplates(handlebars));
            self.components[name] = comp;
        });

        return Promise.all(loadPromises).then(setupDefault);
    };

    self.getComponent = function (name) {
        let component = self.components[name];

        if(!component){
            return self.components.default;
        }

        return component;
    };

    self.listComponents = function () {
        return Object.keys(self.components);
    };

    return self;

}

module.exports = ComponentMap;