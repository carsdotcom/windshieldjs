'use strict';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const mockComponents = require("../fixtures/basic/components");
const ComponentMap = require("../../lib/Component/Map");
const Handlebars = require('handlebars');
const associationIterator = require('../../lib/associationProcessorService');


describe("the association processor service", function () {

    let sandbox, components;

    beforeEach(function (done) {
        sandbox = sinon.createSandbox();
        components = ComponentMap(mockComponents);
        components.init(Handlebars).then(function () {
            done();
        });
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe("When a component has a non-default template/association name", function () {

        let result;

        beforeEach(function (done) {

            let associations = {rail: [{component: 'basicComponent'}]};
            let iterPromise = associationIterator(associations, components.composeFactory({associations}, "request"));

            iterPromise.then(function (res) {
                result = res;
                done();
            });

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

        beforeEach(function (done) {

            let associations = {
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
            let iterPromise = associationIterator(associations, components.composeFactory({associations}, "request"));

            iterPromise.then(function (res) {
                result = res;
                done();
            });

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

});
