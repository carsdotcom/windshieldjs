var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);
var Promise = require("bluebird");
var Component = require('../../lib/Component');
var ComponentMap = require('../../lib/Component/Map');
var Handlebars = require('handlebars');

describe("The Component Map", function () {

    var sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });


    describe("Loading the map initially", function () {

        var component1, component2, map;

        beforeEach(function (done) {

            component1 = {
                adapter: sandbox.spy(),
                templates: {
                    "assoc": {
                        then: sandbox.spy(function (cb) {
                            cb("assoc");
                        })
                    }
                }
            };

            component2 = {
                adapter: sandbox.spy(),
                templates: {
                    "jawjawjaw": {
                        then: sandbox.spy(function (cb) {
                            cb("jaw");
                        })
                    },
                    "heehaw": {
                        then: sandbox.spy(function (cb) {
                            cb("heehaw");
                        })
                    }
                }
            };

            var components = {
                component1,
                component2
            };

            map = ComponentMap(components);
            map.init(Handlebars).then(function () {
                done();
            });
        });

        it("should have called all the loaders for all the templates", function () {
            expect(component1.templates.assoc.then.callCount).to.equal(1);
            expect(component2.templates.jawjawjaw.then.callCount).to.equal(1);
            expect(component2.templates.heehaw.then.callCount).to.equal(1);
        });

        it("should have added all the components to it's list", function () {
            expect(map.components.component1.implementation).to.equal(component1);
            expect(map.components.component2.implementation).to.equal(component2);
        });

        describe("Getting a component by name", function () {

            it("should return the named component instance on request", function () {
                expect(map.getComponent("component1").implementation).to.equal(component1);
            });

        });

    });


});