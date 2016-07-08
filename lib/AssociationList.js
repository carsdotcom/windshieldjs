var _ = require('lodash');
var Promise = require('bluebird');

function AssociationList(associations) {
    this.associations = associations;
}

AssociationList.prototype.evaluateArray = function (definitions, name, ctx, req, components) {
    var componentPromises = [];

    definitions.forEach(function (definintion) {
        var component = components.getComponent(definintion.component);
        var promise = component.render(definintion, ctx, req, name);
        componentPromises.push(promise);
    });

    return Promise.all(componentPromises);
};

AssociationList.prototype.evaluate = function (ctx, req, components) {
    var self = this;
    var associationResults = {};
    var associationPromises = [];

    _.forIn(this.associations, function (definitions, name) {
        var promise = self.evaluateArray(definitions, name, ctx, req, components).then(function (components) {
            associationResults[name] = components;
        });

        associationPromises.push(promise);
    });

    return Promise.all(associationPromises).then(function () {
        return associationResults;
    });
};

module.exports = AssociationList;
