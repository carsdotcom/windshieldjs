'use strict';
const _ = require('lodash');
const Promise = require('bluebird');

/**
 * Renders a schema of Windshield component definitions into a schema of
 * rendered Windshield components.
 *
 * This method traverses the scheme, processing each component definition using
 * the same rendering method.  A component definition may contain an associations
 * property, whose value is a hashmap containing arrays of child definitions.
 *
 * @param {Object.<string, ComponentDefinition[]>} definitionMap - hashmap of arrays of component definitions
 * @param {componentFactory} renderComponent - The renderer function that will be used to render every component.
 *
 * @returns {Promise.<RenderedComponentCollection>}
 */
function renderComponentSchema(definitionMap, renderComponent) {
    /**
     * Renders a single Windshield component definition into a rendered
     * component object
     *
     * @param {string} definitionGroupName - Name of the association that contains the component
     * @param {ComponentDefinition} definition - Config for a Windshield Component
     *
     * @return {Promise.<RenderedComponent>}
     */
    function renderOneComponent(definitionGroupName, definition) {

        const childDefinitionMap = definition.associations;

        return renderAssociationMap(childDefinitionMap)
            .then(function (nestedResults) {

                // replacing child definitions with rendered child components
                definition.associations = nestedResults;

                // we can try to use the group name as a layout
                definition.layout =  definition.layout || definitionGroupName;

                return renderComponent(definition);
            });
    }

    /**
     * Renders an array of component definitions by aggregating them
     * into a single rendered component object
     *
     * @param {string} definitionGroupName - They key where the definitions are found in their parent component's associations
     * @param {ComponentDefinition[]} definitionGroup - Array of configs for Windshield Components
     * @returns {Promise.<RenderedComponent>}
     */
    function renderComponentFromArray(definitionGroupName, definitionGroup) {
        return Promise.map(definitionGroup, function (definintion) {
            return renderOneComponent(definitionGroupName, definintion);
        })
            .then(function (renderedComponents) {

                let markup = [];
                let exported = {};

                renderedComponents.forEach(function (component) {
                    _.merge(exported, component.exported || {});
                    markup.push(component.markup);
                });

                return {
                    markup: markup.join("\n"),
                    exported
                };
            });
    }

    /**
     * Iterates through the associations to produce a rendered component collection object
     *
     * @param {Object.<string, ComponentDefinition[]>} definitionMap - hashmap of arrays of component definitions
     * @returns {Promise.<RenderedComponentCollection>}
     */
    function renderAssociationMap(definitionMap) {
        if (!definitionMap) {
            return Promise.resolve({});
        }

        let associationResults = {exported: {}, markup: {}};
        let names = Object.keys(definitionMap);

        return Promise.reduce(names, (accumulator, groupName) => {
            let definitionGroup = definitionMap[groupName];

            if (!Array.isArray(definitionGroup)) {
                return accumulator;
            }

            return renderComponentFromArray(groupName, definitionGroup)
                .then(function ({markup, exported}) {
                    accumulator.markup[groupName] = markup;
                    _.merge(accumulator.exported, exported);

                    return accumulator;
                });
        }, associationResults);
    }


    return renderAssociationMap(definitionMap);
}



/**
 * @typedef {object} ComponentDefinition
 * @property {object} data - Optional data to use when rendering the component
 * @property {string} component - The name of the component
 * @property {string} layout - The name of a template defined in the component
 * @property {object.<string, ComponentDefinition[]>} associations - A hashmap of arrays of child definitions
 */

/**
 * A rendered component collection object
 *
 * Represents the rendered markup of all the components in all the associations of a parent object, which
 * may be either a component or a page object.
 *
 * @typedef {Object} RenderedComponentCollection
 * @property {Object.<string, string>} markup - Hashmap of association names keyed to strings of markup
 * @property {object.<string, *>} exported
 */


module.exports = renderComponentSchema;
