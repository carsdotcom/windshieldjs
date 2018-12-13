const _ = require('lodash');

function getAssociationHelper(handlebars) {
    return function associationHelper(name) {
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
