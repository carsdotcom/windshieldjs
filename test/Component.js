var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);
var Promise = require("bluebird");
var Component = require('../lib/Component');

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
            component = new Component({});
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

        describe("evaluate", function () {

            var result;

            describe("When there is nothing passed in the definition", function () {


                beforeEach(function (done) {
                    component.evaluate({component: "TestComponent"}, {}, {}).then(function (resp) {
                        result = resp;
                        done();
                    });
                });

                describe("the result", function () {


                    it("should return an object with the name set to the definition, empty data, and an undefined layout", function () {
                        expect(result).to.deep.equal({
                            data: {
                                name: "TestComponent",
                                layout: undefined,
                                data: {}
                            }
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

                    component.evaluate(definiton, {}, {}).then(function (resp) {
                        result = resp;
                        done();
                    });
                });

                describe("the result", function () {


                    it("should set result.data.name", function () {
                        expect(result.data.name).to.equal("TestComponent");
                    });
                    
                    it("should set the result.data.layout", function () {
                        expect(result.data.layout).to.equal("testlayout");
                    });
                    
                    it("should set result.data.data to equal the passed in data", function () {
                       expect(result.data.data).to.deep.equal({
                           test: "123",
                           val: "456"
                       }); 
                    });

                });

            });

        });
    });

    describe("When the implementation includes an which returns a promise", function () {

        var component, adapter, adapterDef;

        beforeEach(function () {
            adapterDef = Promise.defer();
            
            adapter = sandbox.spy(function () {
                return adapterDef.promise;    
            });
            
            component = new Component({
                adapter
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

        describe("evaluate", function () {

            var result;

            describe("When there is nothing passed in the definition", function () {


                beforeEach(function (done) {
                    adapterDef.resolve({test: "Result"});
                    
                    component.evaluate({component: "AdaptedComponent"}, "ctx", "req").then(function (resp) {
                        result = resp;
                        done();
                    });
                });
                
                describe("the adapter", function () {
                   
                    it("should have been called", function () {
                       expect(adapter.callCount).to.equal(1); 
                    });
                    
                    it("should have been called with empty data", function () {
                        expect(adapter.args[0][0]).to.deep.equal({});
                    });

                    it("should receive the context as the second argument", function () {
                        expect(adapter.args[0][1]).to.equal("ctx");
                    });

                    it("should receive the context as the second argument", function () {
                        expect(adapter.args[0][2]).to.equal("req");
                    });
                    
                });

                describe("the result", function () {

                    it("should set result.data.name", function () {
                        expect(result.data.name).to.equal("AdaptedComponent");
                    });

                    it("should set the result.data.layout", function () {
                        expect(result.data.layout).to.be.undefined;
                    });

                    it("should set result.data.data to equal the passed in data", function () {
                        expect(result.data.data).to.deep.equal({test: "Result"});
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

                    component.evaluate(definiton, "context", "request").then(function (resp) {
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


                    it("should set result.data.name", function () {
                        expect(result.data.name).to.equal("CoolThing");
                    });

                    it("should set the result.data.layout", function () {
                        expect(result.data.layout).to.equal("overridelayout");
                    });

                    it("should set result.data.data to equal the passed in data", function () {
                        expect(result.data.data).to.deep.equal({value: "Something"});
                    });

                });

            });

        });
    });

    describe("When the implementation includes an which returns an object", function () {

        var component, adapter, adapterResp;

        beforeEach(function () {
            
            adapterResp = "Some response data";
            adapter = sandbox.spy(function () {
                return adapterResp;
            });

            component = new Component({
                adapter
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

        describe("evaluate", function () {

            var result;

            describe("When there is nothing passed in the definition", function () {


                beforeEach(function (done) {

                    component.evaluate({component: "AdaptedComponent"}, "ctx", "req").then(function (resp) {
                        result = resp;
                        done();
                    });
                });

                describe("the adapter", function () {

                    it("should have been called", function () {
                        expect(adapter.callCount).to.equal(1);
                    });

                    it("should have been called with empty data", function () {
                        expect(adapter.args[0][0]).to.deep.equal({});
                    });

                    it("should receive the context as the second argument", function () {
                        expect(adapter.args[0][1]).to.equal("ctx");
                    });

                    it("should receive the context as the second argument", function () {
                        expect(adapter.args[0][2]).to.equal("req");
                    });

                });

                describe("the result", function () {

                    it("should set result.data.name", function () {
                        expect(result.data.name).to.equal("AdaptedComponent");
                    });

                    it("should set the result.data.layout", function () {
                        expect(result.data.layout).to.be.undefined;
                    });

                    it("should set result.data.data to equal the adapter result", function () {
                        expect(result.data.data).to.equal(adapterResp);
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

                    it("should have been called with empty data", function () {
                        expect(adapter.args[0][0]).to.deep.equal({
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


                    it("should set result.data.name", function () {
                        expect(result.data.name).to.equal("CoolThing");
                    });

                    it("should set the result.data.layout", function () {
                        expect(result.data.layout).to.equal("custom");
                    });

                    it("should set result.data.data to equal the adapter result", function () {
                        expect(result.data.data).to.equal(adapterResp);
                    });

                });

            });

        });
    });

});