/*
var windshield = require('../index'),
    server = new windshield.Server(),
    Promise = require('bluebird');

server.configure();

describe("renderer", function () {
    var mockReply,
        mockData;

    beforeEach(function () {
        mockReply = {
            view: function () {}
        };
        mockData = {
            layout: 'OneColumnPageLayout',
            associations: {
                main: [
                    {
                        component: 'ComponentOne',
                        partial: 'componentOne123'
                    },
                    {
                        component: 'ComponentTwo',
                        partial: 'componentTwo123'
                    }
                ]
            }
        };
    });

    it("should exist", function () {
        expect(server.renderer).toEqual(jasmine.any(Function));
    });

    it("returns a function", function () {
        expect(server.renderer(mockReply)).toEqual(jasmine.any(Function));
    });

    it("the returned function returns a Promise", function () {
        expect(server.renderer(mockReply)(mockData) instanceof Promise).toBe(true);
    });
});

var rewire =  require('rewire'),
    path = require('path'),
    Model = require('./Model'),
    Promise = require('bluebird'),
    config = require(global.appConfigPath),
    mockPaths = {
        'OneColumnPageLayout': 'foo/bar',
        'ComponentOne': 'baz/qux',
        'ComponentTwo': 'fizz/buzz',
        //'NotFound': 'app/components/common/NotFound'
        'NotFound': 'fooooo'
    },
    controller = rewire('./controller');

controller.__set__('paths', mockPaths);

describe("oneColumn controller", function () {
    var mockReply,
        mockData,
        fs;

    beforeEach(function () {
        mockReply = {
            view: function () {}
        };
        mockData = {
            layout: 'OneColumnPageLayout',
            associations: {
                main: [
                    {
                        component: 'ComponentOne',
                        partial: 'componentOne123'
                    },
                    {
                        component: 'ComponentTwo',
                        partial: 'componentTwo123'
                    }
                ]
            }
        };
        fs = controller.__get__('fs');
        spyOn(fs, 'readFile').and.callFake(function (path, enc, cb) { cb(null, 'success'); });
    });

    it("should exist", function () {
        expect(controller).toEqual(jasmine.any(Function));
    });

    it("should return a promise", function () {
        expect(controller(mockReply, mockData) instanceof Promise).toEqual(true);
    });

    it("should make a call to read the partial template file for each item in the main collection", function (done) {
        controller(mockReply, mockData).finally(function () {
            expect(fs.readFile).toHaveBeenCalled();
            expect(fs.readFile.calls.count()).toEqual(mockData.associations.main.length);
            done();
        });
    });

    it("should eventually call reply.view with template location and layout model", function (done) {
        var mockModel = new Model(mockData);
        spyOn(mockReply, 'view');
        controller(mockReply, mockData).finally(function () {
            expect(mockReply.view).toHaveBeenCalledWith('foo/bar/OneColumnPageLayoutTemplate', mockModel);
            done();
        });
    });

});

*/
