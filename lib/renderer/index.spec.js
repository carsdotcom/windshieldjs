var renderer = require('./');
var mocks = require('../../test/mocks');

describe("renderer", function () {

    it("should be a function", function () {
        expect(renderer).toEqual(jasmine.any(Function));
    });

});
