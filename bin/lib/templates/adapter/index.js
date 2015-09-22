var Promise = require('bluebird');

module.exports = function (context) {
    return new Promise(function (resolve, reject) {
        resolve({
            layout: 'default',
            attributes: {
                title: 'Foo'
            },
            associations: {
                // add named asssociations here
            }
        });
    });
};

