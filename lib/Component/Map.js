'use strict';
const _ = require('lodash');
const Promise = require('bluebird');
const Component = require('./');
const defaultComponent = require('./default');

module.exports = ComponentMap;


/**
 *
 * @param {Object.<string, ComponentConfig>} componentsConfig
 * @returns {{}}
 * @constructor
 */
function ComponentMap(componentsConfig) {

    let componentMap = {};

    componentMap.components = {};
    componentMap.rawComponents = componentsConfig;

    componentsConfig.default = componentsConfig.default || defaultComponent;

    function setupDefault() {
        componentsConfig.default.defaults = {
            componentList: componentMap.listComponents()
        };
    }

    componentMap.init = function (handlebars) {

        let names = Object.keys(componentMap.rawComponents);

        return Promise.map(names, name => {
            let raw = componentMap.rawComponents[name];

            let comp = Component(raw, name);
            componentMap.components[name] = comp;
            return comp.loadTemplates(handlebars);
        })
            .then(setupDefault);
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
