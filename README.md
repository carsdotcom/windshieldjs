# WindshieldJS

An Enterprise Rendering plugin for Hapi.js.

<br>

-----

<br>

## Important Note

The majority of documentation for the Cars.com content rendering initiative
exists within the [www-cars-com-rendering]() project for the time being.

More detailed documentation for the WindshieldJS plugin will be added as the
new platform proves itself and stablizes.

<br>

-----

<br>

## Table of Contents

* [Install](#install)
    - [Local](#local)
    - [Global](#global)
* [Usage](#usage)
    - [Register](#register)
    - [Scaffolding](#scaffolding)

<br>

-----

<br>

## <a name="install"/>Install

### <a name="local"/>Local

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
            paths: require('./app/paths'),
            uriContext: '/foo',
            routes: require('./app/routes')
        }
    }, function (err) {
        if (err) console.log(err);
    });


### <a name="scaffolding"/>Scaffolding

windshieldjs comes with a binary CLI tool to generate new components, adapters
and layouts. Run `./node_modules/.bin/windshield` *from the project root* of
any project that has windshieldjs installed and you'll be lead through a series
of prompts.

    ./node_modules/.bin/windshield

<br>

-----

<br>

## Project Structure

WindshieldJS favors convention over configuration. A WindshieldJS project
must conform to the following project structure (relative to the provided
`rootDir` option).

* <rootDir>
    - adapters
    - components
    - helpers
    - layouts

While currently not required, it is also recommended that you create a
`routes` directory in order to keep your project well organized. This may
become a convention in future versions.
