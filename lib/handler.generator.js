
const _ = require('lodash');

const composerGenerator = require('./composeTemplateData.generator');


function generator(logFunc, componentMap) {

    const composeTemplateData = composerGenerator(logFunc, componentMap);


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

module.exports = generator;