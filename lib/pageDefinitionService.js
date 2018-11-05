'use strict';
const _ = require('lodash');
const Promise = require('bluebird');

module.exports = pageDefinitionService;

/**
 * @async
 * Runs a series of Windshield adapters and merges the results to the Windshield context
 *
 * @param {Request} request
 *
 * @returns {Promise<module:processRoutes.Context>} Resolves when all adapters have finished
 */
async function pageDefinitionService(request) {
    const routeSettings = request && request.route && request.route.settings;
    const app = routeSettings && routeSettings.app;

    const context = _.cloneDeep(app.context);
    const adapters = app.adapters;

    // request.pre will contain the response values for each prerequisite defined
    // for the route in processRoutes.js
    _.each(request.pre, function (pre) {
        _.merge(context, pre);
    });

    // wait for the result of each adapter and then merge each one into context.
    return Promise
        .map(adapters, run)
        .reduce(assign, context);

    async function run(adapter) {
        // note that the adapter could perform any number of side effects that mutate context
        return adapter(context, request);
    }

    function assign(accumulator, adapterResult) {
        return _.merge(accumulator, adapterResult);
    }
}
