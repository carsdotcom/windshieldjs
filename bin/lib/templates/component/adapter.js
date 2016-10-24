'use strict';
const Promise = require('bluebird');

module.exports = function (context, page, req) {
    return Promise.resolve({
        data: {
            content: "foo"
        }
    });
};
