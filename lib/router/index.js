// Load Modules

var Joi = require('joi');
var _ = require('lodash');

// Declare internals

var internals = {};

// route definition schema
internals.routeSchema = Joi.object().keys({
    path: Joi.string().required(),
    context: Joi.object(),
    adapters: Joi.array().required()
});

internals.generateRouteHandler = function (route) {
    var self = this;

    return function (request, reply) {
        var composerArgs = [];

        route.context = route.context || {};
        route.context.request = request;

        composerArgs.push(route.context);

        route.adapters.forEach(function (adapter) {
            composerArgs.push(adapter);
        });

        return self.composer.apply(self, composerArgs)
            .then(self.renderer(reply))
            .catch(function (err) {
                var e;
                if (typeof err === 'object') {
                    e = _.assign({}, err);
                    e.name = err.name;
                    e.message = err.message;
                    e.stack = err.stack;
                } else {
                    e = err;
                }
                self.server.log('error', e);
            });
    };
};

module.exports = function (options) {
    var self = this;
    var options = (options != null) ? options : {};
    var uriContext = options.uriContext || '/windshield';
    var routes = options.routes || [];

    routes.forEach(function (route) {
        Joi.validate(route, internals.routeSchema, function (err, msg) {
            if (err) {
                self.server.log('error', msg);
                throw err;
            }
        });

        self.server.route({
            method: route.method || 'GET',
            path: uriContext + route.path,
            handler: internals.generateRouteHandler.call(self, route)
        });
    });
};
