'use strict';
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const Promise = require('bluebird');
const helpers = require('./helpers');

describe('layouts -', function () {
    let testRoute = helpers.RouteTester('fixtures/basic');

    it('custom layout should be used when layout property defined in page definition', function () {
        let route = {
            path: '/bar',
            adapters: [ {
                method: function (context, request, h) {

                    _.merge(context, { layout: 'other' });

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
