'use strict';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const Promise = require("bluebird");
const Component = require('../../lib/Component');
const ComponentMap = require('../../lib/Component/Map');
const Handlebars = require('handlebars');

describe("The Component Map", function () {

    let sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });


    describe("Loading the map initially", function () {

        let component1, component2, map;

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

            let components = {
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
