"use strict";
var _ = require('lodash');
var path = require('path');
var Promise = require('bluebird');

module.exports = Renderer;

function Renderer() {
    return function renderer(reply) {
        return function (data) {
            var newData = {};
            newData.attributes = data.attributes;
            newData.exported = data.assoc.exported;
            newData.assoc = data.assoc.markup;

            return Promise.resolve(null).then(function () {
                var layoutPath = path.join('layouts', data.layout);
                return reply.view(layoutPath, newData);
            });
        };
    };
}
