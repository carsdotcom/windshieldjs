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

function once(fn) {
    let result;

    return function() {
        if(fn) {
            result = fn.apply(this, arguments);
            fn = null;
        }

        return result;
    };
}

module.exports = once(function (handlebars) {
    handlebars.registerHelper('assoc', getAssociationHelper(handlebars));
    handlebars.registerHelper('exported', getExportedHelper(handlebars));
});
