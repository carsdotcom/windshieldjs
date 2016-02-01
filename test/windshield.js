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
        it('should log an error if the options are invalid', function (done) {
            var opts = {};
            registerWithOptions(opts, function(err) {
                assert(err);
                assert(/ValidationError/.test(err));
                done();
            });
        });

        it('should throw an error if the helpers directory can not be found', function (done) {
            var baseDir = path.join(tmpBase, 'empty');
            async.series([
                mkdirp.bind(null, baseDir),
                test
            ], done);

            function test(cb) {
                var opts = {
                    rootDir: baseDir,
                    routes: []
                };
                registerWithOptions(opts, function(err) {
                    assert(err);
                    assert(/ENOENT/.test(err));
                    assert(/helpers/.test(err));
                    cb();
                });
            }
        });

    });
});
