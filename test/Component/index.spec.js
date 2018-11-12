'use strict';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const Component = require('../../lib/Component');
const Handlebars = require('handlebars');

describe("the Component object", function () {
    const request = {
        server: {
            log: sinon.stub()
        }
    };
    let sandbox;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe("When the implementation is empty", function () {

        let component;

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

            let result;

            describe("When there is nothing passed in the definition", function () {


                beforeEach(function (done) {
                    const request = {
                        server: {
                            log: sinon.stub()
                        }
                    };

                    component.render({component: "TestComponent", layout: 'main' }, {}, request).then(function (resp) {
                        result = resp;
                        done();
                    });
                });

                describe("the result", function () {

                    it("should be an object with the name set to the definition, empty data, and an undefined layout", function () {
                        expect(result).to.deep.equal({
                            markup: '<!-- undefined template "main" could not be found -->',
                            exported: {}
                        });
                    });

                });

            });

            describe("When there is data passed in the definition", function () {


                beforeEach(function (done) {
                    const request = {
                        server: {
                            log: sinon.stub()
                        }
                    };

                    const definiton = {
                        component: "TestComponent",
                        layout: "testlayout",
                        data: {
                            test: "123",
                            val: "456"
                        }
                    };

                    component.render(definiton, {}, request, '').then(function (resp) {
                        result = resp;
                        done();
                    });
                });

                describe("the result", function () {

                    it("should have markup that is a comment explaining that the layout could not be found", function () {
                        expect(result.markup).to.equal('<!-- undefined template "testlayout" could not be found -->');
                    });

                });

            });

        });
    });

    describe("When the implementation adapter returns a promise", function () {

        describe("And has one default template", function () {


            let component, adapter;

            beforeEach(function (done) {
                adapter = sandbox.stub();

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

                let result;

                describe("When there is nothing passed in the definition", function () {


                    beforeEach(function (done) {


                        adapter.resolves({test: "Result"});

                        component.render({component: "AdaptedComponent"}, "ctx", request, 'main').then(function (resp) {
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
                                calledName: 'AdaptedComponent'
                            });
                        });

                        it("should receive the context as the second argument", function () {
                            expect(adapter.args[0][1]).to.equal("ctx");
                        });

                        it("should receive the context as the second argument", function () {
                            expect(adapter.args[0][2]).to.equal(request);
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

                        adapter.resolves({value: "Something"});


                        const definiton = {
                            component: "CoolThing",
                            layout: "overridelayout",
                            data: {
                                test: "123",
                                val: "456"
                            }
                        };

                        component.render(definiton, "context", request, '').then(function (resp) {
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
                                calledName: 'CoolThing',
                                test: "123",
                                val: "456"
                            });
                        });

                        it("should receive the context as the second argument", function () {
                            expect(adapter.args[0][1]).to.equal("context");
                        });

                        it("should receive the context as the second argument", function () {
                            expect(adapter.args[0][2]).to.equal(request);
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


            let component, adapter;

            beforeEach(function (done) {
                adapter = sandbox.stub();

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

                let result;

                describe("When there is nothing passed in the definition", function () {

                    describe("And an unknown layout name is given", function () {


                        beforeEach(function (done) {
                            adapter.resolves({test: "Result"});

                            component.render({component: "AdaptedComponent", layout: 'main'}, "ctx", request).then(function (resp) {
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
                                    calledName: 'AdaptedComponent',
                                    componentName: 'comp'
                                });
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][1]).to.equal("ctx");
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][2]).to.equal(request);
                            });

                        });

                        describe("the result", function () {


                            it("should have markup equaling 'Result'", function () {
                                expect(result.markup).to.equal("Result");
                            });


                        });

                    });

                    describe("And a known layout name is given", function () {

                        beforeEach(function (done) {
                            adapter.resolves({test: "Result"});

                            component.render({component: "AdaptedComponent", layout: 'rail'}, "ctx", request).then(function (resp) {
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
                                    calledName: 'AdaptedComponent',
                                    componentName: "comp"
                                });
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][1]).to.equal("ctx");
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][2]).to.equal(request);
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

                    describe("And an unknown layout name is given", function () {


                        beforeEach(function (done) {

                            adapter.resolves({value: "Something"});

                            const definiton = {
                                component: "CoolThing",
                                data: {
                                    test: "123",
                                    val: "456"
                                },
                                layout: 'snuh'
                            };

                            component.render(definiton, "context", request).then(function (resp) {
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
                                    calledName: 'CoolThing',
                                    componentName: "comp"
                                });
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][1]).to.equal("context");
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][2]).to.equal(request);
                            });

                        });

                        describe("the result", function () {


                            it("should correctly render the markup", function () {
                                expect(result.markup).to.equal("Something");
                            });

                        });

                    });

                    describe("And a known layout name is given", function () {


                        beforeEach(function (done) {

                            adapter.resolves({value: "Something"});

                            const definiton = {
                                component: "CoolThing",
                                data: {
                                    test: "123",
                                    val: "456"
                                },
                                layout: 'rail'
                            };

                            component.render(definiton, "context", request).then(function (resp) {
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
                                    calledName: 'CoolThing',
                                    componentName: "comp"
                                });
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][1]).to.equal("context");
                            });

                            it("should receive the context as the second argument", function () {
                                expect(adapter.args[0][2]).to.equal(request);
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

            let component, adapter, adapterResp;

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

                let result;

                describe("When there is nothing passed in the definition", function () {


                    beforeEach(function (done) {

                        component.render({component: "AdaptedComponent"}, "ctx", request, '').then(function (resp) {
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
                                calledName: 'AdaptedComponent',
                                componentName: undefined
                            });
                        });

                        it("should receive the context as the second argument", function () {
                            expect(adapter.args[0][1]).to.equal("ctx");
                        });

                        it("should receive the request as the second argument", function () {
                            expect(adapter.args[0][2]).to.equal(request);
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

                        const definiton = {
                            component: "CoolThing",
                            layout: "rail",
                            data: {
                                test: "123",
                                val: "456"
                            }
                        };

                        component.render(definiton, "context", request, 'rail').then(function (resp) {
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
                                calledName: 'CoolThing',
                                test: "123",
                                val: "456"
                            });
                        });

                        it("should receive the context as the second argument", function () {
                            expect(adapter.args[0][1]).to.equal("context");
                        });

                        it("should receive the context as the second argument", function () {
                            expect(adapter.args[0][2]).to.equal(request);
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

        let component, adapter, adapterResp;

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

            let result;

            describe("When there is nothing passed in the definition", function () {


                beforeEach(function (done) {

                    component.render({component: "AdaptedComponent"}, "ctx", request).then(function (resp) {
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
                            calledName: 'AdaptedComponent'
                        });
                    });

                    it("should receive the context as the second argument", function () {
                        expect(adapter.args[0][1]).to.equal("ctx");
                    });

                    it("should receive the context as the second argument", function () {
                        expect(adapter.args[0][2]).to.equal(request);
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

                    const definiton = {
                        component: "CoolThing",
                        layout: "custom",
                        data: {
                            test: "123",
                            val: "456"
                        }
                    };

                    component.evaluate(definiton, "context", request).then(function (resp) {
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
                            calledName: "CoolThing",
                            componentName: undefined
                        });
                    });

                    it("should receive the context as the second argument", function () {
                        expect(adapter.args[0][1]).to.equal("context");
                    });

                    it("should receive the context as the second argument", function () {
                        expect(adapter.args[0][2]).to.equal(request);
                    });

                });

                describe("the result", function () {


                });

            });

        });
    });

});
