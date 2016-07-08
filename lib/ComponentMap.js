var _ = require('lodash');
var Promise = require('bluebird');
var Component = require('./Component');

function ComponentMap(components) {
    this.components = {};
    this.rawComponents = components;
}

ComponentMap.prototype.init = function () {
    var self = this;
    var loadPromises = [];

    _.forIn(self.rawComponents, function (raw, name) {
        var comp = new Component(raw);
        loadPromises.push(comp.loadTemplates());
        self.components[name] = comp;
    });

    return Promise.all(loadPromises);
};

ComponentMap.prototype.getComponent = function (name) {
    return this.components[name];
};

module.exports = ComponentMap;