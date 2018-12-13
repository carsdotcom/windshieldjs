"use strict";
const assert = require('assert');
const windshield = require('../');

describe('windshield plugin', function () {

    it('should export an object with a register method', function () {
        assert.equal(typeof windshield, 'object');
        assert.equal(typeof windshield.register, 'function');
    });

    describe('registering', function () {

    });
});
