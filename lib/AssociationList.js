var _ = require('lodash');
var Promise = require('bluebird');

function AssociationList(associations) {
    this.associations = associations;
}

function evaluateNestedAssociations(definition, ctx, request, components) {

    var nestedList;

    if (_.isEmpty(definition.associations)) {
        return Promise.resolve({});
    } else {
        nestedList = new AssociationList(definition.associations);
        return nestedList.evaluate(ctx, request, components);
    }

}

AssociationList.prototype.evaluateArray = function (definitions, name, ctx, req, components) {
    var componentPromises = [];

    definitions.forEach(function (definintion) {
        var promise = evaluateNestedAssociations(definintion, ctx, req, components).then(function (nestedResults) {

            var component = components.getComponent(definintion.component);

            definintion.associations = nestedResults;

            return component.render(definintion, ctx, req, name).then(function (result) {
                result.associations = nestedResults;
                return result;
            });

        });

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
