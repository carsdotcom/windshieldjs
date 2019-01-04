'use strict';
const merge = require('lodash.merge');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const helpers = require('./helpers');

describe('Selecting the layout for a page adapter', function () {

    describe('when layout property is not defined in page definition', function () {
        const testRoute = helpers.RouteTester('fixtures/basic');

        it('should use default layout', function () {
            const route = {
                path: '/bar',
                adapters: [ {
                    method: function (context, request, h) {


                        return Promise.resolve({ });

                    },
                    assign: 'test'
                }]
            };
            return testRoute(route).then(function (response) {
                assert.equal(response.statusCode, 200);
                assert.equal(response.result, fs.readFileSync(path.normalize(testRoute.fixturePath + '/layouts/default.html'), { encoding: 'utf8' }));
            });
        });

    });

    describe('when layout property defined in page definition', function () {
        const testRoute = helpers.RouteTester('fixtures/basic');

        it('should use custom layout', function () {
            const route = {
                path: '/bar',
                adapters: [ {
                    method: function (context, request, h) {

                        merge(context, { layout: 'other' });

                        return Promise.resolve({ layout: 'other' });

                    },
                    assign: 'test'
                }]
            };
            return testRoute(route).then(function (response) {
                assert.equal(response.statusCode, 200);
                assert.equal(response.result, fs.readFileSync(path.normalize(testRoute.fixturePath + '/layouts/other.html'), { encoding: 'utf8' }));
            });
        });

    });
});

