
const _ = require('lodash');

const composerGenerator = require('./composeTemplateData.composer');

/**
 * Composes a function that we can use as a Hapi route handler for Windshield.
 *
 * We can't define the handler function at run-time because we won't know
 * all the required information until the Windshield plugin is registered.  So
 * this function will build it for us when we're ready.
 *
 * The resulting handler will use the Hapi Vision plugin to parse a template
 * with a set of data to produce an HTML page.
 *
 * @param {logger} logFunc            - A simple function for accessing Hapi's server.log
 * @param {ComponentMap} componentMap - Description of all available Windshield components
 * @returns {handler}                 - A Hapi route handler configured for Windshield
 */
function composer(logFunc, componentMap) {

    const composeTemplateData = composerGenerator(logFunc, componentMap);


    /**
     * @callback {handler}
     * @param {Request} - The Hapi request object
     * @param {Reply}   - The Hapi reply interface
     * @returns {Promise<Reply>} Promise that resolves with the reply interface
     */
    return function handler(request, reply) {

        return composeTemplateData(request)
            .then(({ template, data }) => {
                // use hapi vision plugin to render from template with data.
                let visionReply = reply.view(template, data);

                // add all headers to the reply object
                let headers = data.attributes.headers || {};

                let finalResult = _.reduce(headers, (result, value, key) => {
                    return result.header(key, value);
                }, visionReply);

                return finalResult;
            })
            .catch(catchAndReply);

        function catchAndReply(err) {
            logFunc('error', err);
            if (process.env.NODE_ENV === 'production') {
                return reply(err);
            } else {
                return reply(err.stack.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;")).code(500);
            }
        }
    };
}

module.exports = composer;