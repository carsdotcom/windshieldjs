'use strict';
const _ = require('lodash');
const Promise = require('bluebird');

function AssociationList(name, associations, componentMap){

    let associationList = {};

    /**
     *
     * @param {ComponentDefinition} definition
     * @param {Promise<module:processRoutes.Context>} ctx - Windshield context object
     * @param {Request} req - Hapi Request object
     * @returns {Promise.<RenderedAssocMap>}
     */
    function evaluateNestedAssociations(definition, ctx, request) {

        let nestedList;

        if (_.isEmpty(definition.associations)) {
            return Promise.resolve({});
        } else {
            nestedList = AssociationMap(definition.associations, componentMap);
            return nestedList.render(ctx, request);
        }
    }

    /**
     *
     * @param {ComponentDefinition} definition
     * @param {Promise<module:processRoutes.Context>} ctx - Windshield context object
     * @param {Request} req - Hapi Request object
     *
     * @return {Promise.<RenderedComponent>}
     */
    function renderOneComponent(definition, ctx, req){
        return evaluateNestedAssociations(definition, ctx, req)
            .then(function (nestedResults) {
                let component = componentMap.getComponent(definition.component);

                definition.associations = nestedResults;

                return component.render(definition, ctx, req, name, definition.component);
            });
    }

    /**
     * Evaluates an array of associations by rendering each of their components
     * to produce an array of rendered components
     * @param ctx
     * @param req
     * @returns {Promise.<RenderedComponent[]>}
     */
    function evaluateArray(ctx, req) {

        return Promise.map(associations, function (definintion) {
            return renderOneComponent(definintion, ctx, req, componentMap);
        });
    }

    /**
     * Renders an array of associations by aggregating their components
     * into a single string of markup and a single exported object
     * @param ctx
     * @param req
     * @returns {Promise.<RenderedComponent>}
     */
    associationList.render = function render(ctx, req){
        return evaluateArray(ctx, req)
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
    };

    return associationList;
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
 *
 *
 * @param {Object.<string, ComponentDefinition[]>} associations - hashmap of arrays of component definitions
 * @param {ComponentMap} componentMap - Data structure defining all available Windshield components
 * @returns {{}}
 * @constructor
 */
function AssociationMap(associations, componentMap) {

    let associationMap = {};

    /**
     *
     * @param ctx
     * @param req
     * @param definitions
     * @param name
     * @returns {Promise.<RenderedComponent>}
     */
    function renderNamedAssociation(ctx, req, definitions, name){

        let associationList = AssociationList(name, definitions, componentMap);
        return associationList.render(ctx, req);

    }


    /**
     * Iterates through the associations to produce a RenderedAssocMap
     *
     * @param {Promise<module:processRoutes.Context>} ctx - Windshield context object
     * @param {Request} req - Hapi request object
     * @returns {Promise.<RenderedAssocMap>}
     */
    associationMap.render = function (ctx, req) {
        let associationResults = { exported: {}, markup: {} };
        let names = Object.keys(associations);


        return Promise.reduce(names, (accumulator, name) => {
                let definitions = associations[name];

                return renderNamedAssociation(ctx, req, definitions, name)
                    .then(function ({markup, exported}) {
                        accumulator.markup[name] = markup;
                        _.merge(accumulator.exported, exported);

                        return accumulator;
                    });
            }, associationResults);
    };

    return associationMap;
}

module.exports = AssociationMap;
