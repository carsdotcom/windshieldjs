var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
var adapter = require('..');
var mockContext = {};

describe('<%= name %> adapter', function () {
    var sandbox;

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
