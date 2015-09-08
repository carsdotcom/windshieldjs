// Load modules

var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var _ = require('lodash');
var shortid = require('shortid');
var handlebars = require('handlebars');
var logger = require('../logger');

// Delcare internals

var internals = {
    promiseCachedFile: _.memoize(Promise.promisify(fs.readFile)),
    paths: null
};

module.exports = function (reply) {

    var self = this;

    // this path shouldn't be hard-coded to a strict convention ... let's make
    // it configurable
    internals.paths = (internals.paths != null) ? internals.paths : require(path.join(self.settings.rootDir, 'app', 'mappings', 'componentPaths.json'));

    function composeTupel(name, source) {
        return new Promise(function (resolve, reject) {
            resolve([ name, source ]);
        });
    }

    function createTemplatePartial(component) {
        var filePromise;

        component.partial = 'partial' + shortid.generate();

        try {
            filePromise = internals.promiseCachedFile(path.join(self.settings.rootDir, internals.paths[component.component], 'templates', 'default.html'), 'utf-8');
        } catch (e) {
            logger.error("`" + component.component + "` component not found.");
            filePromise = internals.promiseCachedFile(path.join(__dirname, 'notFound.html'), 'utf-8');
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
            reply.view(path.join(internals.paths[data.layout]), data);
        });
    };
};
