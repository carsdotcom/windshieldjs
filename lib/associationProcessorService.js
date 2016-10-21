"use strict";

/**
 * Created by jcsokolow on 5/3/16.
 */
var AssociationMap = require("./AssociationMap");
/**
 * This function processes child associations before parents.
 */
function associationIterator(context, request, components, associations) {

    //console.log("Association Processor Service: components: ", components);

    // console.log("aps: creating map");
    var associationList = AssociationMap(associations, components);
    // console.log("aps: map created");

    return associationList.render(context, request).then(function (result) {
        // console.log(result.exported);
        return result;
    });

}

module.exports.runAssociationIterator = associationIterator;
