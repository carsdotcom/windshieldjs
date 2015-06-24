var path = require('path'),
    del = require('del');

module.exports = function (cb) {
    del([ 'dist' ], cb);
};
