module.exports = function (server) {

    return function (options) {

        // TODO Joi

        var self = this,
            options = (options != null) ? options : {},
            context = options.context || '/windshield',
            routes = options.routes || [];

        routes.forEach(function (route) {

            // TODO Joi

            if (!route.path) throw new Error('missing `path` property');
            if (!route.context) throw new Error('missing `context` property');
            if (!route.adapters) throw new Error('missing `adapters` property');

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
