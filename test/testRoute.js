var Hapi = require('hapi');
var handlebars = require('handlebars');
var vision = require('vision');
var windshield = require('..');
var path = require('path');

function testRoute(fixture) {
    var fixturePath = path.join(__dirname, fixture);

    function testRoute(route, cb) {
        var server = new Hapi.Server({ debug: { log: [ 'error' ]} });

        server.connection({ port: 2000 });

        server.register([
            vision,
            {
                register: windshield,
                options: {
                    rootDir: fixturePath,
                    handlebars: handlebars
                }
            }
        ], function (err) {
            if (err) throw err;
            server.plugins.windshieldjs.router({
                uriContext: '/foo',
                routes: [ route ]
            });

            var req = {
                method: 'GET',
                url: '/foo' + route.path
            };
            server.inject(req, cb);
        });

    }

    testRoute.fixturePath = fixturePath;
    return testRoute;
}

module.exports = testRoute;
