"use strict";

var path = require('path');
var Promise = require('bluebird');

module.exports = Renderer;

function Renderer(windshield) {
    return function renderer(reply) {
        return function (data) {
            var newData = {};
            newData.attributes = data.attributes;
            newData.exported = data.assoc.exported;
            newData.assoc = data.assoc.markup;

            console.log("DATA: ", JSON.stringify(newData, null, 4));
            return Promise.resolve(null).then(function () {
                var layoutPath = path.join('layouts', data.layout);
                return reply.view(layoutPath, newData);
            });
        };
    };
}
