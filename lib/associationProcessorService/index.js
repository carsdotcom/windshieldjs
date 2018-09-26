'use strict';
const AssociationMap = require('./AssociationMap');

module.exports.associationIterator = associationIterator;

function associationIterator(context, request, componentMap, associations) {

    let associationList = AssociationMap(associations, componentMap);

    return associationList.render(context, request);
}