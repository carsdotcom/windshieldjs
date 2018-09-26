'use strict';
const AssociationMap = require('./AssociationMap');

module.exports.associationIterator = associationIterator;

function associationIterator(context, request, componentMap, associations) {

    let associationMap = AssociationMap(associations, componentMap);

    return associationMap.render(context, request);
}