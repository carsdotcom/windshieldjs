'use strict';
const _ = require('lodash');
const Promise = require('bluebird');

module.exports = pageDefinitionService;

function pageDefinitionService(adapters, request, context) {

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

}
