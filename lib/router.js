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
    adapters: Joi.array().items(Joi.func()).default([])
});

var optionsSchema = Joi.object().keys({
    uriContext: Joi.string().regex(/^\//).default('/windshield'),
    routes: Joi.array().items(routeSchema).default([])
});

module.exports = Router;

function Router(windshield) {
    var server = windshield.server;
    var composer = windshield.composer;
    var renderer = windshield.renderer;

    return addRoutes;

    function addRoutes(options) {
        var validation = Joi.validate(options, optionsSchema);
        if (validation.error) throw validation.error;

        options = validation.value;

        options.routes.forEach(setupRoute);

        function setupRoute(route) {
            server.route({
                method: route.method,
                path: options.uriContext + route.path,
                handler: Handler(_.cloneDeep(route))
            });
        }
    }

    function Handler(route) {
        return handler;

        function handler(request, reply) {
            route.context.request = request;

            return composer(route.context, route.adapters)
                .then(renderer(reply))
                .catch(function (err) {
                    server.log('error', err, err.stack);
                    if (process.env.NODE_ENV === 'production') {
                        return reply(err);
                    } else {
                        console.error(err.stack);
                        return reply(err.stack.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;"));
                    }
                });
        };
    }
}