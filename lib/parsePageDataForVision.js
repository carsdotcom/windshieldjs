'use strict';
/**
 * @module parsePageDataForVision
 */

// TODO: Consolidate this code with buildTemplateData.composer
// All we're doing here is rearranging the data

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



/**
 * An object describing a template file and data that can be used to compile the template
 *
 * @typedef {Object} module:parsePageDataForVision.TemplateData
 * @property {string} template      - The path to a Handlebars template file
 * @property {object} data          - The data that will be used to compile the template into HTML
 */


/**
 *
 * @param {object} attributes
 * @param {object} assoc
 * @param {string} layout
 * @returns {module:parsePageDataForVision.TemplateData}
 */
function parsePageDataForVision({attributes, assoc, layout}) {
    let data = transformData(attributes, assoc);

    let template = path.join('layouts', layout);

    return {
        template,
        data
    };
}