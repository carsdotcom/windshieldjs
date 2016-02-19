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
    adapters: Joi.array().items().default([])
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

        // separate out pre-handlers
        var preHandlers = _.remove(route.adapters, function (a) {
            return (_.isFunction(a.method) && _.isString(a.assign));
        });

        server.route({
            method: route.method,
            path: options.uriContext + route.path,
            handler: Handler(route),
            config: {
                state: {
                    failAction: 'log'
                },
                app: {
                    context: route.context,
                    adapters: route.adapters
                },
                pre: _.map(preHandlers, mapToWrappedHandler)
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
