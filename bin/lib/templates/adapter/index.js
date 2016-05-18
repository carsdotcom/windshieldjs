var Promise = require('bluebird');

module.exports = function (context) {
    var page = {
        attributes: {
            title: "<%= name %>"
        },
        associations: {
            main: [
                {
                    component: "scaffolded",
                    data: {
                        attributes: {
                            content: "this is data from a scaffolded adapter"
                        }
                    }
                }
            ]
        }
    };
    return Promise.resolve(page);
};

