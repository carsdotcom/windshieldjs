var rewire = require('rewire');
var router = rewire('./');
var generateMocks = require('../../test/mocks');
var internals = router.__get__('internals');

describe("router", function () {

    beforeEach(function () {
        mocks = generateMocks();
    });


    it("should be a function.", function () {
        expect(router).toEqual(jasmine.any(Function));
    });


    it("optionally takes an options object which can contain a URI context and a routes array", function () {
        expect(function () { router.call(mocks.windshieldCallContext); }).not.toThrow();
        expect(function () { router.call(mocks.windshieldCallContext, { routes: mocks.routes }); }).not.toThrow();
        expect(function () { router.call(mocks.windshieldCallContext, { context: '/mock-context' }); }).not.toThrow();
        expect(function () { router.call(mocks.windshieldCallContext, { context: '/mock-context', routes: mocks.routes }); }).not.toThrow();
    });

    it("each route within the routes array must have a path string, context object, and adapters array", function () {
        expect(function () { router.call(mocks.windshieldCallContext, { routes: mocks.routes }); }).not.toThrow();
        expect(function () { router.call(mocks.windshieldCallContext, { routes: mocks.invalidRoutes1 }); }).toThrow();
        expect(function () { router.call(mocks.windshieldCallContext, { routes: mocks.invalidRoutes2 }); }).toThrow();
        expect(function () { router.call(mocks.windshieldCallContext, { routes: mocks.invalidRoutes3 }); }).toThrow();
    });

    it("when provided with an a URI context will prefix all paths with the given context", function () {
        expect(mocks.server.routes).toEqual([]);
        router.call(mocks.windshieldCallContext, { uriContext: '/mock-context', routes: mocks.routes });
        expect(mocks.server.routes[0].path.substring(0, 13)).toEqual('/mock-context');
    });

    it("when not provided with an a URI context will default this context to the value `/windshield`", function () {
        expect(mocks.server.routes).toEqual([]);
        router.call(mocks.windshieldCallContext, { routes: mocks.routes });
        expect(mocks.server.routes[0].path.substring(0, 11)).toEqual('/windshield');
    });

});
