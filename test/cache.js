'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const Promise = require('bluebird');
const helpers = require('./helpers');

describe('cache -', function () {
    let testRoute = helpers.RouteTester('fixtures/basic');

    beforeEach((done) => {
        require('rimraf')(path.join(process.cwd(), 'windshield-cache'), (err) => done(err));
    });

    it('when cache option is set, cache header is present', function (done) {
        let route = {
            path: '/bar',
            adapters: [ function (context, request) { return Promise.resolve({}); }],
            cache: true
        };
        testRoute(route, function (response) {
            assert.equal(response.statusCode, 200);
            assert.equal(!!response.headers['windshield-cache'], false);
            testRoute(route, function (response) {
                assert.equal(response.statusCode, 200);
                assert.equal(!!response.headers['windshield-cache'], true);
                done();
            });
        });
    });

    it('when cache option is not set, cache header is not present', function (done) {
        let route = {
            path: '/bar',
            adapters: [ function (context, request) { return Promise.resolve({}); }]
        };
        testRoute(route, function (response) {
            assert.equal(response.statusCode, 200);
            assert.equal(!!response.headers['windshield-cache'], false);
            testRoute(route, function (response) {
                assert.equal(response.statusCode, 200);
                assert.equal(!!response.headers['windshield-cache'], false);
                done();
            });
        });
    });

});
