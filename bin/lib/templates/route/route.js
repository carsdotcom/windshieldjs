var Promise = require('bluebird');


/**
 *  The function below is just a mock adapter to facilitate a working
 *  example of a route definition.
 *
 *  In actuality, you should write your adapters in separate file and require
 *  them in. Run the scaffolding command again and select adapter to build a
 *  real one.
 */

function dummyAdapterDoNotUse(context) {
    var request = context.request;
    var page = {
        attributes: {
            title: request.params.title || 'this is data from a scaffolded route collection'
        }
    };
    return Promise.resolve(page);
};


// Route collection

module.exports = [
    {
        path: "/scaffolded/{title}",
        adapters: [ dummyAdapterDoNotUse ]
    }
];
