'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const gulpif = require('gulp-if');
const chalk = require('chalk');
const path = require('path');
const conflict = require('stream-conflict');
const rename = require('gulp-rename');
const _ = require('lodash');
const inquirer = require('inquirer');
const cwd = process.cwd();
const argv = require('minimist')(process.argv.slice(2));
const template = require('gulp-template');

function format(string) {
    let username = string.toLowerCase();
    return username.replace(/\s/g, '');
}

let defaults = (function () {
    let homeDir;
    let osUserName;
    let configFile;
    let user;
    let pkg;
    let rootDir = (argv.rootDir) ? argv.rootDir : path.join(cwd, 'lib', 'app');

    try {
        pkg = require(path.join(process.cwd(), 'package.json'));
    } catch (e) {
        console.log(chalk.magenta("Error reading `package.json`."));
        console.log(chalk.magenta("Exiting now."));
        process.exit(1);
    }

    if (process.platform === 'win32') {
        homeDir = process.env.USERPROFILE;
        osUserName = process.env.USERNAME || path.basename(homeDir).toLowerCase();
    } else {
        homeDir = process.env.HOME || process.env.HOMEPATH;
        osUserName = homeDir && homeDir.split('/').pop() || 'root';
    }

    configFile = path.join(homeDir, '.gitconfig');
    user = {};

    if (require('fs').existsSync(configFile)) {
        user = require('iniparser').parseSync(configFile).user;
    }

    return {
        type: 'component',
        userName: osUserName || format(user.name || ''),
        authorName: user.name || '',
        authorEmail: user.email || '',
        rootDir: rootDir
    };
}());

gulp.task('default', function (done) {

    let prompts = {};

    prompts.type = [{
        type: 'list',
        name: 'type',
        message: chalk.blue.bgBlack('What would you like to make?'),
        default: defaults.type,
        choices: [
            "component",
            "adapter",
            "route"
        ]
    }];

    function filenameValidate(name) {
        let isValid = /^[a-z]+[a-z0-9]*$/gi.test(name);
        (!isValid) && console.log('\nPlease use camelCase with alphanumeric characters only, first character must be a letter');
        return isValid;
    }

    prompts.component = [{
        name: "name",
        message: chalk.blue.bgBlack("What would you like to name of the component?"),
        validate: filenameValidate
    }, {
        type: "confirm",
        name: "silo",
        message: chalk.blue.bgBlack("Would you like the component to be in a subdirectory?")
    }];

    prompts.componentSilo = [{
        name: "siloName",
        message: chalk.blue.bgBlack("What is the name of the subdirectory you would like to add your component to?"),
        validate: filenameValidate
    }];

    prompts.adapter = [{
        name: "name",
        message: chalk.blue.bgBlack("What would you like to name of the adapter?"),
        validate: filenameValidate
    }, {
        type: "confirm",
        name: "silo",
        message: chalk.blue.bgBlack("Would you like the adapter to be in a subdirectory?")
    }];

    prompts.adapterSilo = [{
        name: "siloName",
        message: chalk.blue.bgBlack("What is the name of the subdirectory you would like to add your adapter to?"),
        validate: filenameValidate
    }];

    prompts.route = [{
        name: "name",
        message: chalk.blue.bgBlack("What would you like to name the route?"),
        validate: filenameValidate
    }];

    prompts.confirm = [{
        type: "confirm",
        name: "moveon",
        message: chalk.blue.bgBlack("Continue?")
    }];

    function generateArtifactHandler(type) {
        return function (answers) {

            function create(data) {
                let dest;

                data = (data != null) ? data : {};

                if (type === 'route') {
                    dest = path.join(defaults.rootDir, type + 's');
                } else if (data.siloName) {
                    dest = path.join(defaults.rootDir, type + 's', data.siloName, answers.name);
                } else {
                    dest = path.join(defaults.rootDir, type + 's', answers.name);
                }

                inquirer.prompt(prompts.confirm, function (confirmation){

                    if (!confirmation.moveon) {
                        console.log('Exiting now.');
                        process.exit(1);
                    }

                    gulp.src(__dirname + '/templates/' + type + '/**', { dot: true })
                        .pipe(template(answers))
                        .pipe(rename(function (file) {
                            if (file.extname === '.js' && type === 'route') file.basename = answers.name;
                        }))
                        .pipe(conflict(dest))
                        .pipe(gulp.dest(dest))
                        .on('end', function () {
                            if (type === 'route') console.log('\n\nRun your application and checkout your new route at "/scaffolded-' + answers.name + '"\n');
                            done();
                        });
                });
            }

            if (answers.silo) {
                inquirer.prompt(prompts[type + 'Silo'], create);
            } else {
                create();
            }
        };

    };

    let handlers = {};

    handlers.component = generateArtifactHandler('component');
    handlers.adapter = generateArtifactHandler('adapter');
    handlers.route = generateArtifactHandler('route');

    inquirer.prompt(prompts.type, function (answers) {
        inquirer.prompt(prompts[answers.type], handlers[answers.type]);
    });

});
