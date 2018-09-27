
const _ = require('lodash');

const buildTemplateDataComposer = require('./buildTemplateData.composer');

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
 * @param {function} logFunc            - A simple function for accessing Hapi's server.log
 * @param {ComponentMap} componentMap - Description of all available Windshield components
 * @returns {handler}                 - A Hapi route handler configured for Windshield
 */
function composer(logFunc, componentMap) {

    const buildTemplateData = buildTemplateDataComposer(logFunc, componentMap);


    /**
     * @callback {handler}
     * @param {Request} - The Hapi request object
     * @param {Reply}   - The Hapi reply interface
     * @returns {Promise<Reply>} Promise that resolves with the reply interface
     */
    return function handler(request, reply) {

        return buildTemplateData(request)
            .then(compileTemplateAndReply)
            .catch(catchAndReply);


        /**
         * Use Hapi Vision plugin to compile HTML from a template and some page data.
         * This will also iterate through headers to add to the reply interface
         *
         * @param {string} template - The path to a Handlebars file
         * @param {object} data - The context for parsing the template
         * @returns {Reply} - The Hapi reply interface.
         */
        function compileTemplateAndReply({ template, data }) {
            const visionReply = reply.view(template, data);
            const headers = data.attributes.headers || {};

            return _.reduce(headers, (result, value, key) => {
                return result.header(key, value);
            }, visionReply);
        }

        function catchAndReply(err) {
            logFunc('error', err);
            if (process.env.NODE_ENV === 'production') {
                return reply(err);
            }

            return reply(err.stack.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;")).code(500);
        }
    };
}

module.exports = composer;