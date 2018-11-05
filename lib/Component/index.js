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

    const component = {
        implementation
    };

    let templates = {};

    async function compileTemplates(handlebars) {
        const templateSrcMap = await Promise.props(implementation.templates);
        templates = _.mapValues(templateSrcMap, (templateSrc) => {
            return handlebars.compile(templateSrc);
        });
    }

    async function registerPartials(handlebars) {
        const partialSrcMap = await Promise.props(implementation.partials);

        _.forOwn(partialSrcMap, (partialSrc, partialName) => {
            const fullName = `${componentName}.${partialName}`;
            console.log("Windshield registering Handlebars partial: ", fullName);
            handlebars.registerPartial(fullName, partialSrc);
        });

        return null;
    }

    component.loadTemplates = async function (handlebars) {
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
    component.runAdapter = async function (data, context, request) {
        if (component.hasAdapter()) {
            const result = await implementation.adapter(data, context, request);

            if (!result) {
                return null;
            }

            return result;
        }

        if (component.hasModel()) {
            return new implementation.Model(data);
        }

        return data;
    };

    component.hasModel = function () {
        const hasModel = _.isFunction(implementation.Model);

        if (hasModel) {
            console.warn("Use of models is Deprecated, please refactor your code to just use an adapter");
        }

        return hasModel;
    };




    function formatAdapterInput(definition) {

        const calledName = definition.component;
        const adapterInput = _.merge({}, definition.data, implementation.defaults, {componentName, calledName});

        if(definition.associations){
            _.merge(adapterInput, {
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
    component.evaluate = async function (definition, context, request) {

        const adapterInput = formatAdapterInput(definition);

        const adapterResult = await component.runAdapter(adapterInput, context, request);

        let data = {};
        let exported = {};

        if (adapterResult) {
            const exportStuff = adapterResult.export;
            const exportAs = adapterResult.exportAs;


            // adapterResult ought to be an object containing a data property, but for now we'll support
            // this deprecated format.
            if (adapterResult.data) {
                data = adapterResult.data;
            } else {
                request.server.log("warn", `Windshield component "${definition.component}" produced an adapter result in a deprecated format`);
                data = adapterResult;
            }


            if (_.isObject(exportStuff)) {
                const exportedName = exportAs || definition.component;
                exported[exportedName] = exportStuff;
            }

        } else {
            // adapterResult ought to be an object containing a data property (which may be empty)
            // it should not be falsy, but for now we'll support this deprecated format.
            request.server.log("warn", `Windshield component "${definition.component}" produced an adapter result in a deprecated format`);
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
    };


    /**
     * @async
     * @param {ComponentDefinition} definition - Config for a Windshield Component
     * @param {module:processRoutes.Context} context - Windshield route context
     * @param {Request} request - Hapi request object
     * @returns {Promise.<RenderedComponent>}
     */
    component.render = async function (definition, context, request) {
        try {
            const {data, exported} = await component.evaluate(definition, context, request);

            const templateName = definition.layout;

            const markup = component.renderTemplate(templateName, data);

            return {
                markup,
                exported
            };

        } catch (e) {
            const reason = e ? e.message : '';
            const markup = `<!-- Component failed to render ${reason} -->`;
            return { markup };
        }
    };

    return component;
}


/**
 * @typedef {Object} PrerenderedComponent
 * @property {object} data - Data that will be compiled with the component template to produce markup
 * @property {object} [data.exported] - Data to be handled by the Windshield helper "exported"
 * @property {Object.<string, string>} [data.assoc] - Data to be handled by the Windshield helper "assoc"
 * @property {object.<string, *>} [exported] - Copy of the exported data that is exposed for parent/ancestor components
 */

/**
 * An object representing one or more component definition objects that have been rendered into a single string of markup.
 *
 * @typedef {object} RenderedComponent
 * @property {string} markup - A string of HTML produced by Handlebars
 * @property {object.<string, *>} [exported] - data to be made available to the parent/ancestor components
 */