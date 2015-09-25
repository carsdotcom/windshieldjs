# windshield

An enterprise rendering plugin for hapi.

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

### <a name="global"/>Global

To use the the CLI scaffolding interface, you will need to install windshield globally.

    npm install -g windshieldjs

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
            paths: require('./app/paths')
        }
    }, function (err) {
        if (err) console.log(err);
    });


### <a name="scaffolding"/>Scaffolding

If you have installed windshield globally (see above) you can use the windshield
CLI tool to generate new components, adapters and layouts. Before your can use
this tool, you must ensure your project's `package.json` has `windshieldjs` as a
keyword. Once you have done this, you can simply run the `windshield` command
*from the project root* and you'll then be lead through a series of prompts.

    windshield

<br>
