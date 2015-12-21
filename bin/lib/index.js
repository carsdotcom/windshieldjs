var gulp = require('gulp');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var chalk = require('chalk');
var path = require('path');
var conflict = require('gulp-conflict');
var template = require('gulp-template');
var rename = require('gulp-rename');
var _ = require('lodash');
var inquirer = require('inquirer');
var cwd = process.cwd();
var argv = require('minimist')(process.argv.slice(2));

function format(string) {
    var username = string.toLowerCase();
    return username.replace(/\s/g, '');
}

var defaults = (function () {
    var homeDir;
    var osUserName;
    var configFile;
    var user;
    var pkg;
    var rootDir = (argv.rootDir) ? argv.rootDir : path.join(cwd, 'lib', 'app');

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

    var prompts = {};

    prompts.type = [{
        type: 'list',
        name: 'type',
        message: 'What would you like to make?',
        default: defaults.type,
        choices: [
            "component",
            "adapter",
            "route collection"
        ]
    }];

    prompts.component = [{
        name: "name",
        message: "What would you like to name of the component?"
    }, {
        type: "confirm",
        name: "silo",
        message: "Would you like the component to be in a subdirectory?"
    }];

    prompts.componentSilo = [{
        name: "siloName",
        message: "What is the name of the subdirectory you would like to add your component to?"
    }];

    prompts.adapter = [{
        name: "name",
        message: "What would you like to name of the adapter?"
    }, {
        type: "confirm",
        name: "silo",
        message: "Would you like the adapter to be in a subdirectory?"
    }];

    prompts.adapterSilo = [{
        name: "siloName",
        message: "What is the name of the subdirectory you would like to add your adapter to?"
    }];

    prompts['route collection'] = [{
        name: "name",
        message: "What would you like to name of the route collection?"
    }];

    prompts.confirm = [{
        type: "confirm",
        name: "moveon",
        message: "Continue?"
    }];

    function generateArtifactHandler(type) {
        return function (answers) {

            function create(data) {
                var dest;

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

                    gulp.src(__dirname + '/templates/' + type + '/**', { dot: true})
                        .pipe(template(answers))
                        .pipe(rename(function (file) {
                            if (file.extname === '.js' && type === 'route') file.basename = answers.name;
                        }))
                        .pipe(conflict(dest))
                        .pipe(gulp.dest(dest))
                        .on('end', function () {
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

    var handlers = {};

    handlers.component = generateArtifactHandler('component');
    handlers.adapter = generateArtifactHandler('adapter');
    handlers['route collection'] = generateArtifactHandler('route');

    inquirer.prompt(prompts.type, function (answers) {
        inquirer.prompt(prompts[answers.type], handlers[answers.type]);
    });

});

