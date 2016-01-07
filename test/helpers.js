var path = require('path');
var Hapi = require('hapi');
var assert = require('assert');
var handlebars = require('handlebars');
var vision = require('vision');

var windshield = require('..');

exports.registerWithOptions = registerWithOptions;

function registerWithOptions(options, cb) {
    var windshieldWithOptions = {
        register: windshield,
        options: options
    };
    var plugins = [ vision, windshieldWithOptions ];
    var server = new Hapi.Server({ debug: { log: [ 'error' ]} });
    server.connection({ port: 3000 });
    server.register(plugins, function(err) {
        cb(err, !err && server);
    });
}

exports.RouteTester = RouteTester;
function RouteTester(fixture) {
    var fixturePath = path.join(__dirname, fixture);

    function testRoute(route, cb) {
        registerWithOptions({
            rootDir: fixturePath,
            handlebars: handlebars,
            uriContext: '/foo',
            routes: [ route ]
        }, function (err, server) {
            assert.ifError(err);

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

