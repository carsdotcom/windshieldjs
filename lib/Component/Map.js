'use strict';
const _ = require('lodash');
const Promise = require('bluebird');
const Component = require('./');
const defaultComponent = require('./default');

module.exports = ComponentMap;

function ComponentMap(components) {

    let componentMap = {};

    componentMap.components = {};
    componentMap.rawComponents = components;

    components.default = components.default || defaultComponent;

    function setupDefault() {
        components.default.defaults = {
            componentList: componentMap.listComponents()
        };
    }

    componentMap.init = function (handlebars) {

        let loadPromises = [];

        _.forIn(componentMap.rawComponents, function (raw, name) {
            let comp = Component(raw, name);
            loadPromises.push(comp.loadTemplates(handlebars));
            componentMap.components[name] = comp;
        });

        return Promise.all(loadPromises).then(setupDefault);
    };

    componentMap.getComponent = function (name) {

        let component = componentMap.components[name];

        if(!component){
            return componentMap.components.default;
        }

        return component;
    };

    componentMap.listComponents = function () {
        return Object.keys(componentMap.components);
    };

    return componentMap;

}
