/**
 * getFiles
 *
 */
var fs = require('fs'),
    path = require('path');

module.exports = function (dir, ext) {
    if (ext == null) {
        ext = '.js';
    }
    return fs.readdirSync(dir)
        .filter(function (file) {
            var stat = fs.statSync(path.join(dir, file));
            return (stat.isFile() && (path.extname(file) === ext));
        });
};
