'use strict';

const merge = require('lodash.merge');

module.exports = Component;


/**
 * @typedef {Object} ComponentConfig
 *
 * @property {componentAdapter} adapter - Method used to resolve data for a rendered component instance
 * @property {object} defaults - Set of properties to include in the rendered component's data.
 * @property {object.<string, Promise.<string>>} templates - hashmap for resolving Handlebars template strings
 * @property {object.<string, Promise.<string>>} partials - hashmap for resolving Handlebars partial strings
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

    let compiledTemplates = {};

    /**
     * @async
     * @param {Object.<string, Promise.<*>>} promiseHashmap - A hashmap of promises
     * @returns {Promise.<Array.<string,*>} Resolves with an array of key-value pairs, where
     *                                      the key is from the original hashmap, and its value
     *                                      is the result of the corresponding promise.
     */
    async function resolvePromiseProps(promiseHashmap) {
        const entryPromises = Object.entries(promiseHashmap).map(async ([key, promise]) => {
            const result = await promise;
            return [key, result];
        });

        return Promise.all(entryPromises);
    }

    /**
     * @param {Array.<string, string>} templateSrcEntries - Array of key-value pairs, where the key is a template name
     *                                                      and the value is a string of Handlebars template source text.
     * @param {Handlebars} handlebars - The Handlebars namespace.
     * @returns {Object.<string, function>} - A hashmap where each key is a template name and its value is a
     *                                        compiled Handlebars template function.
     */
    function compileTemplates(templateSrcEntries, handlebars) {
        return templateSrcEntries.reduce(function (a, [tplName, templateSrc]) {
            a[tplName] = handlebars.compile(templateSrc);
            return a;
        }, {});
    }

    function registerPartials(partialSrcEntries, handlebars) {
        partialSrcEntries.forEach(([partialName, partialSrc]) => {
            const fullName = `${componentName}.${partialName}`;
            console.log("Windshield registering Handlebars partial: ", fullName);
            handlebars.registerPartial(fullName, partialSrc);
        });

        return null;
    }

    component.loadTemplates = async function (handlebars) {

        const [templateSrcEntries, partialSrcEntries] = await Promise.all([resolvePromiseProps(implementation.templates), resolvePromiseProps(implementation.partials)]);

        registerPartials(partialSrcEntries, handlebars);
        compiledTemplates = compileTemplates(templateSrcEntries, handlebars);

        return null;
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

        if (compiledTemplates.hasOwnProperty(templateName)) {
            return compiledTemplates[templateName](templateData);
        }

        if (compiledTemplates.default) {
            return compiledTemplates.default(templateData);
        }

        return `<!-- ${componentName} template "${templateName}" could not be found -->`;
    };

    component.hasAdapter = function () {
        return typeof implementation.adapter === 'function';
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
        const hasModel = typeof implementation.Model === 'function';

        if (hasModel) {
            console.warn("Use of models is Deprecated, please refactor your code to just use an adapter");
        }

        return hasModel;
    };




    function formatAdapterInput(definition) {

        const calledName = definition.component;
        const adapterInput = merge({}, definition.data, implementation.defaults, {componentName, calledName});

        if(definition.associations){
            merge(adapterInput, {
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


            if (exportStuff && typeof exportStuff === 'object') {
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