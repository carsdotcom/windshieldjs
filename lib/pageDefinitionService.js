'use strict';
const _ = require('lodash');
const Promise = require('bluebird');

module.exports = pageDefinitionService;

/**
 * Runs a series of Windshield adapters and merges the results to the Windshield context
 *
 * @param {pageAdapter[]} adapters
 * @param {Request} request
 * @param {module:processRoutes.Context} context
 *
 * @returns {Promise<undefined>} Resolves when all adapters have finished
 */
function pageDefinitionService(adapters, request, context) {

    // request.pre will contain the response values for each prerequisite defined
    // for the route in processRoutes.js
    _.each(request.pre, function (pre) {
        _.merge(context, pre);
    });

    return Promise
        .map(adapters, run)
        .each(assign);

    function run(adapter) {
        // note that the adapter could perform any number of side effects that mutate context
        return adapter(context, request);
    }

    function assign(toAssign) {
        // here we're explicitly mutating context as a side effect
        _.merge(context, toAssign);
    }

}
