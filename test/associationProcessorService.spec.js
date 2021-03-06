'use strict';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const mockComponents = require("./fixtures/basic/components");
const Component = require('../lib/Component');
const ComponentMap = require("../lib/Component/Map");
const Handlebars = require('handlebars');
const associationIterator = require('../lib/associationProcessorService');


describe("the association processor service", function () {

    let sandbox, components;

    beforeEach(async function () {
        sandbox = sinon.createSandbox();
        components = ComponentMap(mockComponents);
        await components.init(Handlebars);
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe("When a component has a non-default template/association name", function () {

        const mockRequest = {
            server: {
                log: sinon.stub()
            }
        };

        let result;

        beforeEach(async function () {

            const associations = {rail: [{component: 'basicComponent'}]};
            result = await associationIterator(associations, components.composeFactory({associations}, mockRequest));
        });

        it("should have association data", function () {
            expect(result.markup).to.exist;
        });

        it("should have exported data", function () {
            expect(result.exported).to.exist;
        });

        it("should have a rail association", function () {
            expect(result.markup.rail).to.exist;
        });

        describe("The rail association", function () {
            it("should have the correct data", function () {
                expect(result.markup.rail).to.equal('this is the rail template');
            });
        });

    });

    describe("When the component has an adapter", function () {

        let result;

        beforeEach(async function () {

            const associations = {
                main: [
                    {
                        component: 'componentWithAdapter',
                        data: {
                            attributes: {
                                content: "Fake Content"
                            }
                        }
                    }
                ]
            };
            result = await associationIterator(associations, components.composeFactory({associations}, "request"));
        });

        describe("Exported data", function () {

            it("should contain the data exported from the component adapter", function () {
                expect(result.exported).to.deep.equal({
                    componentWithAdapter: {
                        test: 'Hello'
                    }
                });
            });
        });

        describe("Association Data", function () {

            it("should have a main association", function () {
                expect(result.markup.main).to.exist;
            });

            it("should have all the data returned from the adapter", function () {
                expect(result.markup.main).to.equal("<p>Fake Content</p>");
            });

        });

    });




    describe("Handling nested associations", function () {

        let associations;

        const componentMap = new ComponentMap({});
        let renderer;

        const request = {
            server: {
                log: sinon.stub()
            }
        };

        beforeEach(function () {
            const context = "context";
            renderer = componentMap.composeFactory(context, request);


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

        });


        describe("Evaluating the list", function () {

            let result, c1, c2, c3, c4, n1, c1render;

            beforeEach(function (done) {

                c1 = new Component({});
                c2 = new Component({});
                c3 = new Component({});
                c4 = new Component({});

                n1 = new Component({});


                c1render = sandbox.stub(c1, 'render').resolves({markup: "c1 result"});

                sandbox.stub(c2, 'render').resolves({markup: "c2 result"});

                sandbox.stub(c3, 'render').resolves({markup: "c3 result"});

                sandbox.stub(c4, 'render').resolves({markup: "c4 result"});

                sandbox.stub(n1, 'render').resolves({markup: "n1 result"});

                sandbox.stub(componentMap, 'getComponent').callsFake(function (name) {
                    return {c1, c2, c3, c4, n1}[name];
                });

                associationIterator(associations, renderer).then(function (res) {
                    result = res;
                    done();
                });
            });

            it("should have gotten each component instance off the map", function () {
                expect(componentMap.getComponent.callCount).to.equal(4);
                expect(componentMap.getComponent).to.have.been.calledWith("n1");
                expect(componentMap.getComponent).to.have.been.calledWith("c1");
                expect(componentMap.getComponent).to.have.been.calledWith("c2");
                expect(componentMap.getComponent).to.have.been.calledWith("c3");

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
                    expect(c1.render.args[0][2]).to.equal(request);
                    expect(c2.render.args[0][2]).to.equal(request);
                    expect(c3.render.args[0][2]).to.equal(request);
                });

            });

            describe("The Result", function () {

                it("should include all the associations", function () {

                    expect(result.markup.main).to.equal('c1 result');

                    expect(c1render).to.have.been.calledWith({
                        associations: { exported: {  }, markup: { inner1: "n1 result" } },
                        component: "c1",
                        data: { testData: "hi" },
                        layout: 'main'
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
