'use strict';
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const Promise = require('bluebird');
const helpers = require('./helpers');

describe('layouts -', function () {
    let testRoute = helpers.RouteTester('fixtures/basic');

    beforeEach((done) => {
        require('rimraf')(path.join(process.cwd(), 'windshield-cache'), (err) => done(err));
    });

    it('custom layout should be used when layout property defined in page definition', function (done) {
        let route = {
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
