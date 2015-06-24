var Promise = require('bluebird'),
    _ = require('lodash');

module.exports = function () {
    var args,
        context,
        pageAdapter,
        associationAdapters;

    args = Array.prototype.slice.call(arguments, 0);

    if (!args[1]) throw new Error('You must supply at least two arguments');

    context = args.shift();
    pageAdapter = args.shift();

    if (!args[0]) {

        return pageAdapter(context);

    } else {

        associationAdapters = args;

        function assignAssociations(pageDefinition) {
            return new Promise(function (resolve, reject) {
                associationAdapters.forEach(function (assocAdapter) {
                    assocAdapter(context).then(function (associations) {
                        _.assign(pageDefinition.associations, associations);
                    });
                });
                resolve(pageDefinition);
            });
        }

        return pageAdapter(context).then(assignAssociations);
    }
};
