var path = require('path'),
    Hapi = require('hapi'),
    start;

function Server() {};

Server.prototype = new Hapi.Server();

Server.prototype.composer = require('./composer');
Server.prototype.renderer = require('./renderer');
Server.prototype.router = require('./router');
Server.prototype.logger = require('./logger');

Server.prototype.configure = function (config) {
    var workingDir = process.argv[1];
    this.config = (typeof config === 'object') ? config : {};
    this.config.appDirName = config.appDirName || 'app';
    this.config.appRoot = workingDir;
    this.config.appDir = path.join(workingDir, this.config.appDirName);
    this.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: workingDir,
        path: './'
    });
};

start = Server.prototype.start;

Server.prototype.start = function (func) {

    start.call(this, func);
};

module.exports = { Server: Server };
