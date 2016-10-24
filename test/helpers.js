'use strict';
const path = require('path');
const Hapi = require('hapi');
const assert = require('assert');
const handlebars = require('handlebars');
const vision = require('vision');
const windshield = require('..');

exports.registerWithOptions = registerWithOptions;

function registerWithOptions(options, cb) {
    let windshieldWithOptions = {
        register: windshield,
        options: options
    };
    let plugins = [ vision, windshieldWithOptions ];
    let server = new Hapi.Server({ debug: { log: [ 'error' ]} });
    server.connection({ port: 3000 });
    server.register(plugins, function(err) {
        cb(err, !err && server);
    });
}

exports.RouteTester = RouteTester;
function RouteTester(fixture) {
    let fixturePath = path.join(__dirname, fixture);

    function testRoute(route, cb) {
        let options = {
            rootDir: fixturePath,
            handlebars: handlebars,
            uriContext: '/foo',
            routes: [ route ],
            components: require(path.join(fixturePath, 'components'))
        };
        registerWithOptions(options, function (err, server) {
            assert.ifError(err);

            let req = {
                method: 'GET',
                url: '/foo' + route.path
            };

            server.inject(req, cb);
        });
    }

    testRoute.fixturePath = fixturePath;
    return testRoute;
}

