"use strict";
const _ = require('lodash');
const Promise = require('bluebird');

function AssociationList(name, associations, components){

    let self = {};

    function evaluateNestedAssociations(definition, ctx, request) {

        var nestedList;

        if (_.isEmpty(definition.associations)) {
            return Promise.resolve({});
        } else {
            nestedList = AssociationMap(definition.associations, components);
            return nestedList.render(ctx, request);
        }

    }

    function renderOneComponent(definition, ctx, req){
        return evaluateNestedAssociations(definition, ctx, req).then(function (nestedResults) {
            let component = components.getComponent(definition.component);

            definition.associations = nestedResults;

            return component.render(definition, ctx, req, name);
        });
    }

    function evaluateArray(ctx, req) {
        var componentPromises = [];

        associations.forEach(function (definintion) {
            componentPromises.push(renderOneComponent(definintion, ctx, req, components));
        });

        return Promise.all(componentPromises);
    }

    self.render = function render(ctx, req){
        return evaluateArray(ctx, req).then(function (components) {

            var markup = [];
            var exported = {};


            components.forEach(function (component) {
                _.merge(exported, component.exported || {});
                markup.push(component.markup);
            });

            return {
                markup: markup.join("\n"),
                exported
            };

        });
    };

    return self;
}

function AssociationMap(associationMap, components) {

    let self = {};

    // console.trace();
    // console.log("AssociationMap: components: ", components);

    function renderNamedAssociation(ctx, req, definitions, name){

        console.log("AssociationMap: Creating list");
        let associationList = AssociationList(name, definitions, components);
        return associationList.render(ctx, req);

    }

    self.render = function (ctx, req) {
        var exported = {};
        var associationResults = {};
        var associationPromises = [];



        _.forIn(associationMap, function (definitions, name) {

            var promise = renderNamedAssociation(ctx, req, definitions, name).then(function (components) {
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

module.exports = AssociationMap;
