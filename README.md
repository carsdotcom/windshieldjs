# WindshieldJS

> An Enterprise Rendering plugin for Hapi.js.

WindshieldJS allows us to separate the data of our pages (and the logic used to
 obtain that data) from the markup with which we want to render that data.
It also lets us separate the components of our pages from one another, so that
 each component is a reusable module for determining its own data and markup,
allowing us to assemble groups of components into different pages.



-----

See [documentation site](https://carsdotcom.github.io/windshieldjs/) for more details. Please note the docs site is still a work-in-progress.

-----

## Table of Contents

* [Requirements](#requirements)
* [Install](#install)
* [Usage](#usage)
    - [Register](#register)
    - [Project Structure](#structure)
    - [Request Lifecycle](#requestlifecycle)
    - [Rendering components](#rendercomponent)
* Concepts
    - [Options](#options)
    - [Route Definition](#route)
    - [Context Object](#context)
    - [Component Type Config](#componenttype)
    - [Component Definition](#componentdef)
    - [Page Adapters & Objects](#page-adapters)
    - [Component Adapters & Objects](#component-adapters)

<br>


-----

<br>

## <a name="requirements"/>Requirements</a>

WindshieldJS 3.x is intended for use with

* [Hapi.js](https://github.com/hapijs/hapi) 16.x (no support for 17+)
* [vision](https://github.com/hapijs/vision) 4.x. (no support for 5+)
* [Handlebars](https://github.com/wycats/handlebars.js/) 4.x and up
* Node 8.x and up

It may work with older versions, but it hasn't been tested.

Support for a Hapi 17 environment is planned for a future version.

<br>

-----

<br>

## <a name="install"/>Install</a>

    npm install --save windshieldjs

<br>

-----

<br>

## <a name="usage"/>Usage</a>

### <a name="register"/>Register</a>

First, you must register the plugin with your Hapi server instance.

#### Example of registering plugin with options

    server.register({
        register: require('windshieldjs'),
        options: {
            rootDir: path.join(__dirname, 'app'),
            handlebars: require('handlebars'),
            uriContext: '/foo',
            routes: require('./app/routes'),
            components: require('./app/components'),
            path: ['./', '../../node_modules/some-module/src'],
            helpersPath: ['helpers', '../../node_modules/some-module/src/helpers']
        }
    }, function (err) {
        if (err) console.log(err);
    });

See [options](#options) below for details on each of these options.


### <a name="#structure">Project Structure</a>

By default, WindshieldJS expects your project to have the following structure:

- _rootDir_ (as specified by the `rootDir` option)
  - helpers (location of all helpers to be used by Handlebars, can be changed with `helpersPath` option)
  - layouts (location of all page-level templates)

The `path` option would allow you to change which directories in `rootDir` where the
layouts directory is expected, but Windshield still expects the directory to be called
"layouts".

The location of all other files (routes, components, etc) do not matter so long as
the code that registers Windshield can access them.

### <a href="#requestlifecycle">Request lifecycle</a>

When Hapi.js serves a request to a Windshield route, it performs the following
steps:

1. Get the [route context](#context) from the route settings.
1. Create a page context object based on the following:
    1. A copy of the route context.
    1. The results of running each of the [route prerequisites](#prereq).
    1. The results of running each of the [page adapters](#page-adapters)
1. [Render](#rendercomponent) each of the
   [component definitions](#componentdef) in the page context
1. Assemble all the rendered component objects into a rendered page object
1. Use the rendered page object to determine the page layout template to use.
1. Execute the page layout template with data from the rendered page object to produce HTML.
1. Set the response with the rendered HTML.


### <a name="rendercomponent">Rendering components</a>

The page context may contain an `associations` property that defines
groups of child component definitions. Each child may contain its own
 `associations` property defining its own children.

To render these components, Windshield processes them recursively,
[depth-first](https://en.wikipedia.org/wiki/Depth-first_search).  A component
will not render itself until all of its descendants have been rendered.

Each component definition has a reference to a [component type](#componenttype)
that should be used to render it.  The component type provides a set of
templates and a component adapter that is used to process data.  The
component definition can be configured to determine which template it used,
and to shape the data passed into the adapter.

The rendering process goes like this:

1. Render all descendants.
1. Get the child's [component type](#componenttype) .
1. Create a component context object based on the following:
    1. The data defined in the child
    1. The defaults provided by the component type
    1. The rendered descendant components.
    1. The result of running component type's adapter with page and
       component data
1. Choose one of the templates defined in the component type, based on the
   child's settings
1. Compile the template with the component context to produce a rendered
   component object.

The rendered component object will contain properties for `markup`
(the HTML produced from compiling the template) and `exported` (data that
is deliberately exposed for parent and ancestor components to access)

<br>

------

<br/>

## Concepts

### <a name="options" />Options</a>

- `components` - A hashmap of all the Windshield component types available on
                 the server.  Each key represents the name of the component
                 type, and its value is a
                 [component type config](#componenttype).

- `handlebars` - An instance of the Handlebars namespace.  Windshield needs
                 to use the same Handlebars instance as is used by your
                 project. To ensure it has access to the same object in
                 memory, you should provide this instance within the config
                 object.

- `helpersPath` - An optional array that specifies directories holding
                  handlebars helpers.  The default value is `['helpers']`,
                  relative to `rootDir`, meaning handlebars will look for
                  helpers in `rootDir/helpers` by default.  You can also add
                  absolute paths.

- `path` - An optional array that specifies parent directories where vision
           will look for the layouts sub-directory.  The default value is
           `['./']`, relative to `rootDir`, meaning vision will look for
           templates in `[rootDir]/layouts` by default.

- `rootDir` - A string representing the base path used as prefix for `path`
              and `helpersPath`.  Windshield will assume all page-level
              templates are kept in a `layouts` directory under this path.
              This should be the absolute path to the root directory of your
              project. (See note below about project structure requirements).

- `routes` - An array of [route definitions](#route).

- `uriContext` - This is the base URI under which windshield will register
                 all of your routes.  For example, if you set `uriContext`
                 to "/foo", and you have a route defined as "/bar", that
                 route will be accessible at "/foo/bar".


### <a name="#route">Route Definition</a>

Windshield processes route definitions into Hapi route configuration objects.

Each route definition is an object with the following members:

- `method` - The route's HTTP method (default is "GET")

- `path` - A string which acts as a path expression. It's handed off directly
  to Hapi's router when Windshield sets up your route.

- `context` - A [context object](#context)

- `adapters` - An array of [page adapter functions](#page-adapters)
               and [route prerequisite objects](#prereq).  When Windshield
               is initialized it immediately separates these out into
               two arrays.  It would be far less confusing to define these
               in two separate route config properties, which is planned
               for a future release.

- `pageFilter` - (optional) A Promise-returning function which will receive
  the final composed page object immediately before it is applied to the page
  layout template and any component templates. It provides one last chance for
  the developer to modify the page object. This can be useful for cases where
  the data contained in one component affects another component on the page.

### <a name="context">Context Object</a>

Each [Windshield route](#route) defines an object called the _route context_.
If this object is not configured for the route, an empty object is used by
default.  The route context is accessible during the request lifecycle
through the Hapi request object, via `request.route.settings.app.context`.

The route context is intended to remain static during the life of the server.
During a request, a copy of it is processed and modified by the route's
prerequisites and page adapters to produce a page context.

A _page context_ is expected to have the following properties:

- `layout` - A string referring to the file name for the Handlebars template
             which will be used to produce the final HTML response.
- `attributes` - A hashmap of page-level attributes.  These can be interpreted
                 By the page adapters and component adapters, and also passed
                 into Handlebars expressions in the layout template.
- `associations` - A hashmap where each key is an "association name" that
                   represents a "zone" on the page, and its value is an
                   array of [component definitions](#componentdef) which
                   will be used to render the content of those zones.

Technically, all of the above properties are optional: You may define a page
context with no layout, no attributes, and no associations, and Windshield
will simply look for a default.html template and try to render it without
empty data.

Once the page context has been fully assembled by the route prerequisites and
the page adapters, its `associations` object is used to render all of the
page's child components.  Each child will have a component adapter, and
 the page context is passed into this adapter so that it can produce a
 rendered component based on information about its parent page.

After all the child components have been rendered, the rendered components
and page context are used to assemble a rendered page object.


### <a name="#componenttype">Component Type Config</a>

A component type config is used to render component instances for that
type.  It determines what templates are available to use for producing the
 instance's HTML markup, and the logic used to determine the instance's data.
 Each instance will have its own markup and data, but the means of producing
 that markup and data are defined by its type.

Each component type config is an object containing the following members:

- `adapter` - A [component adapter](#component-adapters) function.

- `defaults` - Set of properties to include in every instance rendered from
               this component type.

- `templates` - hashmap of Promise-returning functions used to produce all the
                Handlebars templates available for this component type.

- `partials` - hashmap of Promise-returning functions used to register the
               Handlebars partials that are used by this component's
               templates.

### <a name="#componentdef">Component Definition</a>

A [page context object](#context) defines its child components using
_component definitions_.  These objects describe the
[component type config](#componenttype) that should be used to render it,
and additional settings for the rendering process.

Component definitions are kept in the page context's `associations` property.
A component definition may also have its own `associations` property
containing child component definitions.  As a result, a page context object
can be a very complex, nested structure.

A component definition is an object that can contain the following members:

- `component` - The name of the [component type config](#componenttype)
                that should be used to render this component.
- `data` - (optional) data to pass into the component adapter during
           rendering.
- `layout` - (optional) The name of a template defined in the component.
             If this is not defined, the parent association name is used.
- `associations` - A hashmap where each key is an "association name" that
                   represents a "zone" on the component, and its value is an
                   array of child component definitions that will be used to
                   render the content of those zones.

### <a name="prereq">Route Prerequisite</a>

A _Windshield route prerequisite_ is a customized version of Hapi's route
prerequisite.

In Windshield, a route prerequisite must be an object with the following
members:

- `method` - A function that accepts three arguments: the
             Windshield [route context](#context), the Hapi request object,
             and the Hapi `reply` interface.
- `assign` - (optional) key name used to assign the response of the
             method on the request object in `request.pre`

Windshield configures these objects so that Hapi will run them like normal
prerequisites in the request lifecycle.

If the `assign` property is, for example, "foo", the response produced by
`method` will be stored at `request.pre.foo`, and merged into the page
context immediately before the [page adapters](#page-adapters) are executed.
If the `assign` property is not defined, the `method` is still executed,
but its response is lost, unless it uses the `reply().takeover()` method
to take over the reply interface.

#### Example
Consider the following route definition:


    {
        context: {
            layout: "example"
        }
        path: '/listings',
        adapters: [
            doSomething
        ]
    }

Assuming the prerequisite has been defined like this:

    const doSomething = {
        method: function (context, request, reply) {
            reply({
                associations: {
                    body: [
                        { component: "something" }
                    ]
                }
            });
        },
        assign: 'foo'
    }

The page context will be

    {
        layout: "example",
        associations: {
            body: [
                { component: "something" }
            ]
        }
    }



### <a name="page-adapters">Page Adapter</a>

A _page adapter_ is a Promise-returning function.  During the request
lifecycle, the route's handler executes all of its page adapters, after
all of the route rerequisites have completed.  The values resolved from
each page adapter are merged into a copy of the route context, producing a
page context that is used to render all child components and the page itself.

#### Example

Consider the following [route definition](#route):

    {
        context: {
            layout: "example"
        }
        path: '/listings',
        adapters: [
            headerAdapter,
            searchAdapter,
            footerAdapter,
        ]
    }

Assuming the following page adapters have been defined:

    function headerAdapter(context, request) {
        return Promise.resolve({
            associations: {
                header: [
                    { component: "globalNav" }
                ]
            }
        });
    }

    function searchAdapter(context, request) {
        return Promise.resolve({
            attributes: {
                title: "Cars.com"
            },
            associations: {
                main: [
                    { component: "searchWidget" },
                    { component: "carListings" }
                ]
            }
        });
    }

    function footerAdapter(context, request) {
        return Promise.resolve({
            associations: {
                footer: [
                    { component: "footerNav" }
                ]
            }
        });
    }

The resulting page context, after all adapters have resolve, would be merged
together by Windshield and look like this:

    {
        layout: "example",
        attributes: {
            title: "Cars.com"
        },
        associations: {
            header: [
                { component: "globalNav" }
            ],
            main: [
                { component: "searchWidget" },
                { component: "carListings" }
            ],
            footer: [
                { component: “footerNav" }
            ],
        }
    }

### <a name="component-adapters" />Component Adapter</a>

A _component adapter_ is a Promise-returning function defined by a
component type config, which is used to process data for a component
definition.  The result resolved from the component adapter is then
 used to produce a rendered component object that contains the
component markup.

A component adapter accepts three parameters: The component's context,
the [page context](#context), and the Hapi request object.  The component
context is assembled from the component definition and the defaults provided
by the component type config.

The value resolved from the component adapter is expected to be an object
with the following methods:

- `data` - An arbitrary object which contains data to use when executing
           The component template.

- `export` - (optional) An object containing data which we want to expose for
             parent components and the page object.
- `exportAs` - (optional) String representing the key name that should be
               used when storing the `export` data in the rendered component
               object.

If the adapter's result does not follow the above format, the value is
wrapped in the above format, where `data` is the result and `export` and
`exportAs` are undefined.  This pattern is deprecated, however, and will
produce a warning if used.


<br>


-----

<br>

## License

Apache-2.0

