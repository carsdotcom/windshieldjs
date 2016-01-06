"use strict";

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var Promise = require('bluebird');

var helpers = require('./helpers');

describe('router', function () {
    var testRoute = helpers.RouteTester('basic-fixtures');

    it('route can be defined with just a path and a single adapter', function (done) {
        var route = {
            path: '/bar',
            adapters: [ function () { return Promise.resolve({}); }]
        };
        testRoute(route, function (response) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });

    it('custom layout should be used when layout property defined in page definition', function (done) {
        var route = {
            path: '/bar',
            adapters: [ function () { return Promise.resolve({ layout: 'other' }); }]
        };
        testRoute(route, function (response) {
            assert.equal(response.statusCode, 200);
            assert.equal(response.result, fs.readFileSync(path.normalize(testRoute.fixturePath + '/layouts/other.html'), { encoding: 'utf8' }));
            done();
        });
    });

    xit('optionally takes an options object which can contain a URI context and a routes array', function () {
    });

    xit('each route within the routes array must have a path string, context object, and adapters array', function () {
    });

    xit('when provided with an a URI context will prefix all paths with the given context', function () {
    });

    xit('when not provided with an a URI context will default this context to the value `/windshield`', function () {
    });

    xit('route definition is used to generate a route handler', function () {
    });

    xit('route handler should call composer with context and adapters from route definition', function () {
    });

    xit('route handler will default context if not supplied', function () {
    });

    xit('if something goes wrong in the composer an error should be logged by the router', function (done) {
    });
});
