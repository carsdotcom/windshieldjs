'use strict';
/**
 * @module parsePageDataForVision
 */

// TODO: Consolidate this code with buildTemplateData.composer
// All we're doing here is rearranging the data

const path = require('path');

module.exports = parsePageDataForVision;


function transformData(attributes, assoc) {

    const {exported, markup} = assoc;
    return {
        attributes,
        exported,
        assoc: markup
    };
}



/**
 * An object describing a template file and data that can be used to compile the template
 *
 * @typedef {Object} module:parsePageDataForVision.TemplateData
 * @property {string} template        - The path to a Handlebars template file
 * @property {object} data            - The data that will be used to compile the template into HTML
 * @property {object} data.attributes
 * @property {object} data.exported
 * @property {Object.<string, string>} data.assoc - Hashmap of association names and HTML markup
 */


/**
 *
 * @param {object} attributes
 * @param {RenderedComponentCollection} assoc
 * @param {string} layout
 * @returns {module:parsePageDataForVision.TemplateData}
 */
function parsePageDataForVision({attributes, assoc, layout}) {
    const data = transformData(attributes, assoc);
    const template = path.join('layouts', layout);

    return {
        template,
        data
    };
}