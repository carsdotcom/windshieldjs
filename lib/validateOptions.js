'use strict';
const Joi = require('joi');
const handlebars = require('handlebars');

const componentDefinitionSchema = Joi.object()
    .keys({
        data: Joi.object().optional(),
        component: Joi.string().required(),
        layout: Joi.string().optional(),
        associations: Joi.lazy(() => componentAssociationSchema)
    })
    .unknown();

const componentAssociationSchema = Joi.object()
    .pattern(/\w/, componentDefinitionSchema)
    .default({});


const contextSchema = Joi.object().keys({
    layout: Joi.string().default('default'),
    attributes: Joi.object().default({}),
    associations: componentAssociationSchema
}).default({
    layout: 'default',
    attributes: {},
    associations: {}
}).unknown();

const hapiPreReqSchema = Joi.object().keys({
    method: Joi.func().required(),
    assign: Joi.string().optional()
});

const adaptersArraySchema = Joi.array().items(
    Joi.func(),
    hapiPreReqSchema,
    Joi.lazy(() => adaptersArraySchema)
).default([]);

const routeSchema = Joi.object().keys({
    method: Joi.string().default('GET'),
    path: Joi.string().required(),
    context: contextSchema,
    adapters: adaptersArraySchema,
    pageFilter: Joi.func().optional()
});

const componentConfigSchema = Joi.object()
    .keys({
        adapter: Joi.func().optional(),
        defaults: Joi.object().optional(),
        templates: Joi.object().optional(),
        partials: Joi.object().optional(),
        Model: Joi.func().optional()
    })
    .unknown();

const optionsSchema = Joi.object().keys({
    rootDir: Joi.string().required(),
    handlebars: Joi.object().default(handlebars),
    uriContext: Joi.string().allow('').default(''),
    routes: Joi.array().items(routeSchema).default([]),
    components: Joi.object().pattern(/\w/, componentConfigSchema).default({}),
    path: Joi.array().default(['./']),
    helpersPath: Joi.array().default(['helpers'])
});


function validate(options) {
    return Joi.validate(options, optionsSchema);
}


module.exports = validate;