var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);
var Promise = require("bluebird");
var mockComponents = require("./fixtures/basic/components");
var associationProcessorService = require('../lib/associationProcessorService');


describe("the association processor service", function () {

    var sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe("When a component has a non-default template/association name", function () {

        var result;

        beforeEach(function (done) {

            var associations = {rail: [{component: 'basicComponent'}]};
            var iterPromise = associationProcessorService.runAssociationIterator(
                "context", "request", mockComponents, associations);

            iterPromise.then(function (res) {
                result = res;
                done();
            });

        });

        it("should have association data", function () {
            expect(result.associationData).to.exist;
        });

        it("should have exported data", function () {
            expect(result.exportedData).to.exist;
        });

        it("should have a rail association", function () {
            expect(result.associationData.rail).to.exist;
        });

        describe("The rail association", function () {
            it("should have the correct data", function () {
                expect(result.associationData.rail).to.deep.equal([
                    {
                        name: 'basicComponent',
                        layout: undefined,
                        data: {},
                        associations: {}
                    }
                ]);
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
                "context", "request", mockComponents, associations);

            iterPromise.then(function (res) {
                result = res;
                done();
            });

        });

        describe("Exported data", function () {

            it("should contain the data exported from the component adapter", function () {
                expect(result.exportedData).to.deep.equal({
                    componentWithAdapter: {test: 'Hello'}
                });
            });
        });

        describe("Association Data", function () {

            it("should have a main association", function () {
                expect(result.associationData.main).to.exist;
            });

            it("should have all the data returned from the adapter", function () {
                expect(result.associationData.main).to.deep.equal([
                    {
                        name: 'componentWithAdapter',
                        layout: undefined,
                        data: {
                            content: "Fake Content"
                        },
                        associations: {}
                    }
                ]);
            });

        });

    });

});