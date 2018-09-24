'use strict';

const Composer = require('./composer');
const renderer = require('./renderer');

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
    componentMap: Joi.object().default({}),
    uriContext: Joi.string().allow('').default(''),
    routes: Joi.array().items(routeSchema).default([])
});

module.exports = processRoutes;

function processRoutes(server, options) {
    const validation = Joi.validate(options, optionsSchema);
    if (validation.error) {
        throw validation.error;
    }

    const {componentMap, uriContext, routes} = validation.value;

    const composer = Composer(server, componentMap);

    return routes.map(setupRoute);

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

    function setupRoute(route) {

        let flattened = _.flatMap(route.adapters);
        let preHandlers = _.remove(flattened, (a) => _.isFunction(a.method));
        let app = {
            context: route.context,
            adapters: flattened
        };
        if (route.pageFilter) {
            app.pageFilter = route.pageFilter;
        }
        let pre = _.map(preHandlers, mapToWrappedHandler);

        return {
            method: route.method,
            path: uriContext + route.path,
            handler: Handler(route),
            config: {
                state: {
                    failAction: 'log'
                },
                app,
                pre
            }
        };
    }

    function Handler(route) {
        return function handler(request, reply) {

            return composer(request)
                .then(renderer(reply))
                .catch(catchAndReply);

            function catchAndReply(err) {
                server.log('error', err);
                if (process.env.NODE_ENV === 'production') {
                    return reply(err);
                } else {
                    return reply(err.stack.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;")).code(500);
                }
            }
        };
    }
}
