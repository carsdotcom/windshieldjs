var Promise = require('bluebird');

module.exports = function (context) {
    var page = {
        layout: "default",
        attributes: {
            title: "scaffold"
        },
        associations: {
            main: [
                {
                    component: "scaffolded",
                    template: "default",
                    data: {
                        attributes: {
                            content: "this is data from a scaffolded adapter",
                            adSize: "pencil-leader"
                        }
                    }
                }
            ]
        }
    };
    return Promise.resolve(page);
};

