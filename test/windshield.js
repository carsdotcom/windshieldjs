"use strict";
var os = require('os');
var assert = require('assert');
var path = require('path');
var async = require('async');
var Hapi = require('hapi');
var vision = require('vision');
var mkdirp = require('mkdirp');

var helpers = require('./helpers');

var windshield = require('../');

var registerWithOptions = helpers.registerWithOptions;
var tmpBase = path.join(os.tmpdir(), 'windshield', Date.now().toString());

describe('windshield plugin', function () {

    it('should export an object with a register method', function () {
        assert.equal(typeof windshield, 'object');
        assert.equal(typeof windshield.register, 'function');
    });

    describe('registering', function () {


    });
});
