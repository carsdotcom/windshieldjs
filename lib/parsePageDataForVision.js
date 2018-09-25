'use strict';
const path = require('path');

module.exports = parsePageDataForVision;


function transformData(attributes, assoc) {

    let {exported, markup} = assoc;
    let newData = {
        attributes,
        exported,
        assoc: markup
    };

    return newData;
}

function parsePageDataForVision({attributes, assoc, layout}) {
    let data = transformData(attributes, assoc);

    let template = path.join('layouts', layout);

    return {
        template,
        data
    };
}