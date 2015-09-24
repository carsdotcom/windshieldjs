var Promise = require('bluebird');

// You should write your adapters in separate file and require them in.
// The function below is just a mock adapter to facilitate a working
// example of a route definition.

function fooAdapter(context) {
    return new Promise(function (resolve, reject) {
        resolve({
            attributes: {
                title: context.request.params.title || 'foo'
            }
        });
    });
};

module.exports = [
    {
        path: "/foo/{title}",
        adapters: [ fooAdapter ]
    }
];
