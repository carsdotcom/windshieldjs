var _ = require("lodash");
var Promise = require("bluebird");
var handlebars = require('handlebars');

function getAssociationHelper(handlebars) {
    return function associationHelper(name) {

        // console.log("----------------------------------------Rendering association: ", name, this.assoc[name]);
        return new handlebars.SafeString((this.assoc && this.assoc[name]) || "");
    };
}

function getExportedHelper(handlebars) {
    return function exportedHelper(lookupPath) {
        return new handlebars.SafeString("");
    };
}

module.exports = _.once(function (handlebars) {
    handlebars.registerHelper('assoc', getAssociationHelper(handlebars));
    handlebars.registerHelper('exported', getExportedHelper(handlebars));
});
