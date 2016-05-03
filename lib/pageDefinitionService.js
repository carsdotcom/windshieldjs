/**
 * Created by jcsokolow on 5/3/16.
 */

var _ = require('lodash');
var Promise = require('bluebird');

module.exports = function (adapters, request, context) {

    _.each(request.pre, function (pre) {
        _.merge(context, pre);
    });

    return Promise
        .map(adapters, run)
        .each(assign);

    function run(adapter) {
        return adapter(context, request);
    }

    function assign(toAssign) {
        _.merge(context, toAssign);
    }

};