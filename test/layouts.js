"use strict";
var _ = require('lodash');

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var Promise = require('bluebird');

var helpers = require('./helpers');

describe('layouts -', function () {
    var testRoute = helpers.RouteTester('fixtures/basic');

    it('custom layout should be used when layout property defined in page definition', function (done) {
        var route = {
            path: '/bar',
            adapters: [ {
                method: function (context, request, reply) {

                    _.merge(context, { layout: 'other' });

                    reply(Promise.resolve({ layout: 'other' }));

                },
                assign: 'test'
            }]
        };
        testRoute(route, function (response) {
            assert.equal(response.statusCode, 200);
            assert.equal(response.result, fs.readFileSync(path.normalize(testRoute.fixturePath + '/layouts/other.html'), { encoding: 'utf8' }));
            done();
        });
    });

});
