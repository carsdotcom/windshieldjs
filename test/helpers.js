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
        plugin: windshield,
        options: options
    };
    let plugins = [ vision, windshieldWithOptions ];
    let server = new Hapi.Server({ port: 3000, debug: { log: [ 'error' ]} });
    return server.register(plugins).then(() => server);
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
        return registerWithOptions(options)
            .then(server => {
                let req = {
                    method: 'GET',
                    url: '/foo' + route.path
                };

                return server.inject(req);
            })
            .catch(err => {
                return assert.ifError(err);
            });
    }

    testRoute.fixturePath = fixturePath;
    return testRoute;
}

