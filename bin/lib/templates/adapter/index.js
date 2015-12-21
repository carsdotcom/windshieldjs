var Promise = require('bluebird');

module.exports = function (context) {
    var page = {
        layout: 'default',
        attributes: {
            title: 'scaffold',
            foo: 'bar'
        },
        associations: {
            // add named asssociations here
        }
    };
    return Promise.resolve(page);
};

