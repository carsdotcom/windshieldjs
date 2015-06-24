var path = require('path'),
    Promise = require('bluebird'),
    _ = require('lodash');

module.exports = function (reply) {
    var self = this;
    return function (data) {
        return new Promise(function (resolve, reject) {
            var layout = data.layout;
            try {
                resolve(require(path.join(self.config.appDir, 'layouts', layout, 'controller'))(reply, data));
            } catch (e) {
                reject('layout `' + layout + '` not found. ' + e);
            }
        });
    };
};
