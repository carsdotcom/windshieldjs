# windshield

An enterprise rendering plugin for hapi.

<br>

## Install

### Local

    npm install --save windshieldjs

### Global

To use the the CLI scaffolding interface, you will need to install windshield globally.

    npm install -g windshieldjs

<br>

## Usage

### Register

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


<br>

### Scaffolding

If you have installed windshield globally (see above) you can use the windshield
CLI tool to generate new components, adapters and layouts. Before your can use
this tool, you must ensure your project's `package.json` has `windshieldjs` as a
keyword. Once you have done this, you can simply run the `windshield` command
*from the project root* and you'll then be lead through a series of prompts.

    windshield

<br>
