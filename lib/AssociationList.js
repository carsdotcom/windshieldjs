var _ = require('lodash');
var Promise = require('bluebird');

function AssociationList(associations) {
    var self = {};

    function evaluateNestedAssociations(definition, ctx, request, components) {

        // var nestedList;

        // if (_.isEmpty(definition.associations)) {
            return Promise.resolve({});
        // } else {
        //     nestedList = new AssociationList(definition.associations);
        //     return nestedList.evaluate(ctx, request, components);
        // }

    }

    function renderOneComponent(definition, name, ctx, req, components){
        return evaluateNestedAssociations(definition, ctx, req, components).then(function (nestedResults) {
            var component = components.getComponent(definition.component);
            return component.render(definition, ctx, req, name);
        });
    }

    function evaluateArray(definitions, name, ctx, req, components) {
        var componentPromises = [];

        definitions.forEach(function (definintion) {
            componentPromises.push(renderOneComponent(definintion, name, ctx, req, components));
        });

        return Promise.all(componentPromises);
    }

    function renderArray(definitions, name, ctx, req, components){
        return evaluateArray(definitions, name, ctx, req, components).then(function (components) {

            var markup = [];
            var exported = {};

            components.forEach(function (component) {
                _.merge(exported, component.exported || {});
                markup.push(component.markup);
            });

            return {
                markup: markup.join("\n"),
                exported
            }

        });
    }

    self.evaluate = function (ctx, req, components) {
        var exported = {};
        var associationResults = {};
        var associationPromises = [];

        _.forIn(associations, function (definitions, name) {

            var promise = renderArray(definitions, name, ctx, req, components).then(function (components) {
                associationResults[name] = components.markup;
                _.merge(exported, components.exported);
            });

            associationPromises.push(promise);
        });

        return Promise.all(associationPromises).then(function () {
            return {
                exported,
                markup: associationResults
            };
        });
    };

    return self;
}







module.exports = AssociationList;
