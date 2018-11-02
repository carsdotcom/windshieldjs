'use strict';
const Promise = require('bluebird');
const Component = require('./');
const defaultComponent = require('./default');

module.exports = ComponentMap;


/**
 *
 * @param {Object.<string, ComponentConfig>} componentsConfig
 * @returns {ComponentMap}
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

    componentMap.init = async function (handlebars) {

        let names = Object.keys(componentMap.rawComponents);

        await Promise.map(names, name => {
            let raw = componentMap.rawComponents[name];

            let comp = Component(raw, name);
            componentMap.components[name] = comp;
            return comp.loadTemplates(handlebars);
        });

        setupDefault();

        return null;
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

    /**
     * Creates a factory function that renders components for a Windshield request
     *
     * @param {module:processRoutes.Context} context - Windshield route context
     * @param {Request} request - Hapi request object
     *
     * @returns {componentFactory}
     */
    componentMap.composeFactory = function (context, request) {

        /**
         * @function componentFactory
         * @param {ComponentDefinition} definition - Config for a Windshield Component
         * @returns {Promise.<RenderedComponent>}
         */
        return async function componentFactory(definition) {
            let component = componentMap.getComponent(definition.component);
            return component.render(definition, context, request);
        };
    };


    return componentMap;

}
