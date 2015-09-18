// Load Modules

var Joi = require('joi');
var logger = require('../logger');


// Declare internals

var internals = {
    routeSchema: Joi.object().keys({
        path: Joi.string().required(),
        context: Joi.object(),
        adapters: Joi.array().required()
    }),
    generateRouteHandler: function (windshield, route) {
        return function (request, reply) {
            var composerArgs = [];

            route.context = route.context || {};
            route.context.request = request;

            composerArgs.push(route.context);

            route.adapters.forEach(function (adapter) {
                composerArgs.push(adapter);
            });

            windshield.composer.apply(windshield, composerArgs)
                .then(windshield.renderer(reply))
                .catch(windshield.logger.error);
        };
    }
};


module.exports = function (server) {

    return function (options) {

        var self = this,
            options = (options != null) ? options : {},
            context = options.context || '/windshield',
            routes = options.routes || [];

        routes.forEach(function (route) {
            Joi.validate(route, internals.routeSchema, function (err, msg) {
                if (err != null) {
                    logger.error(msg);
                    throw new Error(msg);
                }
            });

            server.route({
                method: route.method || 'GET',
                path: context + route.path,
                handler: internals.generateRouteHandler(self, route)
            });
        });
    };
};
