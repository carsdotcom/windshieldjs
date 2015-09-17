var fs = require('fs');
module.exports = function () {
    var mocks = {};

    mocks.genericContext = {};

    mocks.noop = function () {};

    mocks.page = {
        layout: "mockLayout",
        attributes: {
            title: "mock page"
        },
        associations: {
            main: [
                { component: "foo" }
            ]
        }
    };

    mocks.assoc = {
        associations: {
            secondary: [
                { component: "bar" }
            ]
        }
    };

    mocks.assoc2 = {
        associations: {
            tertiary: [
                { component: "baz" }
            ]
        }
    };

    mocks.assoc3 = {
        associations: {
            tertiary: [
                { component: "qux" }
            ]
        }
    };


    mocks.genericPromise = {
        then: function (func) {
            return func.apply(this, arguments);
        },
        catch: function () {},
        finally: function () {}
    };

    mocks.pagePromise = {
        then: function (func) {
            return func.call(this, mocks.page);
        },
        catch: function () {},
        finally: function () {}
    };

    mocks.assocPromise = {
        then: function (func) {
            return func.call(this, mocks.assoc);
        },
        catch: function () {},
        finally: function () {}
    };

    mocks.assocPromise2 = {
        then: function (func) {
            return func.call(this, mocks.assoc2);
        },
        catch: function () {},
        finally: function () {}
    };

    mocks.assocPromise3 = {
        then: function (func) {
            return func.call(this, mocks.assoc3);
        },
        catch: function () {},
        finally: function () {}
    };

    mocks.genericAdapter = function () {
        return mocks.genericPromise;
    };

    mocks.pageAdapter = function () {
        return mocks.pagePromise;
    };

    mocks.assocAdapter = function () {
        return mocks.assocPromise;
    };

    mocks.assocAdapter2 = function () {
        return mocks.assocPromise2;
    };

    mocks.assocAdapter3 = function () {
        return mocks.assocPromise3;
    };

    mocks.reply = {
        view: function () {}
    };

    mocks.composer = function () {
        return mocks.genericPromise;
    };

    mocks.renderer = function () {
        return function () {
            return mocks.genericPromise;
        };
    };

    mocks.renderer = function () {
        return function () {
            return mocks.genericPromise;
        };
    };

    mocks.router = function () {
    };

    mocks.logger = {
        log: mocks.noop,
        error: mocks.noop,
        info: mocks.noop
    };

    mocks.windshieldCallContext = {
        composer: mocks.composer,
        renderer: mocks.renderer,
        router: mocks.router,
        logger: mocks.logger,
        settings: {
            rootDir: '/mock',
            paths: {}
        }
    };

    mocks.server = {
        routes: [],
        route: function (route) {
            this.routes.push(route);
        },
        views: mocks.noop,
        expose: mocks.noop
    };

    mocks.options = {
        rootDir: 'mockDir'
    };

    mocks.routes = [
        {
            path: '/mock-route-1',
            context: mocks.genericContext,
            adapters: [ mocks.pageAdapter, mocks.assocAdapter ]
        },
        {
            path: '/mock-route-2',
            context: mocks.genericContext,
            adapters: [ mocks.pageAdapter, mocks.assocAdapter ]
        }
    ];

    mocks.invalidRoutes1 = [
        {
            path: {},
            context: mocks.genericContext,
            adapters: [ mocks.pageAdapter, mocks.assocAdapter ]
        },
        {
            path: [],
            context: mocks.genericContext,
            adapters: [ mocks.pageAdapter, mocks.assocAdapter ]
        },
        {
            path: function () {},
            context: mocks.genericContext,
            adapters: [ mocks.pageAdapter, mocks.assocAdapter ]
        },
        {
            path: 123,
            context: mocks.genericContext,
            adapters: [ mocks.pageAdapter, mocks.assocAdapter ]
        }
    ];

    mocks.invalidRoutes2 = [
        {
            path: '/mock-route',
            context: '',
            adapters: [ mocks.pageAdapter, mocks.assocAdapter ]
        },
        {
            path: '/mock-route',
            context: [],
            adapters: [ mocks.pageAdapter, mocks.assocAdapter ]
        },
        {
            path: '/mock-route',
            context: function () {},
            adapters: [ mocks.pageAdapter, mocks.assocAdapter ]
        },
        {
            path: '/mock-route',
            context: 123,
            adapters: [ mocks.pageAdapter, mocks.assocAdapter ]
        }
    ];

    mocks.invalidRoutes3 = [
        {
            path: '/mock-route',
            context: mocks.genericContext,
            adapters: ''
        },
        {
            path: '/mock-route',
            context: mocks.genericContext,
            adapters: {}
        },
        {
            path: '/mock-route',
            context: mocks.genericContext,
            adapters: function () {}
        },
        {
            path: '/mock-route',
            context: mocks.genericContext,
            adapters: 123
        }
    ];

    mocks.fs = fs;
    var originalRealpathSync = fs.realpathSync;
    mocks.fs.realpathSync = function () {
        try {
            return originalRealpathSync.apply(fs, Array.prototype.slice.call(arguments, 0));
        } catch (e) {}
    };

    return mocks;
};
