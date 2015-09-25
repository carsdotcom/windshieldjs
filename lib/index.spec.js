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

        it('should log an error if the options are invalid', function (done) {
            var invalidOptions = {};
            spyOn(mocks.server, 'log').and.callFake(function () {});
            index.register(mocks.server, invalidOptions, function () {
                expect(mocks.server.log).toHaveBeenCalled();
                done();
            });
        });

        it('should call server.views', function (done) {
            spyOn(mocks.server, 'views').and.callThrough();
            index.register(mocks.server, mocks.options, function () {
                expect(mocks.server.views).toHaveBeenCalled();
                done();
            });
        });

        it('should expose settings', function (done) {
            spyOn(mocks.server, 'expose').and.callThrough();
            index.register(mocks.server, mocks.options, function () {
                expect(mocks.server.expose).toHaveBeenCalledWith('settings', jasmine.any(Object));
                done();
            });
        });

        it('should expose router', function (done) {
            spyOn(mocks.server, 'expose').and.callThrough();
            index.register(mocks.server, mocks.options, function () {
                expect(mocks.server.expose).toHaveBeenCalledWith('router', jasmine.any(Function));
                done();
            });
        });

        it('should expose composer', function (done) {
            spyOn(mocks.server, 'expose').and.callThrough();
            index.register(mocks.server, mocks.options, function () {
                expect(mocks.server.expose).toHaveBeenCalledWith('composer', jasmine.any(Function));
                done();
            });
        });

        it('should expose renderer', function (done) {
            spyOn(mocks.server, 'expose').and.callThrough();
            index.register(mocks.server, mocks.options, function () {
                expect(mocks.server.expose).toHaveBeenCalledWith('renderer', jasmine.any(Function));
                done();
            });
        });

        it('should expose server', function (done) {
            spyOn(mocks.server, 'expose').and.callThrough();
            index.register(mocks.server, mocks.options, function () {
                expect(mocks.server.expose).toHaveBeenCalledWith('server', jasmine.any(Object));
                done();
            });
        });

    });
});
