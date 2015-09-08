var Promise = require('bluebird');
var _ = require('lodash');

module.exports = function () {

    var args;
    var context;
    var pageAdapter;
    var associationAdapters;

    args = Array.prototype.slice.call(arguments, 0);

    if (!args[1]) throw new Error('You must supply at least two arguments');

    context = args.shift();
    pageAdapter = args.shift();

    if (!args[0]) {

        return pageAdapter(context);

    } else {

        associationAdapters = _.map(args, function (v) {
            if (typeof v !== 'function') {
                throw new Error('Adapters must be functions');
            } else {
                return v;
            }
        });

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
