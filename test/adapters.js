'use strict';
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const helpers = require('./helpers');
const fixtureComponents = require('./fixtures/basic/components');
const chai = require('chai');
const expect = chai.expect;

describe('page adapters -', function () {
    let sandbox;

    beforeEach((done) => {
        require('rimraf')(path.join(process.cwd(), 'windshield-cache'), (err) => done(err));
    });

    let testRoute = helpers.RouteTester('fixtures/basic');

    it('should use reply if defined as prehandler (object with `method` property', function (done) {
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

                    return reply(Promise.resolve(data));
                }
            },
                function (context, request) {

                    let data = {
                        associations: {
                            main: [
                                mockComponent
                            ]
                        }
                    };

                    _.merge(context, data);

                    return Promise.resolve(data);
                }
            ]
        };
        testRoute(route, function (data) {
            expect(data.payload).to.contain('this is the rail template');
            done();
        });
    });

    it('should not need reply if not defined as prehandler (object with `method` property)', function (done) {
        let mockComponent = {
            component: 'basicComponent'
        };
        let route = {
            path: '/bar',
            adapters: [
                function (context, request) {

                    let data = {
                        layout: 'railAssoc',
                        associations: {
                            rail: [
                                mockComponent
                            ]
                        }
                    };

                    _.merge(context, data);

                    return Promise.resolve(data);
                }
            ]
        };
        testRoute(route, function (data) {
            expect(data.payload).to.contain('this is the rail template');
            done();
        });
    });

    it('should act as decorators', function (done) {
        let route = {
            path: '/foo',
            adapters: [
                function (context, request) {
                    context.attributes.setByFirstAdapter = 'this was set by first adapter';
                    return Promise.resolve(context);
                }, function (context, request) {
                    expect(context.attributes.setByFirstAdapter).to.contain('this was set by first adapter');
                    done();
                }
            ]
        };
        testRoute(route, () => {});
    });

});
