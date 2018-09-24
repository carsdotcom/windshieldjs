'use strict';
const _ = require('lodash');
const path = require('path');
const Promise = require('bluebird');

module.exports = renderer;


function transformData(attributes, assoc) {

    let {exported, markup} = assoc;
    let newData = {
        attributes,
        exported,
        assoc: markup
    };

    return newData;
}

function renderer(reply) {
    return function ({attributes, assoc, layout}) {

        let newData = transformData(attributes, assoc);

        let headers = newData.attributes.headers || {};

        let layoutPath = path.join('layouts', layout);

        // use hapi vision plugin to render from template at layoutPath with newData.
        let visionReply = reply.view(layoutPath, newData);

        // add all headers to the result
        let finalResult = _.reduce(headers, (result, value, key) => {
            return result.header(key, value);
        }, visionReply);

        return Promise.resolve(finalResult);
    };
}