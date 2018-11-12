'use strict';
const merge = require('lodash.merge');
const helpers = require('./helpers');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

describe('page adapters -', function () {
    let sandbox;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        sandbox.restore();
    });

    let testRoute = helpers.RouteTester('fixtures/basic');

    it('should use response if defined as prehandler (object with `method` property)', function () {
        let mockComponent = {
            component: 'basicComponent'
        };
        let route = {
            path: '/bar',
            adapters: [{
                method: function (context, request, h) {

                    let data = {
                        layout: 'railAssoc',
                        associations: {
                            rail: [
                                mockComponent
                            ]
                        }
                    };

                    merge(context, data);

                    return Promise.resolve(data);
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

                    merge(context, data);

                    return Promise.resolve(data);
                }
            ]
        };
        return testRoute(route)
            .then(function (data) {
                return expect(data.payload).to.contain('this is the rail template');
            });
    });

    it('should not need response if not defined as prehandler (object with `method` property)', function () {
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

                    merge(context, data);

                    return Promise.resolve(data);
                }
            ]
        };
        return testRoute(route).then(function (data) {
            return expect(data.payload).to.contain('this is the rail template');
        });
    });

    it('should act as decorators', function () {
        let route = {
            path: '/foo',
            adapters: [
                function (context, request) {
                    context.attributes.setByFirstAdapter = 'this was set by first adapter';
                    return Promise.resolve(context);
                },
                function (context, request) {
                    expect(context.attributes.setByFirstAdapter).to.contain('this was set by first adapter');
                }
            ]
        };
        return testRoute(route);
    });

});
