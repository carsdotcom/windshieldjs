"use strict";
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const helpers = require('./helpers');
const fixtureComponents = require('./fixtures/basic/components');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

describe('components -', function () {
    let sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
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
