var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);
var Promise = require("bluebird");
var mockComponents = require("./fixtures/basic/components");
var ComponentMap = require("../lib/ComponentMap");
var Handlebars = require('handlebars');
var associationProcessorService = require('../lib/associationProcessorService');


describe("the association processor service", function () {

    var sandbox, components;

    beforeEach(function (done) {
        sandbox = sinon.sandbox.create();
        components = ComponentMap(mockComponents);
        components.init(Handlebars).then(function () {
            done();
        });
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe("When a component has a non-default template/association name", function () {

        var result;

        beforeEach(function (done) {

            var associations = {rail: [{component: 'basicComponent'}]};
            var iterPromise = associationProcessorService.runAssociationIterator(
                "context", "request", components, associations);

            iterPromise.then(function (res) {
                result = res;
                console.log(res);
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

        var result;

        beforeEach(function (done) {

            var associations = {
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
            var iterPromise = associationProcessorService.runAssociationIterator(
                "context", "request", components, associations);

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