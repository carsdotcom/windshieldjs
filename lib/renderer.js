"use strict";

var path = require('path');
var Promise = require('bluebird');
var _ = require('lodash');
var Boom = require('boom');
var ComponentNotFoundError = require('./ComponentNotFoundError');

module.exports = Renderer;

function Renderer(windshield) {
    var options = windshield.options;
    var server = windshield.server;
    return renderer;

    function renderer(reply) {


        return function (data) {


            return Promise.resolve(null).then(function (partials) {

                var layoutPath = path.join('layouts', data.layout);

                return reply.view(layoutPath, data);
            });
        };
    }
}
