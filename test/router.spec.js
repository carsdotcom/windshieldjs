'use strict';
const assert = require('assert');
const helpers = require('./helpers');

describe('router -', function () {
    let testRoute = helpers.RouteTester('fixtures/basic');

    it('route can be defined with just a path and no adapters', function () {
        let route = {
            path: '/bar',
            adapters: []
        };
        return testRoute(route).then(function (response) {
            assert.equal(response.statusCode, 200);
        });
    });

    it('route can be defined with just a path and one adapter', function () {
        let route = {
            path: '/bar',
            adapters: [ function (context, request) { return Promise.resolve({}); }]
        };
        return testRoute(route).then(function (response) {
            assert.equal(response.statusCode, 200);
        });
    });

});
