'use strict';
const path = require('path');
const Hapi = require('hapi');
const assert = require('assert');
const handlebars = require('handlebars');
const vision = require('vision');
const windshield = require('..');


async function registerWithOptions(options, cb) {
    const windshieldWithOptions = {
        plugin: windshield,
        options: options
    };
    const plugins = [ vision, windshieldWithOptions ];
    const server = new Hapi.Server({ port: 3000, debug: { log: [ 'error' ]} });
    await server.register(plugins);
    return server;
}

function RouteTester(fixture) {
    const fixturePath = path.join(__dirname, fixture);

    async function testRoute(route, cb) {
        const options = {
            rootDir: fixturePath,
            handlebars: handlebars,
            uriContext: '/foo',
            routes: [ route ],
            components: require(path.join(fixturePath, 'components'))
        };
        const server = await registerWithOptions(options);

        try {
            const req = {
                method: 'GET',
                url: '/foo' + route.path
            };

            return server.inject(req);
        } catch(err) {
            return assert.ifError(err);
        }
    }

    testRoute.fixturePath = fixturePath;
    return testRoute;
}


exports.registerWithOptions = registerWithOptions;
exports.RouteTester = RouteTester;