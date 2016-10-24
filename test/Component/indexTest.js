var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);
var Promise = require("bluebird");
var Component = require('../../lib/Component');
const Handlebars = require("handlebars");

describe("the Component object", function () {

    var sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe("When the implementation is empty", function () {

        var component;

        beforeEach(function () {
            component = Component({});
        });

        describe("loadTemplates", function () {


            it("should not have failed", function (done) {
                component.loadTemplates(Handlebars).then(function () {
                    done();
                });
            });

        });

        describe("hasAdapter", function () {

            it("should return false", function () {
                expect(component.hasAdapter()).to.equal(false);
            });

        });

        describe("hasModel", function () {

            it("should return false", function () {
                expect(component.hasModel()).to.equal(false);
            });

        });

        describe("render", function () {

            var result;

            describe("When there is nothing passed in the definition", function () {


                beforeEach(function (done) {
                    component.render({component: "TestComponent"}, {}, {}, "main").then(function (resp) {
                        result = resp;
                        done();
                    });
                });

                describe("the result", function () {

                    it("should be an object with the name set to the definition, empty data, and an undefined layout", function () {
                        expect(result).to.deep.equal({
                            markup: "",
                            exported: {}
                        });
                    });

                });

            });

            describe("When there is data passed in the definition", function () {


                beforeEach(function (done) {
                    var definiton = {
                        component: "TestComponent",
                        layout: "testlayout",
                        data: {
                            test: "123",
                            val: "456"
                        }
                    };

                    component.render(definiton, {}, {}, '').then(function (resp) {
                        result = resp;
                        done();
                    });
                });

                describe("the result", function () {

                    it("should have markup that is an empty string", function () {
                        expect(result.markup).to.equal("");
                    });

                });

            });

        });
    });

    describe("When the implementation adapter returns a promise", function () {

        describe("And has one default template", function () {


            var component, adapter, adapterDef;

            beforeEach(function (done) {
                adapterDef = Promise.defer();

                adapter = sandbox.spy(function () {
                    return adapterDef.promise;
                });

                component = Component({
                    adapter,
                    templates: {
                        "default": Promise.resolve("{{test}}{{value}}")
                    }
                }, "TestComponent");

                component.loadTemplates(Handlebars).then(function () {
                    done();
                });
            });

            describe("hasAdapter", function () {

                it("should return true", function () {
                    expect(component.hasAdapter()).to.equal(true);
                });

            });

            describe("hasModel", function () {

                it("should return false", function () {
                    expect(component.hasModel()).to.equal(false);
                });

            });

            describe("render", function () {

                var result;

                describe("When there is nothing passed in the definition", function () {


                    beforeEach(function (done) {
                        adapterDef.resolve({test: "Result"});

                        component.render({component: "AdaptedComponent"}, "ctx", "req", 'main', 'testCalledName').then(function (resp) {
                            result = resp;
                            done();
                        });
                    });

                    describe("the adapter", function () {

                        it("should have been called", function () {
                            expect(adapter.callCount).to.equal(1);
                        });

                        it("should have been called with default data", function () {
                            expect(adapter.args[0][0]).to.deep.equal({
                                componentName: "TestComponent",
                                calledName: 'testCalledName'
                            });
                        });

                        it("should receive the context as the second argument", function () {
                            expect(adapter.args[0][1]).to.equal("ctx");
                        });

                        it("should receive the context as the second argument", function () {
                            expect(adapter.args[0][2]).to.equal("req");
                        });

                    });

                    describe("the result", function () {

                        it("should have markup equaling 'Result'", function () {
                            expect(result.markup).to.equal("Result");
                        });


                    });

                });

                describe("When there is data passed in the definition", function () {


                    beforeEach(function (done) {

                        adapterDef.resolve({value: "Something"});

                        var definiton = {
                            component: "CoolThing",
                            layout: "overridelayout",
                            data: {
                                test: "123",
                                val: "456"
                            }
                        };

                        component.render(definiton, "context", "request", '', 'fizBuz').then(function (resp) {
                            result = resp;
                            done();
                        });
                    });

                    describe("the adapter", function () {

                        it("should have been called", function () {
                            expect(adapter.callCount).to.equal(1);
                        });

                        it("should have been called with the right data", function () {
                            expect(adapter.args[0][0]).to.deep.equal({
                                componentName: "TestComponent",
                                calledName: 'fizBuz',
                                test: "123",
                                val: "456"
                            });
                        });

                        it("should receive the context as the second argument", function () {
                            expect(adapter.args[0][1]).to.equal("context");
                        });

                        it("should receive the context as the second argument", function () {
                            expect(adapter.args[0][2]).to.equal("request");
                        });

                    });

                    describe("the result", function () {


                        it("should correctly render the markup", function () {
                            expect(result.markup).to.equal("Something");
                        });

                    });

                });

            });

        });

        describe("And has several templates", function () {


            var component, adapter, adapterDef;

            beforeEach(function (done) {
                adapterDef = Promise.defer();

                adapter = sandbox.spy(function () {
                    return adapterDef.promise;
                });

                component = Component({
                    adapter,
                    templates: {
                        "default": Promise.resolve("{{test}}{{value}}"),
                        rail: Promise.resolve("rail: {{test}}{{value}}")
                    }
                }, 'comp');

                component.loadTemplates(Handlebars).then(function () {
                    done();
                });
            });

            describe("hasAdapter", function () {

                it("should return true", function () {
                    expect(component.hasAdapter()).to.equal(true);
                });

            });

            describe("hasModel", function () {

                it("should return false", function () {
                    expect(component.hasModel()).to.equal(false);
                });

            });

            describe("render", function () {

                var result;

                describe("When there is nothing passed in the definition", function () {

                    describe("And an unknown association name is given", function () {


                        beforeEach(function (done) {
                            adapterDef.resolve({test: "Result"});

                            component.render({component: "AdaptedComponent"}, "ctx", "req", 'main', '').then(function (resp) {
                                result = resp;
                                done();
                            });
                        });

                        describe("the adapter", function () {

                            it("should have been called", function () {
                                expect(adapter.callCount).to.equal(1);
                            });

                            it("should have been called with default data", function () {
                                expect(adapter.args[0][0]).to.deep.equal({
                                    calledName: '',
                                    componentName: 'comp'
                                });
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][1]).to.equal("ctx");
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][2]).to.equal("req");
                            });

                        });

                        describe("the result", function () {


                            it("should have markup equaling 'Result'", function () {
                                expect(result.markup).to.equal("Result");
                            });


                        });

                    });

                    describe("And a known association name is given", function () {


                        beforeEach(function (done) {
                            adapterDef.resolve({test: "Result"});

                            component.render({component: "AdaptedComponent"}, "ctx", "req", 'rail').then(function (resp) {
                                result = resp;
                                done();
                            });
                        });

                        describe("the adapter", function () {

                            it("should have been called", function () {
                                expect(adapter.callCount).to.equal(1);
                            });

                            it("should have been called with default data", function () {
                                expect(adapter.args[0][0]).to.deep.equal({
                                    calledName: undefined,
                                    componentName: "comp"
                                });
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][1]).to.equal("ctx");
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][2]).to.equal("req");
                            });

                        });

                        describe("the result", function () {


                            it("should have markup equaling 'Result'", function () {
                                expect(result.markup).to.equal("rail: Result");
                            });


                        });

                    });

                });

                describe("When there is data passed in the definition", function () {

                    describe("And an unknown association name is given", function () {


                        beforeEach(function (done) {

                            adapterDef.resolve({value: "Something"});

                            var definiton = {
                                component: "CoolThing",
                                data: {
                                    test: "123",
                                    val: "456"
                                }
                            };

                            component.render(definiton, "context", "request", '').then(function (resp) {
                                result = resp;
                                done();
                            });
                        });

                        describe("the adapter", function () {

                            it("should have been called", function () {
                                expect(adapter.callCount).to.equal(1);
                            });

                            it("should have been called with correct data", function () {
                                expect(adapter.args[0][0]).to.deep.equal({
                                    val: "456",
                                    test: "123",
                                    calledName: undefined,
                                    componentName: "comp"
                                });
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][1]).to.equal("context");
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][2]).to.equal("request");
                            });

                        });

                        describe("the result", function () {


                            it("should correctly render the markup", function () {
                                expect(result.markup).to.equal("Something");
                            });

                        });

                    });

                    describe("And a known association name is given", function () {


                        beforeEach(function (done) {

                            adapterDef.resolve({value: "Something"});

                            var definiton = {
                                component: "CoolThing",
                                data: {
                                    test: "123",
                                    val: "456"
                                }
                            };

                            component.render(definiton, "context", "request", 'rail').then(function (resp) {
                                result = resp;
                                done();
                            });
                        });

                        describe("the adapter", function () {

                            it("should have been called", function () {
                                expect(adapter.callCount).to.equal(1);
                            });

                            it("should have been called with empty data", function () {
                                expect(adapter.args[0][0]).to.deep.equal({
                                    val: "456",
                                    test: "123",
                                    calledName: undefined,
                                    componentName: "comp"
                                });
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][1]).to.equal("context");
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][2]).to.equal("request");
                            });

                        });

                        describe("the result", function () {


                            it("should correctly render the markup", function () {
                                expect(result.markup).to.equal("rail: Something");
                            });

                        });

                    });


                });

            });

        });

    });

    describe("When the implementation returns an object", function () {

        describe("when the component has one default template", function () {

            var component, adapter, adapterResp;

            beforeEach(function (done) {

                adapterResp = {value: "Some response data"};
                adapter = sandbox.spy(function () {
                    return adapterResp;
                });

                component = Component({
                    adapter,
                    templates: {
                        "default": Promise.resolve("{{value}}{{test}}:Default"),
                        "rail": Promise.resolve("rrrrrail...{{value}}")
                    }
                });

                component.loadTemplates(Handlebars).then(function () {
                    done();
                });
            });

            describe("hasAdapter", function () {

                it("should return true", function () {
                    expect(component.hasAdapter()).to.equal(true);
                });

            });

            describe("hasModel", function () {

                it("should return false", function () {
                    expect(component.hasModel()).to.equal(false);
                });

            });

            describe("render", function () {

                var result;

                describe("When there is nothing passed in the definition", function () {


                    beforeEach(function (done) {

                        component.render({component: "AdaptedComponent"}, "ctx", "req", '').then(function (resp) {
                            result = resp;
                            done();
                        });
                    });

                    describe("the adapter", function () {

                        it("should have been called", function () {
                            expect(adapter.callCount).to.equal(1);
                        });

                        it("should have been called with empty data", function () {
                            expect(adapter.args[0][0]).to.deep.equal({
                                calledName: undefined,
                                componentName: undefined
                            });
                        });

                        it("should receive the context as the second argument", function () {
                            expect(adapter.args[0][1]).to.equal("ctx");
                        });

                        it("should receive the context as the second argument", function () {
                            expect(adapter.args[0][2]).to.equal("req");
                        });

                    });

                    describe("the result", function () {


                        it("should render correctly", function () {
                            expect(result.markup).to.equal("Some response data:Default");
                        });

                    });

                });

                describe("When there is data passed in the definition", function () {


                    beforeEach(function (done) {

                        var definiton = {
                            component: "CoolThing",
                            layout: "rail",
                            data: {
                                test: "123",
                                val: "456"
                            }
                        };

                        component.render(definiton, "context", "request", 'rail').then(function (resp) {
                            result = resp;
                            done();
                        });
                    });

                    describe("the adapter", function () {

                        it("should have been called", function () {
                            expect(adapter.callCount).to.equal(1);
                        });

                        it("should have been called with the passed data data", function () {
                            expect(adapter.args[0][0]).to.deep.equal({
                                componentName: undefined,
                                calledName: undefined,
                                test: "123",
                                val: "456"
                            });
                        });

                        it("should receive the context as the second argument", function () {
                            expect(adapter.args[0][1]).to.equal("context");
                        });

                        it("should receive the context as the second argument", function () {
                            expect(adapter.args[0][2]).to.equal("request");
                        });

                    });

                    describe("the result", function () {


                        it("should render correctly", function () {
                            expect(result.markup).to.equal('rrrrrail...Some response data');
                        });

                    });

                });

            });
        });

    });


    describe("When the implementation returns null or undefined", function () {

        var component, adapter, adapterResp;

        beforeEach(function (done) {

            adapterResp = null;
            adapter = sandbox.spy(function () {
                return adapterResp;
            });

            component = Component({
                adapter,
                templates: {
                    "default": Promise.resolve("var is '{{value}}'")
                }
            });

            component.loadTemplates(Handlebars).then(function () {
                done();
            });
        });

        describe("hasAdapter", function () {

            it("should return true", function () {
                expect(component.hasAdapter()).to.equal(true);
            });

        });

        describe("hasModel", function () {

            it("should return false", function () {
                expect(component.hasModel()).to.equal(false);
            });

        });

        describe("render", function () {

            var result;

            describe("When there is nothing passed in the definition", function () {


                beforeEach(function (done) {

                    component.render({component: "AdaptedComponent"}, "ctx", "req").then(function (resp) {
                        result = resp;
                        done();
                    });
                });

                describe("the adapter", function () {

                    it("should have been called", function () {
                        expect(adapter.callCount).to.equal(1);
                    });

                    it("should have been called with default data", function () {
                        expect(adapter.args[0][0]).to.deep.equal({
                            componentName: undefined,
                            calledName: undefined
                        });
                    });

                    it("should receive the context as the second argument", function () {
                        expect(adapter.args[0][1]).to.equal("ctx");
                    });

                    it("should receive the context as the second argument", function () {
                        expect(adapter.args[0][2]).to.equal("req");
                    });

                });

                describe("the result", function () {


                    it('should render correctly', function () {
                        expect(result.markup).to.equal("var is ''");
                    });

                });

            });

            describe("When there is data passed in the definition", function () {


                beforeEach(function (done) {

                    var definiton = {
                        component: "CoolThing",
                        layout: "custom",
                        data: {
                            test: "123",
                            val: "456"
                        }
                    };

                    component.evaluate(definiton, "context", "request").then(function (resp) {
                        result = resp;
                        done();
                    });
                });

                describe("the adapter", function () {

                    it("should have been called", function () {
                        expect(adapter.callCount).to.equal(1);
                    });

                    it("should have been called with the passed data", function () {
                        expect(adapter.args[0][0]).to.deep.equal({
                            val: "456",
                            test: "123",
                            calledName: undefined,
                            componentName: undefined
                        });
                    });

                    it("should receive the context as the second argument", function () {
                        expect(adapter.args[0][1]).to.equal("context");
                    });

                    it("should receive the context as the second argument", function () {
                        expect(adapter.args[0][2]).to.equal("request");
                    });

                });

                describe("the result", function () {


                });

            });

        });
    });

});
