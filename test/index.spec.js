const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const path = require('path');
const Hapi = require('hapi');
const Vision = require('vision');
const Windshield = require('../lib');
const Handlebars = require('handlebars');




let pageFilter = sinon.spy(function (pageData) {
    return Promise.resolve(pageData);
});

const helloWorldPageAdapter = sinon.stub()




const nestedHelloWorldPageAdapter = sinon.stub()



const prereq = {
    method: sinon.spy(function (context, request, h) {
        if (context.sayHello === false) {
            return h.takeover().code(404);
        } else {
            return h.continue;
        }
    })
};

const windshieldRoutes = [
    {
        path: '/bar/',
        context: {
            sayHello: true
        },
        adapters: [
            prereq,
            helloWorldPageAdapter
        ],
        pageFilter: pageFilter
    },
    {
        path: '/nested/',
        context: {
            sayHello: true
        },
        adapters: [
            nestedHelloWorldPageAdapter
        ]
    }
];

const componentLibrary = require('./fixtures/basic/components');

describe('A Hapi server configured with Vision and Windshield', function () {
    let response;
    let server;

    let replyViewSpy;
    before(function () {

        server = new Hapi.Server({ "port": 3000 });

        const windshieldPlugin = {
            plugin: Windshield,
            options: {
                rootDir: path.join(__dirname, './fixtures'),
                handlebars: Handlebars,
                uriContext: '/foo',
                routes: windshieldRoutes,
                components: componentLibrary,
                path: ['./basic/'],
                helpersPath: ['./basic/helpers']
            }
        };

        return server.register([Vision, windshieldPlugin])
            .then(() => {
                replyViewSpy = sinon.spy(server._core._decorations.toolkit, 'view');
            })
            .catch(err => {
                if (err) {
                    console.log(err);
                }
            });




    });


    describe('handling a request to a windshield route', function () {

        describe("And an error is thrown", function () {

            beforeEach(function () {
                helloWorldPageAdapter.rejects(new Error('oops'));
                nestedHelloWorldPageAdapter.rejects(new Error('oops'));
            });

            describe("basic", function () {

                beforeEach(function () {
                    const request = {
                        method: 'GET',
                        url: '/foo/bar/'
                    };

                    return server.inject(request).then(function (resp) {
                        response = resp;
                    });
                });

                it("should not call vision's h.view", function () {
                    expect(replyViewSpy).not.to.have.been.called;
                });

                it("should set the response status code to 500", function () {
                    expect(response.statusCode).to.equal(500);
                });

                it("should set the response payload to display the error", function () {
                    expect(response.payload).to.contain('oops');
                });
            });


            describe("that uses an adapter with nested associations", function () {

                beforeEach(function () {
                    const request = {
                        method: 'GET',
                        url: '/foo/nested/'
                    };

                    return server.inject(request).then(function (resp) {
                        response = resp;
                    });
                });

                it("should not call vision's h.view", function () {
                    expect(replyViewSpy).not.to.have.been.called;
                });

                it("should set the response status code to 500", function () {
                    expect(response.statusCode).to.equal(500);
                });

                it("should set the response payload to display the error", function () {
                    expect(response.payload).to.contain('oops');
                });
            });

        });

        describe("And everything works", function () {


            beforeEach(function () {

                helloWorldPageAdapter.resolves({
                    attributes: {
                        headers: {
                            'Accept-Language': 'en-us,en;q=0.5',
                            'Cookie': 'examplecookie=yes'
                        }
                    },
                    associations: {
                        helloSection: [
                            { component: 'helloworld' }
                        ]
                    },
                    layout: 'foobar'
                });

                nestedHelloWorldPageAdapter.resolves({
                    attributes: {
                        headers: {
                            'Cookie': 'examplecookie=yes'
                        }
                    },
                    associations: {
                        helloSection: [
                            {
                                component: 'container',
                                associations: {
                                    stuff: [
                                        {
                                            component: 'helloworld'
                                        },
                                        {
                                            component: 'helloworld',
                                            layout: 'shout'
                                        }
                                    ]
                                }
                            }
                        ]
                    },
                    layout: 'foobar'
                });
            })

            describe("basic", function () {

                beforeEach(function () {
                    const request = {
                        method: 'GET',
                        url: '/foo/bar/'
                    };

                    return server.inject(request).then(function (resp) {
                        response = resp;
                    });
                });

                it('should call the prequisite methods before calling any of the page adapters', function () {
                    expect(prereq.method).to.have.been.calledBefore(helloWorldPageAdapter);
                });

                it('should call the pageFilter method to perform last-minute operations on the page definition object', function () {
                    let intermediatePageData = {
                        assoc: {
                            exported: {},
                            markup: {
                                helloSection: '<h1>Hello world!</h1>'
                            }
                        },
                        exported: undefined,
                        layout: 'foobar',
                        attributes: {
                            headers:
                                {
                                    'Accept-Language': 'en-us,en;q=0.5',
                                    Cookie: 'examplecookie=yes'
                                }
                        }
                    };

                    expect(pageFilter).to.have.been.calledWith(intermediatePageData, response.request);
                });

                it("should call vision's h.view to parse the layout template with the page definition object", function () {
                    expect(replyViewSpy).to.have.been.calledWith('layouts/foobar', {
                        attributes: { headers:
                            {
                                'Accept-Language': 'en-us,en;q=0.5',
                                Cookie: 'examplecookie=yes'
                            }
                        },
                        exported: {},
                        assoc: { helloSection: '<h1>Hello world!</h1>' }
                    });
                });

                it("should set the response payload by processing the route's page adapters and layout template", function () {
                    expect(response.payload).to.equal('<html><body><div><h1>Hello world!</h1></div></body></html>');
                });

                it("should set the response headers based on the attributes defined by the route's page adapters", function () {
                    expect(response.headers).to.deep.include({
                        'accept-language': 'en-us,en;q=0.5',
                        'cookie': 'examplecookie=yes'
                    });
                });
            });


            describe("that uses an adapter with nested associations", function () {

                beforeEach(function () {
                    const request = {
                        method: 'GET',
                        url: '/foo/nested/'
                    };

                    return server.inject(request).then(function (resp) {
                        response = resp;
                    });
                });

                it("should call vision's h.view to parse the layout template with the page definition object", function () {
                    expect(replyViewSpy).to.have.been.calledWith('layouts/foobar', {
                        attributes: { headers: { Cookie: 'examplecookie=yes' } },
                        exported: {},
                        assoc: { helloSection:
                            '<section><h1>Hello world!</h1>\n<h1>HELLO WORLD!</h1></section>'
                        }
                    });
                });

                it("should set the response payload by processing the route's page adapters and layout template", function () {
                    expect(response.payload).to.equal('<html><body><div><section><h1>Hello world!</h1>\n<h1>HELLO WORLD!</h1></section></div></body></html>');
                });

                it("should set the response headers based on the attributes defined by the route's page adapters", function () {
                    expect(response.headers).to.deep.include({
                        'cookie': 'examplecookie=yes'
                    });
                });
            });

        });


    });

});