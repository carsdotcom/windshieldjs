var rewire = require('rewire');
var renderer = rewire('./');
var generateMocks = require('../../test/mocks');
var path = require('path');
var fs = renderer.__get__('fs');
var internals = renderer.__get__('internals');

describe("renderer", function () {
    var mocks;

    beforeEach(function () {
        mocks = generateMocks();
        // no ugly log messages in test report
        renderer.__set__('logger', mocks.logger);
    });

    it("should be a function", function () {
        expect(renderer).toEqual(jasmine.any(Function));
    });

    it("should call return a function which takes a page object and then calls reply.view once with a layout path and the given page object", function (done) {
        spyOn(internals, 'cachedFilePromise').and.returnValue(mocks.genericPromise);
        spyOn(mocks.reply, 'view').and.callThrough();
        renderer.call(mocks.windshieldCallContext, mocks.reply)(mocks.page).then(function (){
            expect(mocks.reply.view.calls.count()).toEqual(1);
            expect(mocks.reply.view).toHaveBeenCalledWith('app/layouts/' + mocks.page.layout, mocks.page);
            done();
        })
    });

    it("should call use the notFound template for any component that is not found", function (done) {
        spyOn(internals, 'cachedFilePromise').and.callThrough();
        renderer.call(mocks.windshieldCallContext, mocks.reply)(mocks.page).then(function (){
            expect(internals.cachedFilePromise).toHaveBeenCalledWith(path.join(__dirname, 'notFound.html'), 'utf-8');
            done();
        });
    });

    it("should use path mappings if they exist", function (done) {
        internals.paths = { foo: 'overwritten', mockLayout: 'overwritten' };
        spyOn(internals, 'cachedFilePromise').and.callThrough();
        spyOn(mocks.reply, 'view').and.callThrough();
        renderer.call(mocks.windshieldCallContext, mocks.reply)(mocks.page).then(function (){
            expect(internals.cachedFilePromise).toHaveBeenCalledWith(path.join(mocks.windshieldCallContext.settings.rootDir, 'overwritten', 'templates', 'default.html'), 'utf-8');
            expect(mocks.reply.view).toHaveBeenCalledWith('overwritten', mocks.page);
            done();
        });
    });

});