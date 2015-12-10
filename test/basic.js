var path = require('path');
var Promise = require('bluebird');
var fs = require('fs');

var testRoute = require('./testRoute')('basic-fixtures');

describe('basic', function () {
    describe('route', function () {
        it('can be defined with just a path and a single adapter', function (done) {
            var route = {
                path: '/bar',
                adapters: [ function () { return Promise.resolve({}); }]
            };
            testRoute(route, function (response) {
                expect(response.statusCode).toEqual(200);
                done();
            });
        });
    });

    it('custom layout should be used when layout property defined in page definition', function (done) {
        var route = {
            path: '/bar',
            adapters: [ function () { return Promise.resolve({ layout: 'other' }); }]
        };
        testRoute(route, function (response) {
            expect(response.statusCode).toEqual(200);
            expect(response.result).toEqual(fs.readFileSync(path.normalize(testRoute.fixturePath + '/layouts/other.html'), { encoding: 'utf8' }));
            done();
        });
    });
});
