'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const adapter = require('..');
const mockContext = {};

describe('<%= name %> adapter', function () {
    let sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should resolve with an object', function (done) {
        adapter(mockContext).then(function (data) {
            expect(data).to.be.an('object');
            return;
        }).finally(done);
    });
});
