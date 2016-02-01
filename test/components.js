"use strict";

var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var helpers = require('./helpers');
var fixtureComponents = require('./fixtures/basic/components');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);

describe('components -', function () {
    var sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    var testRoute = helpers.RouteTester('fixtures/basic');

    it('when a component has an adapter it should be used', function (done) {
        var mockComponent = {
            component: 'componentWithAdapter',
            data: {
                attributes: { content: 'foo' }
            }
        };
        var route = {
            path: '/bar',
            adapters: [ function () {
                return Promise.resolve({
                    associations: {
                        main: [
                            mockComponent
                        ]
                    }
                });
            }]
        };
        sandbox.spy(fixtureComponents.componentWithAdapter, 'adapter');
        testRoute(route, function (response) {
            expect(fixtureComponents.componentWithAdapter.adapter).to.have.been.calledWith(mockComponent.data);
            done();
        });
    });

    it('should use the template which matches the name of the association they belong to', function (done) {
        var mockComponent = {
            component: 'basicComponent'
        };
        var route = {
            path: '/bar',
            adapters: [ function () {
                return Promise.resolve({
                    layout: 'railAssoc',
                    associations: {
                        rail: [
                            mockComponent
                        ]
                    }
                });
            }]
        };
        testRoute(route, function (data) {
            expect(data.payload).to.contain('this is the rail template');
            done();
        });
    });

});
