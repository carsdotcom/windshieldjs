// Load Modules

var Joi = require('joi');
var _ = require('lodash');

// Declare internals

var internals = {

    // route definition schema
    routeSchema: Joi.object().keys({
        path: Joi.string().required(),
        context: Joi.object(),
        adapters: Joi.array().required()
    })

};


module.exports = function (options) {
    var self = this,
        options = (options != null) ? options : {},
        uriContext = options.uriContext || '/windshield',
        routes = options.routes || [];

    function generateRouteHandler(route) {
        return function (request, reply) {
            var composerArgs = [];

            route.context = route.context || {};
            route.context.request = request;

            composerArgs.push(route.context);

            route.adapters.forEach(function (adapter) {
                composerArgs.push(adapter);
            });

            self.composer.apply(self, composerArgs)
                .then(self.renderer(reply))
                .catch(function (err) {
                    self.server.log(err, { error: true });
                });
        };
    }

    routes.forEach(function (route) {
        Joi.validate(route, internals.routeSchema, function (err, msg) {
            if (err) {
                self.server.log(msg, { error: true });
                throw err;
            }
        });

        self.server.route({
            method: route.method || 'GET',
            path: uriContext + route.path,
            handler: generateRouteHandler(route)
        });
    });
};
