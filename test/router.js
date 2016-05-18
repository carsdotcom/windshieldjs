"use strict";

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var Promise = require('bluebird');

var helpers = require('./helpers');

describe('router -', function () {
    var testRoute = helpers.RouteTester('fixtures/basic');

    it('route can be defined with just a path and no adapters', function (done) {
        var route = {
            path: '/bar',
            adapters: []
        };
        testRoute(route, function (response) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });

    it('route can be defined with just a path and one adapter', function (done) {
        var route = {
            path: '/bar',
            adapters: [ function (context, request) { return Promise.resolve({}); }]
        };
        testRoute(route, function (response) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });

});
