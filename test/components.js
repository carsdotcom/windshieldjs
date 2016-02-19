"use strict";
var _ = require('lodash');

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

    it('should use the template which matches the name of the association they belong to', function (done) {
        var mockComponent = {
            component: 'basicComponent'
        };
        var route = {
            path: '/bar',
            adapters: [{
                method: function (context, request, reply) {

                    var data = {
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
