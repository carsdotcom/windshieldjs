var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);
var Promise = require("bluebird");
var Component = require('../lib/Component');
var ComponentMap = require("../lib/ComponentMap");
var AssociationList = require("../lib/AssociationMap");

describe("the AssociationList object", function () {

    var sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe("Handling nested associations", function () {

        var components, associations, aList;

        beforeEach(function () {
            associations = {
                main: [
                    {
                        component: "c1",
                        data: {
                            testData: "hi"
                        },
                        associations: {
                            'inner1': [
                                {
                                    component: "n1",
                                    data: {
                                        nData: "data"
                                    }
                                }
                            ]
                        }
                    }
                ],
                rail: [
                    {
                        component: "c2"
                    },
                    {
                        component: "c3",
                        data: {
                            name: "Fake",
                            age: 982
                        }
                    }
                ]
            };

            components = new ComponentMap({});
            aList = AssociationList(associations);
        });


        describe("Evaluating the list", function () {

            var result, c1, c2, c3, c4, n1, c1render;

            beforeEach(function (done) {

                c1 = new Component({});
                c2 = new Component({});
                c3 = new Component({});
                c4 = new Component({});

                n1 = new Component({});


                c1render = sandbox.stub(c1, 'render', function () {
                    return Promise.resolve({markup: "c1 result"});
                });

                sandbox.stub(c2, 'render', function () {
                    return Promise.resolve({markup: "c2 result"});
                });

                sandbox.stub(c3, 'render', function () {
                    return Promise.resolve({markup: "c3 result"});
                });

                sandbox.stub(c4, 'render', function () {
                    return Promise.resolve({markup: "c4 result"});
                });

                sandbox.stub(n1, 'render', function () {
                    return Promise.resolve({markup: "n1 result"});
                });

                sandbox.stub(components, 'getComponent', function (name) {
                    return {c1, c2, c3, c4, n1}[name];
                });

                aList.evaluate("context", "request", components).then(function (res) {
                    result = res;
                    done();
                });
            });

            it("should have gotten each component instance off the map", function () {
                expect(components.getComponent.callCount).to.equal(4);
                expect(components.getComponent).to.have.been.calledWith("n1");
                expect(components.getComponent).to.have.been.calledWith("c1");
                expect(components.getComponent).to.have.been.calledWith("c2");
                expect(components.getComponent).to.have.been.calledWith("c3");

            });

            describe("Rendering Each Component", function () {

                it("should have called render on each component", function () {
                    expect(c1.render.callCount).to.equal(1);
                    expect(c2.render.callCount).to.equal(1);
                    expect(c3.render.callCount).to.equal(1);
                });

                it("should have passed definition as the first argument to render", function () {
                    expect(c1.render.args[0][0]).to.equal(associations.main[0]);
                    expect(c2.render.args[0][0]).to.equal(associations.rail[0]);
                    expect(c3.render.args[0][0]).to.equal(associations.rail[1]);
                });

                it("should have passed context as the second arg to render", function () {
                    expect(c1.render.args[0][1]).to.equal("context");
                    expect(c2.render.args[0][1]).to.equal("context");
                    expect(c3.render.args[0][1]).to.equal("context");
                });

                it("should have passed request as the third arg to render", function () {
                    expect(c1.render.args[0][2]).to.equal("request");
                    expect(c2.render.args[0][2]).to.equal("request");
                    expect(c3.render.args[0][2]).to.equal("request");
                });

            });

            describe("The Result", function () {

                it("should include all the associations", function () {

                    console.log(result);

                    expect(result.markup.main).to.equal('c1 result');

                    expect(c1render).to.have.been.calledWith({
                        associations: { exported: {  }, markup: { inner1: "n1 result" } },
                        component: "c1",
                        data: { testData: "hi" }
                    });

                    expect(result.markup.rail).to.equal("c2 result\nc3 result");

                });

                it("should only have the associations", function () {
                    expect(result.markup.hasOwnProperty("main")).to.equal(true);
                    expect(result.markup.hasOwnProperty("rail")).to.equal(true);
                    expect(Object.keys(result).length).to.equal(2);
                });

            });

        });

    });

});