var _ = require('lodash');
var Promise = require('bluebird');
var Component = require('./Component');

function ComponentMap(components) {
    var self = {};
    self.components = {};
    self.rawComponents = components;

    self.init = function (handlebars) {
        var loadPromises = [];

        _.forIn(self.rawComponents, function (raw, name) {
            var comp = Component(raw);
            loadPromises.push(comp.loadTemplates(handlebars));
            self.components[name] = comp;
        });

        return Promise.all(loadPromises);
    };

    self.getComponent = function (name) {
        return self.components[name];
    };

    return self;

}

module.exports = ComponentMap;