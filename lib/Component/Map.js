'use strict';
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

    const componentMap = {};

    componentMap.components = {};
    componentMap.rawComponents = componentsConfig;

    componentsConfig.default = componentsConfig.default || defaultComponent;

    function setupDefault() {
        componentsConfig.default.defaults = {
            componentList: componentMap.listComponents()
        };
    }

    componentMap.init = async function (handlebars) {

        const rawComponentEntries = Object.entries(componentMap.rawComponents);

        const loadTemplatePromises = rawComponentEntries.map(([compName, config]) => {
            const comp = Component(config, compName);
            componentMap.components[compName] = comp;
            return comp.loadTemplates(handlebars);
        });

        await Promise.all(loadTemplatePromises);

        setupDefault();

        return null;
    };

    componentMap.getComponent = function (name) {

        const component = componentMap.components[name];

        if(!component) {
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
         * @async
         * @function componentFactory
         * @param {ComponentDefinition} definition - Config for a Windshield Component
         * @returns {Promise.<RenderedComponent>}
         */
        return async function componentFactory(definition) {
            const component = componentMap.getComponent(definition.component);
            return component.render(definition, context, request);
        };
    };


    return componentMap;

}
