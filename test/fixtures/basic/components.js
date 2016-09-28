var Promise = require('bluebird');

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
    }
};
