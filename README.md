# WindshieldJS

An Enterprise Rendering plugin for Hapi.js.

<br>

-----

<br>

## Table of Contents

* [Install](#install)
* [Usage](#usage)
    - [Register](#register)
    - [Options](#options)
    - [Page Adapters & Objects](#page-adapters)
    - [Component Adapters & Objects](#component-adapters)
    - [Scaffolding](#scaffolding)

<br>

-----

<br>

## <a name="install"/>Install

    npm install --save windshieldjs

<br>

-----

<br>

## <a name="usage"/>Usage

### <a name="register"/>Register

First, you must register the plugin with your Hapi server instance.

#### Example of registering plugin with options

    server.register({
        register: require('windshieldjs'),
        options: {
            rootDir: path.join(__dirname, 'app'),
            handlebars: require('handlebars'),
            uriContext: '/foo',
            routes: require('./app/routes'),
            components: require('./app/components')
        }
    }, function (err) {
        if (err) console.log(err);
    });

See options below for details on each of these options.


### <a name="options" />Options

#### `rootDir`

This should be the absolute path to the root directory of your project. Page `layouts` and Handlebars `helpers` will be looked for at this location. (See note below about project structure requirements).

#### `handlebars`

Windshield needs to use the same handlebars instance as is used by your project. To ensure it has access to the same object in memory, you should provide this instance within the config object.

#### `uriContext`

This is the base URI under which windshield will register all of your routes. For example, if you set `uriContext` to "/foo", and you have a route defined as "/bar", that route will be accessible at "/foo/bar".

#### `routes`

The `routes` property on the Windshield config object is an array of route definitions.

Each route definition within the `routes` array option is a configuration object with the following properties:

- `path` - This is a string which acts as a path expression. It's handed off directly to Hapi's router when Windshield sets up your route.
- `context` - This is an object which may contain route specific context to be referenced by the adapters.
- `adapters` - This is an array of adapter implementations. An adapter is Promise-returning function which resolves with a page object. (More on page objects below.)
- `pageFilter` - This is an optional property which can be set as a Promise-returning function which will receive the final composed page object immediately before it is applied to the page layout template and any component templates. It provides one last chance for the developer to modify the page object. This can be useful for cases where the data contained in one component affects another component on the page.

#### `components`

The `components` property on the Windshield config object is an object which serves as a map of component implementations. The property names on this object are component names and the value of each property is a component's implementation object.

Each component implementation is an object with the following properties: `template`, `Model` and `adapter`. The template property is the only thing that is required, the Model and adapter are optional. A model should be a constructor function which recieves and returns an object. A Model is used for simple translation and transformation of component data. An adapter is a function which returns the Promise—this promise should resolve with an object. Adapters are used for pulling in external data for the component to use from client libraries, etc.

The `template` property of the component implementation should be a function which returns a Promise—this Promise should resolve with a Handlebars template string. To make this as easy as possible, a helper method called `readTemplate` is available on the `windshield` object which takes the absolute path to a template file and generated the proper function for export.

### <a name="page-adapters" />Page Adapters & Objects

A page object is an object with the following properties: `layout`,  `attributes` and `associations`. All page object properties are optional.

- `layout` - This is a string the value of which is the name of the Handlebars layout to use for the overall page.
- `attributes` - This is an object each property of which is a string. These serve as page-level attributes.
- `associations` - This is an object which serves as a map of "named associations". You can think of an association as a zone within the page layout. Each property name is the assocation name, and the value of each property is a collection of component objects to be contained within that association.

Adapters are Promise-returning functions which resolve with page objects. Each route definition has an array of adapters, each of which will be called and resolve with a page object. All the resultant page objects are then merged back together to create one single page object which can be applied to the page layout.

For example, take the following route definition:

    {
        path: '/listings',
        adapters: [
            headerAdapter,
            searchAdapter,
            footerAdapter,
        ]
    }

The `headerAdapter` in the example above, might return a partial page object which looks like this:

    {
        associations: {
            header: [
                { component: "globalNav" }
            ]
        }
    }

The `searchAdapter` in the example above, might return a partial page object which looks like this:

    {
        attributes: {
            title: "Cars.com"
        },
        associations: {
            main: [
                { component: "searchWidget" },
                { component: "carListings" }
            ]
        }
    }

The `footerAdapter` in the example above, might return a partial page object which looks like this:

    {
        associations: {
            footer: [
                { component: "footerNav" }
            ]
        }
    }

The resulting page object, after all adapters have resolve, would be composed together by Windshield and would look like this:

    {
        layout: "default",
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

### <a name="component-adapters" />Component Adapters & Objects

Components can also have their own adapters. The data which resolves from component adapter will be added back onto the component object within the `data` property. Component objects should return an object with their data contained inside a `data` property. This specification did not used to exists and currently a can component can still resolve with its data at the object root instead of inside a data property but this usage pattern is now deprecated and will not be supported in coming releases. After the component adapter has been processed, a component object within the page object might then look like this:

    {
        component: "globalNav",
        data: {
            items: [
                {
                    displayName: "Buy",
                    href: "/for-sale/"
                },
                {
                    displayName: "Sell &amp; Trade",
                    href: "/sell/"
                },
                {
                    displayName: "Service &amp; Repair",
                    href: "/auto-repair/"
                },
                {
                    displayName: "News",
                    href: "/news/"
                }
            ]
        }
    }

In this way, each component referenced in the original page object, as generated by the page adapters, is hydrated until all of the data needed to render the final HTML of the page is contained in one composite page object.

Optionally, a component can also resolve with an `export` and an `exportAs` property. Data "exported" in this manner will then be usable within any template (whether it be a layout template or a component template) by using the `{exported}` handlerbars helper. This is a new feature. More details on this coming soon.

<br>

-----

<br>

### <a name="scaffolding"/>Scaffolding

windshieldjs comes with a binary CLI tool to generate new components, adapters
and layouts. Run `./node_modules/.bin/windshield` *from the project root* of
any project that has windshieldjs installed and you'll be lead through a series
of prompts.

    ./node_modules/.bin/windshield

<br>

-----

<br>

### Project Structure

WindshieldJS is mostly driven by configuration, but due to the way Hapi's
"vision" plugin works, your main page "layouts" directory must be located
directly within the `rootDir` of your project. If you are using Handlebars
helpers, you must add a `helpers` directory inside `rootDir` as well.

- `rootDir`
  - helpers
  - layouts
