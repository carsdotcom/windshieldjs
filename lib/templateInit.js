var _ = require("lodash");
var Promise = require("bluebird");
var handlebars = require('handlebars');

var partials = {};

partials.componentNotFound = handlebars.compile('<p>Component Not Found: {{name}}</p>');

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

function getComponentRenderer(associationName) {
    return function renderComponent(component) {

        var partialPrefix = "partial_" + component.name;
        var preferredPartial = partialPrefix + "_" + associationName;
        var defaultPartial = partialPrefix + "_default";

        if (partials[preferredPartial]) {
            return partials[preferredPartial](component.data);
        } else if (partials[defaultPartial]) {
            return partials[defaultPartial](component.data);
        } else {
            return partials.componentNotFound(component);
        }
    };
}

function getAssociationHelper(handlebars) {
    return function associationHelper(name) {
        var chunks, association;

        if (this.associations && this.associations[name]) {
            association = this.associations[name];
            chunks = _.map(association, getComponentRenderer(name), null);
            return new handlebars.SafeString(chunks.join("\n"));
        }
    };
}

module.exports = _.once(function (handlebars, components) {
    handlebars.registerHelper('assoc', getAssociationHelper(handlebars));
    return registerPartials(handlebars, components);
});
