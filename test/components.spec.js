"use strict";
const merge = require('lodash.merge');
const helpers = require('./helpers');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

describe('components -', function () {
    let sandbox;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        sandbox.restore();
    });

    const testRoute = helpers.RouteTester('fixtures/basic');

    it('should use the template which matches the name of the association they belong to', function () {
        const mockComponent = {
            component: 'basicComponent'
        };
        const route = {
            path: '/bar',
            adapters: [{
                method: function (context, request, h) {

                    const data = {
                        layout: 'railAssoc',
                        associations: {
                            rail: [
                                mockComponent
                            ]
                        }
                    };

                    merge(context, data);

                    return Promise.resolve(data);
                },
                assign: 'test'
            }]
        };
        return testRoute(route).then(function (data) {
            expect(data.payload).to.contain('this is the rail template');
        });
    });

});
