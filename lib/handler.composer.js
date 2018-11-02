
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
 * @param {ComponentMap} componentMap - Description of all available Windshield components
 * @returns {handler}                 - A Hapi route handler configured for Windshield
 */
function composer(componentMap) {

    const buildTemplateData = buildTemplateDataComposer(componentMap);


    /**
     * @callback {handler}
     * @param {Request} request - The Hapi request object
     * @param {Toolkit} h   - The Hapi response toolkit
     * @returns {Promise<Response>} Promise that resolves with the response
     */
    return async function handler(request, h) {

        try {
            const {template, data} = await buildTemplateData(request);
            return compileTemplateAndReply({template, data});
        } catch (err) {
            return catchAndReply(err);
        }



        /**
         * Use Hapi Vision plugin to compile HTML from a template and some page data.
         * This will also iterate through headers to add to the response toolkit
         *
         * @param {string} template - The path to a Handlebars file
         * @param {object} data - The context for parsing the template
         * @returns {Response} - A Hapi response object.
         */
        function compileTemplateAndReply({template, data}) {
            const visionReply = h.view(template, data);
            const headers = data.attributes.headers || {};


            return _.reduce(headers, (result, value, key) => {
                return result.header(key, value);
            }, visionReply);
        }

        function catchAndReply(err) {
            request.server.log('error', err);
            if (process.env.NODE_ENV === 'production') {
                return err;
            }

            const errMsg = err.stack.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;");

            return h.response(errMsg).code(500);
        }
    };
}

module.exports = composer;