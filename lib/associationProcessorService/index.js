'use strict';
const AssociationMap = require('./AssociationMap');

module.exports.associationIterator = associationIterator;

function associationIterator(context, request, components, associations) {

    let associationList = AssociationMap(associations, components);

    return associationList.render(context, request);
}

