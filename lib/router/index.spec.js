var rewire = require('rewire');
var router = rewire('./');
var generateMocks = require('../../test/mocks');
var internals = router.__get__('internals');

describe("router", function () {

    beforeEach(function () {
        mocks = generateMocks();
        // no ugly log messages in test report
        router.__set__('logger', mocks.logger);
    });


    it("should be a function.", function () {
        expect(router).toEqual(jasmine.any(Function));
    });

    describe("returned function", function () {

        it("optional takes an options object which can contain a URI context and a routes array", function () {
            expect(function () { router(mocks.server)(); }).not.toThrow();
            expect(function () { router(mocks.server)({ routes: mocks.routes }); }).not.toThrow();
            expect(function () { router(mocks.server)({ context: '/mock-context' }); }).not.toThrow();
            expect(function () { router(mocks.server)({ context: '/mock-context', routes: mocks.routes }); }).not.toThrow();
        });

        it("each route within the routes array must have a path string, context object, and adapters array", function () {
            expect(function () { router(mocks.server)({ routes: mocks.routes }); }).not.toThrow();
            expect(function () { router(mocks.server)({ routes: mocks.invalidRoutes1 }); }).toThrow();
            expect(function () { router(mocks.server)({ routes: mocks.invalidRoutes2 }); }).toThrow();
            expect(function () { router(mocks.server)({ routes: mocks.invalidRoutes3 }); }).toThrow();
        });

        it("when provided with an a URI context will prefix all paths with the given context", function () {
            expect(mocks.server.routes).toEqual([]);
            router(mocks.server)({ uriContext: '/mock-context', routes: mocks.routes });
            expect(mocks.server.routes[0].path.substring(0, 13)).toEqual('/mock-context');
        });

        it("when not provided with an a URI context will default this context to the value `/windshield`", function () {
            expect(mocks.server.routes).toEqual([]);
            router(mocks.server)({ routes: mocks.routes });
            expect(mocks.server.routes[0].path.substring(0, 11)).toEqual('/windshield');
        });
    });

    describe("route handler", function () {

        var routeHandler;

        beforeEach(function () {
            routeHandler = internals.generateRouteHandler(mocks.windshieldCallContext, mocks.routes[0]);
        });

        it("should call composer with context object and each adapter", function () {
            spyOn(mocks.windshieldCallContext, 'composer').and.callThrough();
            routeHandler();
            expect(mocks.windshieldCallContext.composer).toHaveBeenCalledWith(mocks.genericContext, mocks.pageAdapter, mocks.assocAdapter);

        });
    });
});
