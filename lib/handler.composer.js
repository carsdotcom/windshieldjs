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
function requestHandlerComposer(componentMap) {

    const buildTemplateData = buildTemplateDataComposer(componentMap);


    /**
     * @async
     * @callback {handler}
     *
     * Handles an incoming request to a Hapi route configured by a Windshield server.
     * The request is handled with by using Windshield to produce a Handlebars
     * template and a set of template source data, which are then passing into the
     * Hapi Vision plugin to generate an HTML response.
     *
     * @param {Request} request - The Hapi request object
     * @param {Toolkit} h       - The Hapi response toolkit
     * @returns {Promise<Response>} Promise that resolves with the response
     */
    return async function handler(request, h) {

        try {
            const {template, data} = await buildTemplateData(request);

            // The Hapi vision plugin adds the view() method to the response toolkit
            const visionResponse = h.view(template, data);
            const headers = data.attributes.headers || {};

            // add headers to the response object one by one
            return Object.entries(headers).reduce((vResponse, [key, value]) => {
                return vResponse.header(key, value);
            }, visionResponse);

        } catch (err) {
            request.server.log('error', err);
            if (process.env.NODE_ENV === 'production') {
                return err;
            }

            const errMsg = err.stack.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;");

            return h.response(errMsg).code(500);
        }
    };
}

module.exports = requestHandlerComposer;