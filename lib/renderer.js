'use strict';
const _ = require('lodash');
const path = require('path');
const Promise = require('bluebird');

module.exports = Renderer;

function Renderer() {
    return function renderer(reply) {
        return function (data) {
            let newData = {};
            newData.attributes = data.attributes;
            newData.exported = data.assoc.exported;
            newData.assoc = data.assoc.markup;
            let headers = newData.attributes.headers || {};

            return Promise.resolve(null).then(function () {
                let layoutPath = path.join('layouts', data.layout);
                return _.reduce(headers, (result, value, key) => result.header(key, value), reply.view(layoutPath, newData));
            });
        };
    };
}
