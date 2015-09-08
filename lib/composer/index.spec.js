var composer = require('./');
var fakeContext = {};
var fakePromise = {
    then: function (func) {
        return func.apply(this, arguments);
    },
    catch: function () {},
    finally: function () {}
};
var fakeAdapter = function () {
    return fakePromise;
};
var noop = function () {};

describe('composer', function () {

    it('should be a function', function () {
        expect(composer).toEqual(jasmine.any(Function));
    });

    it('should be called with at least two arguments', function () {
        expect(function () { composer(); }).toThrow();
        expect(function () { composer(fakeContext); }).toThrow();
        expect(function () { composer(fakeContext, fakeAdapter); }).not.toThrow();
    });

    it('should be called with a context object and all additional arguments should be adapter functions', function () {
        expect(function () { composer(fakeContext, 'foo').then(noop); }).toThrow();
        expect(function () { composer(fakeContext, fakeAdapter, 'foo').then(noop); }).toThrow();
        expect(function () { composer(fakeContext, fakeAdapter, 'foo', 'bar').then(noop); }).toThrow();
        expect(function () { composer(fakeContext, fakeAdapter, fakeAdapter, 'bar').then(noop); }).toThrow();
        expect(function () { composer(fakeContext, fakeAdapter).then(noop); }).not.toThrow();
        expect(function () { composer(fakeContext, fakeAdapter, fakeAdapter).then(noop); }).not.toThrow();
        expect(function () { composer(fakeContext, fakeAdapter, fakeAdapter, fakeAdapter).then(noop); }).not.toThrow();
    });

});
