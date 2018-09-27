'use strict';
const _ = require('lodash');
const Promise = require('bluebird');

function compose(context, request, componentMap) {


    /**
     *
     * @param {ComponentDefinition} definition
     * @returns {Promise.<RenderedAssocMap>}
     */
    function evaluateNestedAssociations(definition) {
        if (_.isEmpty(definition.associations)) {
            return Promise.resolve({});
        } else {
            return renderAssociationMap(definition.associations);
        }
    }

    /**
     * @param {string} associationName - Name of the association that contains the component
     * @param {ComponentDefinition} definition - Config for a Windshield Component
     *
     * @return {Promise.<RenderedComponent>}
     */
    function renderOneComponent(associationName, definition) {
        return evaluateNestedAssociations(definition)
            .then(function (nestedResults) {
                let component = componentMap.getComponent(definition.component);

                definition.associations = nestedResults;

                return component.render(definition, context, request, associationName, definition.component);
            });
    }

    /**
     * Renders an array of component definitions by aggregating them
     * into a single string of markup and a single exported object
     * @param {string} associationName - Name of the association that contains the components
     * @param {ComponentDefinition[]} definitions - Array of configs for Windshield Components
     * @returns {Promise.<RenderedComponent>}
     */
    function renderComponentArray(associationName, definitions) {
        return Promise.map(definitions, function (definintion) {
                return renderOneComponent(associationName, definintion);
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
     * @typedef {object} ComponentDefinition
     * @property data
     * @property component
     * @property layout
     * @property associations
     */

    /**
     * A rendered association map object
     * @typedef {Object} RenderedAssocMap
     * @property {Object.<string, string>} markup - Hashmap of association names keyed to strings of markup
     * @property {object} exported
     */

    /**
     * Iterates through the associations to produce a RenderedAssocMap
     *
     * @param {Object.<string, ComponentDefinition[]>} associations - hashmap of arrays of component definitions
     * @returns {Promise.<RenderedAssocMap>}
     */
    function renderAssociationMap(associations) {
        let associationResults = {exported: {}, markup: {}};
        let names = Object.keys(associations);

        return Promise.reduce(names, (accumulator, name) => {
            let definitions = associations[name];

            return renderComponentArray(name, definitions)
                .then(function ({markup, exported}) {
                    accumulator.markup[name] = markup;
                    _.merge(accumulator.exported, exported);

                    return accumulator;
                });
        }, associationResults);
    }

    return renderAssociationMap;
}

module.exports = compose;
