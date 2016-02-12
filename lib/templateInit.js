var _ = require("lodash");
var Promise = require("bluebird");
var handlebars = require('handlebars');

var partials = {};

partials.componentNotFound = handlebars.compile('<p>Component Not Found: {{component}}</p>');

function registerPartialForComponent(handlebars, componentName, component) {
    var promises = _.map(component.templates || {}, (templatePromise, templateName) => {
        return templatePromise.then(function (source) {
            return partials['partial_' + componentName + '_' + templateName] = handlebars.compile(source);
        });
    });

    return Promise.all(promises);
}

function registerPartials(handlebars, components) {
    var partialPromises = _.map(components, (component, name) => {
        return registerPartialForComponent(handlebars, name, component);
    });

    return Promise.all(partialPromises);
}

function getAssociationRenderer(associationName) {
    return function renderAssociation(association) {

        var partialPrefix = "partial_" + association.component;
        var preferredPartial = partialPrefix + "_" + associationName;
        var defaultPartial = partialPrefix + "_default";

        if (partials[preferredPartial]) {
            return partials[preferredPartial](association);
        } else if (partials[defaultPartial]) {
            return partials[defaultPartial](association);
        } else {
            return partials.componentNotFound(association);
        }
    };
}

function getAssociationHelper(handlebars) {
    return function associationHelper(name) {
        var chunks, association;

        if (this.associations && this.associations[name]) {
            association = this.associations[name];
            chunks = _.map(association, getAssociationRenderer(name));
            return new handlebars.SafeString(chunks.join("\n"));
        }
    };
}

module.exports = _.once(function (handlebars, components) {
    handlebars.registerHelper('assoc', getAssociationHelper(handlebars));
    return registerPartials(handlebars, components);
});
