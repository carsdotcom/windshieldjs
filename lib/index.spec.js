var rewire = require('rewire');
var index = rewire('./');
var internals = index.__get__('internals');
var generateMocks = require('../test/mocks');

describe('windshield index', function () {
    var mocks;

    beforeEach(function () {
        mocks = generateMocks();
        // no ugly log messages in test report
        index.__set__('logger', mocks.logger);
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
    });
});
