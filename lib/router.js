'use strict';

const Promise = require('bluebird');
const Joi = require('joi');
const _ = require('lodash');
const cache = require('./cache');
const path = require('path');
const readTemplate = require('./readTemplate');
const url = require('url');

let contextSchema = Joi.object().keys({
   layout: Joi.string().default('default'),
   attributes: Joi.object().default({}),
   associations: Joi.object().default({})
}).default({
   layout: 'default',
   attributes: {},
   associations: {}
}).unknown();

let routeSchema = Joi.object().keys({
    method: Joi.string().default('GET'),
    path: Joi.string().required(),
    context: contextSchema,
    adapters: Joi.array().items().default([]),
    pageFilter: Joi.func().optional(),
    cache: Joi.any().optional()
});

let optionsSchema = Joi.object().keys({
    uriContext: Joi.string().allow('').default(''),
    routes: Joi.array().items(routeSchema).default([]),
    rootDir: Joi.string().required(),
    handlebars: Joi.any().required()
});

module.exports = Router;

function Router(windshield) {
    let server = windshield.server;
    let composer = windshield.composer;
    let renderer = windshield.renderer;
    let options = _.pick(windshield.options, [ 'uriContext', 'routes', 'rootDir', 'handlebars' ]);
    let validation = Joi.validate(options, optionsSchema);
    if (validation.error) throw validation.error;

    options = validation.value;

    options.routes.forEach(setupRoute);

    function WrappedHandler(handler) {
        return function wrappedHandler(request, reply) {
            const cacheConfig = request.route.settings.app.cache;
            function callThru() {
                let context;
                if (request.route) {
                    context = request.route.settings.app.context;
                } else {
                    context = {};
                }
                return handler(context, request, reply);
            }

            if (cacheConfig) {
                return cache.getPage(request)
                    .then(() => reply({})) // if cache enabled we don't even care what the route prereq resolves with
                    .catch(callThru);
            } else {
                return callThru();
            }
        };
    }

    function mapToWrappedHandler(handler) {
        return {
            method: WrappedHandler(handler.method),
            assign: handler.assign
        };
    }

    function setupRoute(route) {

        let flattened = _.flatMap(route.adapters);
        let preHandlers = _.remove(flattened, (a) => _.isFunction(a.method));
        let app = {
            context: route.context,
            adapters: flattened,
            cache: route.cache
        };

        if (route.pageFilter) {
            app.pageFilter = route.pageFilter;
        }

        let pre = _.map(preHandlers, mapToWrappedHandler);

        server.route({
            method: route.method,
            path: options.uriContext + route.path,
            handler: Handler(route),
            config: {
                state: {
                    failAction: 'log'
                },
                app,
                pre
            }
        });
    }

    function Handler(route) {
        return function handler(request, reply) {

            function getReplyDataCache() {
                return cache.getPage(request)
                    .then((data) => {
                        const headers = data[0];
                        const markup = data[1];
                        headers['windshield-cache'] = true;
                        return { headers, markup };
                    });
            }

            function setCache(data) {
                return cache.putPage(request, data)
                    .catch((err) => {
                        server.log('error', 'cache put error', err);
                        return data;
                    });
            }

            function render(data) {
                let templateData = {};
                templateData.attributes = data.attributes;
                templateData.exported = data.assoc.exported;
                templateData.assoc = data.assoc.markup;
                const layoutPath = path.join(options.rootDir, 'layouts', `${data.layout}.html`);
                return readTemplate(layoutPath).then((templateStr)=> {
                    const replyData = {};
                    replyData.markup = options.handlebars.compile(templateStr)(templateData);
                    replyData.headers = data.attributes.headers || {};
                    return replyData;
                });
            };

            function handleReply(data) {
                let headers = data.headers || {};
                return _.reduce(headers, (result, value, key) => result.header(key, value), reply(data.markup));
            }

            if (route.cache) {
                return getReplyDataCache()
                    .catch((err) => {
                        server.log('info', 'cache miss', err);
                        return composer(request).then(render).then(setCache);
                    })
                    .then(handleReply)
                    .catch(catchAndReply);
            } else {
                server.log('info', 'cache is off');
                return composer(request)
                    .then(render)
                    .then(handleReply)
                    .catch(catchAndReply);
            }

            function catchAndReply(err) {
                server.log('error', err);
                if (process.env.NODE_ENV === 'production') {
                    return reply(err);
                } else {
                    return reply(err.stack.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;")).code(500);
                }
            }
        };
    }
}
