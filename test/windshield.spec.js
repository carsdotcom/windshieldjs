"use strict";
const os = require('os');
const assert = require('assert');
const path = require('path');
const async = require('async');
const Hapi = require('hapi');
const vision = require('vision');
const mkdirp = require('mkdirp');
const helpers = require('./helpers');
const windshield = require('../');
const registerWithOptions = helpers.registerWithOptions;
const tmpBase = path.join(os.tmpdir(), 'windshield', Date.now().toString());

describe('windshield plugin', function () {

    it('should export an object with a register method', function () {
        assert.equal(typeof windshield, 'object');
        assert.equal(typeof windshield.register, 'function');
    });

    describe('registering', function () {

    });
});
