var rewire = require('rewire');
var composer = rewire('./');
var generateMocks = require('../../test/mocks');
var paths = {
    'foo': 'foo',
    'bar': 'bar',
    'baz': 'baz',
    'qux': 'qux'
};

describe("composer", function () {
    var mocks;

    beforeEach(function () {
        mocks = generateMocks();
    });

    it("should be a function", function () {
        expect(composer).toEqual(jasmine.any(Function));
    });

    it("should be called with at least two arguments", function (done) {
        var catcher = jasmine.createSpy();
        composer.call(mocks.windshieldCallContext).catch(catcher).finally(function () {
            expect(catcher).toHaveBeenCalled();
            done();
        });
    });

    it("should be called with at least two arguments", function (done) {
        var catcher = jasmine.createSpy();
        composer.call(mocks.windshieldCallContext, mocks.genericContext).catch(catcher).finally(function () {
            expect(catcher).toHaveBeenCalled();
            done();
        });
    });

    it("should be called with at least two arguments", function (done) {
        var catcher = jasmine.createSpy();
        composer.call(mocks.windshieldCallContext, mocks.genericContext, mocks.genericAdapter).catch(catcher).finally(function () {
            expect(catcher).not.toHaveBeenCalled();
            done();
        });
    });

    it("should be called with a context object and all additional arguments should be adapter functions", function (done) {
        var catcher = jasmine.createSpy();
        composer.call(mocks.windshieldCallContext, mocks.genericContext, 'foo').catch(catcher).finally(function () {
            expect(catcher).toHaveBeenCalled();
            done();
        });
    });

    it("should be called with a context object and all additional arguments should be adapter functions", function (done) {
        var catcher = jasmine.createSpy();
        composer.call(mocks.windshieldCallContext, mocks.genericContext, mocks.genericAdapter, 'foo').catch(catcher).finally(function () {
            expect(catcher).toHaveBeenCalled();
            done();
        });
    });

    it("should be called with a context object and all additional arguments should be adapter functions", function (done) {
        var catcher = jasmine.createSpy();
        composer.call(mocks.windshieldCallContext, mocks.genericContext, mocks.genericAdapter, 'foo', 'bar').catch(catcher).finally(function () {
            expect(catcher).toHaveBeenCalled();
            done();
        });
    });

    it("should be called with a context object and all additional arguments should be adapter functions", function (done) {
        var catcher = jasmine.createSpy();
        composer.call(mocks.windshieldCallContext, mocks.genericContext, mocks.genericAdapter, mocks.genericAdapter, 'bar').catch(catcher).finally(function () {
            expect(catcher).toHaveBeenCalled();
            done();
        });
    });

    it("should be called with a context object and all additional arguments should be adapter functions", function (done) {
        var catcher = jasmine.createSpy();
        composer.call(mocks.windshieldCallContext, mocks.genericContext, mocks.genericAdapter).catch(catcher).finally(function () {
            expect(catcher).not.toHaveBeenCalled();
            done();
        });
    });

    it("should be called with a context object and all additional arguments should be adapter functions", function (done) {
        var catcher = jasmine.createSpy();
        composer.call(mocks.windshieldCallContext, mocks.genericContext, mocks.genericAdapter, mocks.genericAdapter).catch(catcher).finally(function () {
            expect(catcher).not.toHaveBeenCalled();
            done();
        });

    });

    it("should be called with a context object and all additional arguments should be adapter functions", function (done) {
        var catcher = jasmine.createSpy();
        composer.call(mocks.windshieldCallContext, mocks.genericContext, mocks.genericAdapter, mocks.genericAdapter, mocks.genericAdapter).catch(catcher).finally(function () {
            expect(catcher).not.toHaveBeenCalled();
            done();
        });

    });

    it("should resolve with a page object which has had associations for each adapter added to it", function (done) {
        composer.call(mocks.windshieldCallContext, mocks.genericContext, mocks.pageAdapter, mocks.assocAdapter, mocks.assocAdapter2).then(function (page) {
            expect(!!page.associations.main.length).toEqual(true);
            expect(!!page.associations.secondary.length).toEqual(true);
            expect(!!page.associations.tertiary.length).toEqual(true);
            expect(page.associations.tertiary[0].component).toEqual('baz');
            done();
        });
    });

    it("should resolve with a page object which has had associations for each adapter added to it and the last association should take precedence in the case of a conflict", function (done) {
        composer.call(mocks.windshieldCallContext, mocks.genericContext, mocks.pageAdapter, mocks.assocAdapter, mocks.assocAdapter2, mocks.assocAdapter3).then(function (page) {
            expect(page.associations.tertiary[0].component).toEqual('qux');
            done();
        });
    });

});
