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
    var page = {
        attributes: {
            title: context.name
        }
    };
    return Promise.resolve(page);
};


// route collection

module.exports = [

    // scaffolded route
    {
        path: "/scaffolded-<%= name %>",
        context: {
            name: "<%= name %>"
        },
        adapters: [ dummyAdapterDoNotUse ]
    }

];
