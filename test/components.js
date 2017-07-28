"use strict";
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const helpers = require('./helpers');
const fixtureComponents = require('./fixtures/basic/components');
const chai = require('chai');
const expect = chai.expect;

describe('components -', function () {

    beforeEach((done) => {
        require('rimraf')(path.join(process.cwd(), 'windshield-cache'), (err) => done(err));
    });

    let testRoute = helpers.RouteTester('fixtures/basic');

    it('should use the template which matches the name of the association they belong to', function (done) {
        let mockComponent = {
            component: 'basicComponent'
        };
        let route = {
            path: '/bar',
            adapters: [{
                method: function (context, request, reply) {

                    let data = {
                        layout: 'railAssoc',
                        associations: {
                            rail: [
                                mockComponent
                            ]
                        }
                    };

                    _.merge(context, data);

                    reply(Promise.resolve(data));
                },
                assign: 'test'
            }]
        };
        testRoute(route, function (data) {
            expect(data.payload).to.contain('this is the rail template');
            done();
        });
    });

});
