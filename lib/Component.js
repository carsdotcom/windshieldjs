/**
 * Created by jcsokolow on 6/28/16.
 *
 */
var _ = require('lodash');
var Promise = require('bluebird');

function Component(implementation) {
    this.implementation = implementation;
}

Component.prototype.hasAdapter = function () {
    return _.isFunction(this.implementation.adapter);
};

Component.prototype.runAdapter = function (data, context, request) {
    var result = this.implementation.adapter(data, context, request);

    if (!result) {
        return Promise.resolve(null);
    } else if (!_.isFunction(result.then)) {
        return Promise.resolve(result);
    } else {
        return result;
    }
};

Component.prototype.hasModel = function () {
    var hasModel = _.isFunction(this.implementation.Model);

    if (hasModel) {
        console.warn("Use of models is Deprecated, please refactor your code to just use an adapter");
    }

    return hasModel;
};


Component.prototype.evaluate = function (definition, context, request) {

    var promise;
    var componentData = definition.data || {};

    if (this.hasAdapter()) {
        promise = this.runAdapter(componentData, context, request);
    } else if (this.hasModel()) {
        promise = Promise.resolve(new this.implementation.Model(componentData));
    } else {
        promise = Promise.resolve(componentData);
    }

    return promise.then(function (data) {

        var result = {};
        data = data || {};

        result.data = {
            name: definition.component,
            layout: definition.layout,
            data: data.data || data || {}
        };

        if (_.isObject(data.export)) {
            var exported = {
                data: data.export,
                exportAs: data.exportAs || definition.component
            };
            result.exported = exported;
        }

        // console.log(result);
        return result;
    });

};

module.exports = Component;