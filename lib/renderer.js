"use strict";

var path = require('path');
var Promise = require('bluebird');

module.exports = Renderer;

function Renderer(windshield) {
    return function renderer(reply) {
        return function (data) {
            //console.log("DATA: ", JSON.stringify(data, null, 4));
            return Promise.resolve(null).then(function () {
                var layoutPath = path.join('layouts', data.layout);
                return reply.view(layoutPath, data);
            });
        };
    };
}
