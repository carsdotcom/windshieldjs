var winston = require('winston'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    logsDir = path.join(process.cwd(), 'logs');

mkdirp(logsDir, function (err) {
    console.log('created `logs` directory at', logsDir);
    if (err) console.error(err)
});

module.exports = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({
            name: 'info-log',
            filename: path.join(process.cwd(), '..', 'logs', 'info.log'),
            level: 'info'
        }),
        new (winston.transports.File)({
            name: 'error-log',
            filename: path.join(process.cwd(), '..', 'logs', 'error.log'),
            level: 'error'
        })
    ]
});
