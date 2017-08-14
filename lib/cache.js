'use strict';
const Promise = require('bluebird');
const levelup = require('levelup');
const ttl = require('level-ttl');
const parse = require('fast-json-parse');
let cache = levelup('./windshield-cache');
const defaultTTL = 1000 * 60 * 5; // 5 minutes
const defaultConfig = {
    ttl: defaultTTL,
    query: true
};
const _ = require('lodash');

cache = ttl(cache, { defaultTTL });

function get(key) {
    return new Promise((resolve, reject) => {
        cache.get(key, (err, value) => {
            if (err) return reject(err);
            return resolve(value);
        });
    });
}

function put(key, value, options) {
    options = options || {};
    return new Promise((resolve, reject) => {
        cache.put(key, value, options, (err) => {
            if (err) return reject(err);
            return resolve(value);
        });
    });
}

function batch(operations, options) {
    options = options || {};
    return new Promise((resolve, reject) => {
        cache.batch(operations, options, (err) => {
            if (err) return reject(err);
            return resolve();
        });
    });
}
const fastJsonStringify = require('fast-json-stringify');

const headerStringify = fastJsonStringify({
    title: 'header schema',
    type: 'object',
    additionalProperties: { type: 'string' }
});

const genericStringify = fastJsonStringify({
    title: 'generic object schema',
    type: 'object',
    additionalProperties: true
});

function getParsed(v) {
    const parsed = parse(v);
    if (parsed.err) return Promise.reject(parsed.err);
    return Promise.resolve(parsed.value);
};

function getPage(request) {
    const cacheConfig = processConfig(request.route.settings.app.cache, request);
    const keys = getPageKeys(request);
    return Promise.all([ getObject(keys.headers).catch(() => {}), get(keys.markup) ]);
}

function putObject(key, value, options) {
    options = options || {};
    return put(key, genericStringify(value), options)
        .then(() => value);
}

function getObject(key) {
    return get(key)
        .then(getParsed);
}

function putPage(request, values) {
    const cacheConfig = processConfig(request.route.settings.app.cache, request);
    const keys = getPageKeys(request);
    const operations = [];
    if (values.markup) {
        operations.push({
            type: 'put',
            key: keys.markup,
            value: values.markup
        });
        if (values.headers) {
            operations.push({
                type: 'put',
                key: keys.headers,
                value: headerStringify(values.headers)
            });
        }
    }
    if (operations.length) {
        return batch(operations)
            .then(() => values)
            .catch(() => values);
    } else {
        return Promise.resolve(values);
    }
}

function getPageKeys(request) {
    const cacheConfig = processConfig(request.route.settings.app.cache, request);
    return {
        headers: getKey('headers', request, cacheConfig),
        markup: getKey('markup', request, cacheConfig)
    };
}

function processConfig(cacheConfig, request) {
    if (cacheConfig === true) return defaultConfig;
    if (cacheConfig === false) return false;
    if (_.isFunction(cacheConfig)) {
        let customConfig = cacheConfig(request);
        if (!_.isFunction(customConfig)) {
            return processConfig(customConfig, request);
        } else {
            return false;
        }
    } else if (_.isObject(cacheConfig)) {
        let customConfig = cacheConfig;
        return Object.assign({}, defaultConfig, customConfig);
    } else {
        return false;
    }
}

function getKey(prefix, request, config) {
    if (_.isEmpty(prefix)) throw new Error('cache key prefix is required');
    let key = `${prefix}`;
    if (_.isObject(config) && !config.global) {
        if (config.key) {
            key += `.${key}`;
        } else if (config.query) {
            key += `.${request.url.path}`;
        } else {
            key += `.${request.url.pathname}`;
        }
    }
    return key;
}

module.exports = {
    get,
    put,
    batch,
    getPage,
    putPage,
    getObject,
    putObject,
    processConfig,
    getKey
};
