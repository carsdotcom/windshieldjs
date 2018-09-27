'use strict';
const renderAssocMapComposer = require('./renderAssocMap.composer');

module.exports.associationIterator = associationIterator;

/**
 *
 * @param {module:processRoutes.Context} context
 * @param {Request} request - Hapi request object
 * @param {ComponentMap} componentMap - Data structure representing all available Windshield components
 * @returns {Promise.<RenderedAssocMap>}
 */
function associationIterator(context, request, componentMap) {
    let renderAssociationMap = renderAssocMapComposer(context, request, componentMap);
    return renderAssociationMap(context.associations);
}