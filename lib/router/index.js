// Load Modules

var Joi = require('joi');
var logger = require('../logger');


// Declare internals

var internals = {
    routeSchema: Joi.object().keys({
        path: Joi.string().required(),
        context: Joi.object().required(),
        adapters: Joi.array().required()
    })
};


module.exports = function (server) {

    return function (options) {

        var self = this,
            options = (options != null) ? options : {},
            context = options.context || '/windshield',
            routes = options.routes || [];

        routes.forEach(function (route) {
            Joi.validate(route, internals.routeSchema, function (err, msg) {
                if (err != null) logger.error(msg);
            });

            server.route({
                method: route.method || 'GET',
                path: context + route.path,
                handler: function (request, reply) {
                    var composerArgs = [];

                    route.context.request = request;

                    composerArgs.push(route.context);

                    route.adapters.forEach(function (adapter) {
                        composerArgs.push(adapter);
                    });

                    self.composer.apply(self, composerArgs)
                        .then(self.renderer(reply))
                        .catch(self.logger.error);
                }
            });
        });
    };
};
