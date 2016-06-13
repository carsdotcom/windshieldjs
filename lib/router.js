"use strict";

var Joi = require('joi');
var _ = require('lodash');

var contextSchema = Joi.object().keys({
   layout: Joi.string().default('default'),
   attributes: Joi.object().default({}),
   associations: Joi.object().default({})
}).default({
   layout: 'default',
   attributes: {},
   associations: {}
}).unknown();

var routeSchema = Joi.object().keys({
    method: Joi.string().default('GET'),
    path: Joi.string().required(),
    context: contextSchema,
    adapters: Joi.array().items().default([]),
    pageFilter: Joi.func().optional()
});

var optionsSchema = Joi.object().keys({
    uriContext: Joi.string().allow('').default(''),
    routes: Joi.array().items(routeSchema).default([])
});

module.exports = Router;

function Router(windshield) {
    var server = windshield.server;
    var composer = windshield.composer;
    var renderer = windshield.renderer;
    var options = _.pick(windshield.options, [ 'uriContext', 'routes' ]);
    var validation = Joi.validate(options, optionsSchema);
    if (validation.error) throw validation.error;

    options = validation.value;

    options.routes.forEach(setupRoute);

    function WrappedHandler(handler) {
        return function wrappedHandler(request, reply) {
            var context;
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

        var flattened = _.flatMap(route.adapters);
        // separate out pre-handlers
        var preHandlers = _.remove(flattened, (a) => _.isFunction(a.method));
        var app = {
            context: route.context,
            adapters: flattened
        };
        if (route.pageFilter) {
            app.pageFilter = route.pageFilter;
        }
        var pre = _.map(preHandlers, mapToWrappedHandler);

        server.route({
            method: route.method,
            path: options.uriContext + route.path,
            handler: Handler(route),
            config: {
                state: {
                    failAction: 'log'
                },
                app,
                pre
            }
        });
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
