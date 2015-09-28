var rewire = require('rewire');
var index = rewire('./');
var generateMocks = require('../test/mocks');
var fs = index.__get__('fs');

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

        //it('should throw an error if the component directory can not be found', function (done) {
        //});

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

        it('if components directory does not exist, exit the process', function () {
            spyOn(process, 'exit').and.callFake(mocks.noop);
            spyOn(fs, 'realpathSync').and.callFake(function (path) {
                if (path === 'badPath/components') {
                    console.log('throwing');
                    throw new Error('error');
                }
            });
            expect(function (done) {
                index.register(mocks.server, { rootDir: 'badPath' }, function () {
                    done();
                });
            }).toThrow();
        });


    });
});
