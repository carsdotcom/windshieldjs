var path = require('path'),
    Hapi = require('hapi'),
    composer = require('./composer'),
    renderer = require('./renderer'),
    router = require('./router'),
    logger = require('./logger'),
    start;

function Server() {};

Server.prototype = new Hapi.Server();

Server.prototype.configure = function (config) {
    var workingDir = process.argv[1];
    this.config = (typeof config === 'object') ? config : {};
    this.config.appDirName = config.appDirName || 'app';
    this.config.appRoot = path.join(workingDir);
    this.config.appDir = path.join(workingDir, this.config.appDirName);
};

Server.prototype.renderer = renderer;
Server.prototype.composer = composer;
Server.prototype.router = router;
Server.prototype.logger = logger;

start = Server.prototype.start;
Server.prototype.start = function (func) {
    start.call(this, func);
};

module.exports = { Server: Server };
