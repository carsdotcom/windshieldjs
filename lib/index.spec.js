var rewire = require('rewire');
var index = rewire('./');
var generateMocks = require('../test/mocks');

describe('windshield index', function () {
    var mocks;

    beforeEach(function () {
        mocks = generateMocks();
    });

    it('should export an object with a register method', function () {
        expect(index).toEqual(jasmine.any(Object));
        expect(index.register).toEqual(jasmine.any(Function));
    });

    describe('register method', function () {

        it('should call server.views', function () {
            spyOn(mocks.server, 'views').and.callThrough();
            index.register(mocks.server, mocks.options, mocks.noop);
            expect(mocks.server.views).toHaveBeenCalled();
        });

        it('should expose settings', function () {
            spyOn(mocks.server, 'expose').and.callThrough();
            index.register(mocks.server, mocks.options, mocks.noop);
            expect(mocks.server.expose).toHaveBeenCalledWith('settings', jasmine.any(Object));
        });

        it('should expose router', function () {
            spyOn(mocks.server, 'expose').and.callThrough();
            index.register(mocks.server, mocks.options, mocks.noop);
            expect(mocks.server.expose).toHaveBeenCalledWith('router', jasmine.any(Function));
        });

        it('should expose composer', function () {
            spyOn(mocks.server, 'expose').and.callThrough();
            index.register(mocks.server, mocks.options, mocks.noop);
            expect(mocks.server.expose).toHaveBeenCalledWith('composer', jasmine.any(Function));
        });

        it('should expose renderer', function () {
            spyOn(mocks.server, 'expose').and.callThrough();
            index.register(mocks.server, mocks.options, mocks.noop);
            expect(mocks.server.expose).toHaveBeenCalledWith('renderer', jasmine.any(Function));
        });

        it('should expose server', function () {
            spyOn(mocks.server, 'expose').and.callThrough();
            index.register(mocks.server, mocks.options, mocks.noop);
            expect(mocks.server.expose).toHaveBeenCalledWith('server', jasmine.any(Object));
        });

    });
});
