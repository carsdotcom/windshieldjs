var router = require('./');
var mocks = require('../../test/mocks');

describe("router", function () {

    it("should be a function", function () {
        expect(router).toEqual(jasmine.any(Function));
    });

});
