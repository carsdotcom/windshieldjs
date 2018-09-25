'use strict';


const Joi = require('joi');
const _ = require('lodash');

let contextSchema = Joi.object().keys({
   layout: Joi.string().default('default'),
   attributes: Joi.object().default({}),
   associations: Joi.object().default({})
}).default({
   layout: 'default',
   attributes: {},
   associations: {}
}).unknown();

let routeSchema = Joi.object().keys({
    method: Joi.string().default('GET'),
    path: Joi.string().required(),
    context: contextSchema,
    adapters: Joi.array().items().default([]),
    pageFilter: Joi.func().optional()
});

let optionsSchema = Joi.object().keys({
    uriContext: Joi.string().allow('').default(''),
    routes: Joi.array().items(routeSchema).default([])
});

module.exports = processRoutes;

function processRoutes(handler, options) {
    const validation = Joi.validate(options, optionsSchema);
    if (validation.error) {
        throw validation.error;
    }

    const {uriContext, routes} = validation.value;



    return routes.map(setupRoute);


    function setupRoute({adapters, pageFilter, method, path, context}) {
        let flattened = _.flatMap(adapters);
        let preHandlers = _.remove(flattened, (a) => _.isFunction(a.method));

        let app = {
            context,
            adapters: flattened
        };
        if (pageFilter) {
            app.pageFilter = pageFilter;
        }

        let pre = _.map(preHandlers, mapToWrappedHandler);

        return {
            method: method,
            path: uriContext + path,
            handler: handler,
            config: {
                state: {
                    failAction: 'log'
                },
                app,
                pre
            }
        };
    }

}

function WrappedHandler(handler) {
    return function wrappedHandler(request, reply) {
        let context;
        if (request.route) {
            context = request.route.settings.app.context;
        } else {
            context = {};
        }
        return handler(context, request, reply);
    };
}

function mapToWrappedHandler(handler) {
    return {
        method: WrappedHandler(handler.method),
        assign: handler.assign
    };
}
