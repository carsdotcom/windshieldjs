'use strict';
const Promise = require('bluebird');

module.exports = {
    basicComponent: {
        templates: {
            default: Promise.resolve('this is the default template'),
            rail: Promise.resolve('this is the rail template')
        }
    },
    componentWithAdapter: {
        templates: {
            default: Promise.resolve('<p>{{content}}</p>')
        },
        adapter: function (data) {
            return Promise.resolve({
                data: {
                    content: data.attributes.content
                },
                "export": {
                    test: "Hello"
                }
            });
        }
    },
    componentWithModel: {
        templates: {
            default: Promise.resolve('<p>{{content}}</p>')
        },
        Model: function (data) {
            return data.attributes;
        }
    },

    'helloworld': {
        templates: {
            default: Promise.resolve('<h1>{{message}}</h1>'),
            shout: Promise.resolve('<h1>{{uppercase message}}</h1>')
        },
        adapter: function(context, page, request) {
            return Promise.resolve({
                message: 'Hello world!'
            });
        }
    },
    container: {
        templates: {
            default: Promise.resolve(`<section>{{assoc 'stuff'}}</section>`)
        },
        adapter: function(context, page, request) {
            return Promise.resolve({});
        }
    }
};
