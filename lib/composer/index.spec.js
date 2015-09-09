var rewire = require('rewire');
var composer = rewire('./');
var noop = function () {};
var composerInternals = composer.__get__('internals');
var mocks = require('../../test/mocks');


describe("composer", function () {

    it("should be a function", function () {
        expect(composer).toEqual(jasmine.any(Function));
    });

    it("should be called with at least two arguments", function () {
        expect(function () { composer(); }).toThrow();
        expect(function () { composer(mocks.genericContext); }).toThrow();
        expect(function () { composer(mocks.genericContext, mocks.genericAdapter); }).not.toThrow();
    });

    it("should be called with a context object and all additional arguments should be adapter functions", function () {
        expect(function () { composer(mocks.genericContext, 'foo').then(noop); }).toThrow();
        expect(function () { composer(mocks.genericContext, mocks.genericAdapter, 'foo').then(noop); }).toThrow();
        expect(function () { composer(mocks.genericContext, mocks.genericAdapter, 'foo', 'bar').then(noop); }).toThrow();
        expect(function () { composer(mocks.genericContext, mocks.genericAdapter, mocks.genericAdapter, 'bar').then(noop); }).toThrow();
        expect(function () { composer(mocks.genericContext, mocks.genericAdapter).then(noop); }).not.toThrow();
        expect(function () { composer(mocks.genericContext, mocks.genericAdapter, mocks.genericAdapter).then(noop); }).not.toThrow();
        expect(function () { composer(mocks.genericContext, mocks.genericAdapter, mocks.genericAdapter, mocks.genericAdapter).then(noop); }).not.toThrow();
    });

    it("should resolve with a page object which has had associations for each adapter added to it", function (done) {
        composer(mocks.genericContext, mocks.pageAdapter, mocks.assocAdapter, mocks.assocAdapter2).then(function (page) {
            expect(!!page.associations.main.length).toEqual(true);
            expect(!!page.associations.secondary.length).toEqual(true);
            expect(!!page.associations.tertiary.length).toEqual(true);
            expect(page.associations.tertiary[0].component).toEqual('baz');
            done();
        });
    });

    it("should resolve with a page object which has had associations for each adapter added to it and the last association should take precedence in the case of a conflict", function (done) {
        composer(mocks.genericContext, mocks.pageAdapter, mocks.assocAdapter, mocks.assocAdapter2, mocks.assocAdapter3).then(function (page) {
            expect(page.associations.tertiary[0].component).toEqual('qux');
            done();
        });
    });

});
