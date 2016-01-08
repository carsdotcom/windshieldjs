var Promise = require('bluebird');

module.exports = function (context) {
    var page = {
        layout: 'default',
        attributes: {
            title: 'scaffold'
        },
        associations: {
            // add named asssociations here
        }
    };
    return Promise.resolve(page);
};

