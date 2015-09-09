var winston = require('winston');
var path = require('path');
var mkdirp = require('mkdirp');

var internals = {
    logsDir: path.join(process.cwd(), 'logs')
};

mkdirp(internals.logsDir, function (err) {
    if (err) console.error(err)
});

module.exports = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({
            name: 'info-log',
            filename: path.join(internals.logsDir, 'info.log'),
            level: 'info'
        }),
        new (winston.transports.File)({
            name: 'error-log',
            filename: path.join(internals.logsDir, 'error.log'),
            level: 'error'
        })
    ]
});
