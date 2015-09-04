var path = require('path'),
    fs = require('fs'),
    Promise = require('bluebird'),
    _ = require('lodash'),
    shortid = require('shortid'),
    handlebars = require('handlebars'),
    logger = require('../logger'),
    promiseCachedFile = _.memoize(Promise.promisify(fs.readFile)),
    paths;

module.exports = function (reply) {
    var self = this;

    paths = (paths != null) ? paths : require(path.join(self.config.appRoot, 'app', 'mappings', 'componentPaths.json'));

    function composeTupel(name, source) {
        return new Promise(function (resolve, reject) {
            resolve([ name, source ]);
        });
    }

    function createTemplatePartial(component) {
        var filePromise;

        component.partial = 'partial' + shortid.generate();

        try {
            filePromise = promiseCachedFile(path.join(self.config.appRoot, paths[component.component], 'templates', 'default.html'), 'utf-8');
        } catch (e) {
            logger.error("`" + component.component + "` component not found.");
            filePromise = promiseCachedFile(path.join(__dirname, '..', 'templates', 'notFound.html'), 'utf-8');
        }
        return filePromise.then(_.partial(composeTupel, component.partial));
    }

    return function (data) {
        var componentPromises = [];

        _.forEach(data.associations, function (component) {
            componentPromises = componentPromises.concat(_.map(component, createTemplatePartial));
        });

        Promise.all(componentPromises).then(function (partials) {
            _.forEach(partials, function (partial) {
                handlebars.registerPartial.apply(handlebars, partial);
            });
            reply.view(path.join(paths[data.layout]), data);
        });
    };
};
