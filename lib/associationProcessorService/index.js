"use strict";

/**
 * Created by jcsokolow on 5/3/16.
 */
var AssociationMap = require("./AssociationMap");
/**
 * This function processes child associations before parents.
 */
function associationIterator(context, request, components, associations) {

    var associationList = AssociationMap(associations, components);

    return associationList.render(context, request).then(function (result) {
        // console.log(result.exported);
        return result;
    });

}

module.exports.runAssociationIterator = associationIterator;