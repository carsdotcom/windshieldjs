var path = require('path'),
    _ = require('lodash'),
    Hapi = require('hapi'),
    defaultConfig = {
        server: {
            port: 1337
        }
    };

function Server(config) {
    var workingDir = process.argv[1];
    this.config = this.config || defaultConfig;
    _.assign(this.config, (typeof config === 'object') ? config : {});
    this.config.appDirName = this.config.appDirName || 'app';
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

Server.prototype = new Hapi.Server();

Server.prototype.composer = require('./composer');
Server.prototype.renderer = require('./renderer');
Server.prototype.router = require('./router');
Server.prototype.logger = require('./logger');

module.exports = Server;
