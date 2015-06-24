module.exports = function (routes) {
    var self = this;

    routes.forEach(function (route) {
        if (!route.path) throw new Error('missing `path` property');
        if (!route.context) throw new Error('missing `context` property');
        if (!route.adapters) throw new Error('missing `adapters` property');

        self.route({
            method: route.method || 'GET',
            path: self.config.server.context + route.path,
            handler: function (request, reply) {
                var composerArgs = [];

                route.context.request = request;

                composerArgs.push(route.context);

                route.adapters.forEach(function (adapter) {
                    composerArgs.push(adapter);
                });

                self.composer.apply(this, composerArgs)
                    .then(self.renderer(reply))
                    .catch(self.logger.error);
            }
        });
    });
};
