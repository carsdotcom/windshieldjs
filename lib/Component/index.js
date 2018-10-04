'use strict';
const _ = require('lodash');
const Promise = require('bluebird');

module.exports = Component;


/**
 * @typedef {Object} ComponentConfig
 *
 * @property {componentAdapter} adapter - Method used to resolve data for a rendered component instance
 * @property {object} defaults - Set of properties to include in the rendered component's data.
 * @property {object.<string, Promise<string>>} templates - hashmap for resolving Handlebars template strings
 * @property {object.<string, Promise<string>>} partials - hashmap for resolving Handlebars partial strings
 * @property {ComponentModel} Model - Deprecated method for resolving data for a rendered component instance.
 */

/**
 * @callback ComponentModel
 * @param {object} data - The context of the component that owns the adapter.
 * @returns {Promise.<AdapterResult>}
 */

/**
 * @callback componentAdapter
 * @param {object} data - The context of the component that owns the adapter.
 * @param {module:processRoutes.Context} context - Windshield route context
 * @param {Request} request - Hapi request object
 *
 * @returns {Promise.<AdapterResult>}
 */

/**
 * @typedef {Object} AdapterResult
 * @property {object} data
 * @property {object} export
 * @property {object} exportAs
 */

/**
 *
 * @param {ComponentConfig} implementation
 * @param componentName
 * @returns {{implementation: *}}
 * @constructor
 */
function Component(implementation, componentName) {


    if (!implementation.templates) {
        implementation.templates = {};
    }


    if (!implementation.partials) {
        implementation.partials = {};
    }

    let component = {
        implementation
    };

    let templates = {};

    function compileTemplates(handlebars) {

        return Promise.props(implementation.templates)
            .then(templateSrcMap => {
                templates = _.mapValues(templateSrcMap, (templateSrc) => {
                    return handlebars.compile(templateSrc);
                });
            });
    }

    function registerPartials(handlebars) {
        return Promise.props(implementation.partials)
            .then(partialSrcMap => {
                _.forOwn(partialSrcMap, (partialSrc, partialName) => {
                    const fullName = `${componentName}.${partialName}`;
                    console.log("Registering partial: ", fullName);
                    handlebars.registerPartial(fullName, partialSrc);
                });

                return null;
            });
    }

    component.loadTemplates = function (handlebars) {
        return Promise.all([
            compileTemplates(handlebars),
            registerPartials(handlebars)
        ]);

    };

    /**
     * Executes one of this component's Handlebars templates against data.
     * The data is produced by evaluating this component's adapters and configs
     * with the request
     *
     * @param {string} templateName - The name of one of this component's templates.
     * @param {object} templateData - The context for executing the template
     * @returns {string} HTML markup produced by executing the template
     */
    component.renderTemplate = function (templateName, templateData) {

        if (templates.hasOwnProperty(templateName)) {
            return templates[templateName](templateData);
        }

        if (templates.default) {
            return templates.default(templateData);
        }

        return `<!-- ${componentName} template "${templateName}" could not be found -->`;
    };

    component.hasAdapter = function () {
        return _.isFunction(implementation.adapter);
    };


    /**
     * @param {object} data
     * @param data.componentName
     * @param data.calledName
     * @param data.exported
     *
     * @param {module:processRoutes.Context} context - Windshield route context
     * @param {Request} request - Hapi request object
     *
     * @param {Promise.<object>}
     */
    component.runAdapter = function (data, context, request) {
        if (component.hasAdapter()) {
            let result = implementation.adapter(data, context, request);

            if (!result) {
                return Promise.resolve(null);
            }

            if (!_.isFunction(result.then)) {
                return Promise.resolve(result);
            }

            return result;
        }

        if (component.hasModel()) {
            return Promise.resolve(new implementation.Model(data));
        }

        return Promise.resolve(data);
    };

    component.hasModel = function () {
        let hasModel = _.isFunction(implementation.Model);

        if (hasModel) {
            console.warn("Use of models is Deprecated, please refactor your code to just use an adapter");
        }

        return hasModel;
    };




    function formatAdapterInput(definition) {

        const calledName = definition.component;
        let adapterInput = _.merge({}, definition.data, implementation.defaults, {componentName, calledName});

        if(definition.associations){
            adapterInput = _.merge(adapterInput, {
                exported: definition.associations.exported
            });
        }

        return adapterInput;
    }

    /**
     * @param {ComponentDefinition} definition - Config for a Windshield Component
     * @param {module:processRoutes.Context} context - Windshield route context
     * @param {Request} request - Hapi request object
     *
     * @return {Promise.<PrerenderedComponent>}
     */
    component.evaluate = function (definition, context, request) {

        let adapterInput = formatAdapterInput(definition);

        return component.runAdapter(adapterInput, context, request)
            .then(function (adapterResult) {

                let data = {};
                let exported = {};

                if (adapterResult) {
                    const exportStuff = adapterResult.export;
                    const exportAs = adapterResult.exportAs;


                    if (adapterResult.data) {
                        data = adapterResult.data;
                    } else {
                        console.warn("Component adapter result is in a deprecated format and should be updated");
                        data = adapterResult;
                    }


                    if (_.isObject(exportStuff)) {
                        let exportedName = exportAs || definition.component;
                        exported[exportedName] = exportStuff;
                    }

                } else {
                    console.warn("Component adapter result is in a deprecated format and should be updated");
                }

                // Implement the rendered template data for this component's associations
                if (definition && definition.associations) {

                    data.exported = definition.associations.exported || {};
                    data.assoc = definition.associations.markup;
                } else {
                    data.exported = {};
                    data.assoc = {};
                }

                return {data, exported};
            });
    };


    /**
     *
     * @param {ComponentDefinition} definition - Config for a Windshield Component
     * @param {module:processRoutes.Context} context - Windshield route context
     * @param {Request} request - Hapi request object
     * @param {string} associationName - Name of the association that contains the component
     * @returns {Promise.<RenderedComponent>}
     */
    component.render = function (definition, context, request) {
        return component.evaluate(definition, context, request)
            .then(function ({data, exported}) {
                let templateName = definition.layout;

                let markup = component.renderTemplate(templateName, data);

                return {
                    markup,
                    exported
                };

            })
            .catch(function (e) {
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


/**
 * @typedef {Object} PrerenderedComponent
 * @property {object} data - Data that will be compiled with the component template to produce markup
 * @property {object} data.exported - Data to be handled by the Windshield helper "exported"
 * @property {Object.<string, string>} data.assoc - Data to be handled by the Windshield helper "assoc"
 * @property {object.<string, *>} exported - Copy of the exported data that is exposed for parent/ancestor components
 */

/**
 * An object representing one or more component definition objects that have been rendered into a single string of markup.
 *
 * @typedef {object} RenderedComponent
 * @property {string} markup - A string of HTML produced by Handlebars
 * @property {object.<string, *>} exported - data to be made available to the parent/ancestor components
 */