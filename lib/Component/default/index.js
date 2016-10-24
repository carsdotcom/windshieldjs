'use strict';
const path = require('path');
const readTemplate = require('../../readTemplate');

module.exports.templates = {
    default: readTemplate(path.join(__dirname, 'templates/default.hbs'))
};

module.exports.adapter = function (data) {
    return {
        componentName: data.calledName,
        componentList: data.componentList
    };
};
