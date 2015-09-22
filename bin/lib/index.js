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
    var badProjectErrMsg = "Current directory is not a windshieldjs project.";
    var rootDir = (argv.rootDir) ? argv.rootDir : path.join(cwd, 'src', 'app');

    try {
        pkg = require(path.join(process.cwd(), 'package.json'));
        if (!pkg.keywords || (pkg.keywords.indexOf('windshieldjs') === -1)) {
            throw new Error(badProjectErrMsg);
        }
    } catch (e) {
        console.log(chalk.magenta(badProjectErrMsg));
        console.log(chalk.magenta("Exiting now."));
        process.exit(0);
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
            "adapter"
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

    prompts.confirm = [{
        type: "confirm",
        name: "moveon",
        message: "Continue?"
    }];

    var handlers = {};

    handlers.component = function (answers) {

        function createComponent(data){
            var dest;

            data = (data != null) ? data : {};

            if (data.siloName) {
                dest = path.join(defaults.rootDir, 'components', data.siloName, answers.name);
            } else {
                dest = path.join(defaults.rootDir, 'components', answers.name);
            }

            inquirer.prompt(prompts.confirm, function (confirmation){
                if (!confirmation.moveon) {
                    console.log('Exiting now.');
                    process.exit(1);
                }
                gulp.src(__dirname + '/templates/component/**')
                    .pipe(template(answers))
                    .pipe(rename(function (file) {
                        if (file.basename[0] === '_') {
                            file.basename = '_' + file.basename.slice(1);
                        }
                    }))
                    .pipe(conflict(dest))
                    .pipe(gulp.dest(dest))
                    .on('end', function () {
                        done();
                    });
            });
        }

        if (answers.silo) {
            inquirer.prompt(prompts.componentSilo, createComponent);
        } else {
            createComponent();
        }

    };

    handlers.adapter = function (answers) {

        function createAdapter(data){
            var dest;

            data = (data != null) ? data : {};

            if (data.siloName) {
                dest = path.join(defaults.rootDir, 'adapters', data.siloName, answers.name);
            } else {
                dest = path.join(defaults.rootDir, 'adapters', answers.name);
            }

            inquirer.prompt(prompts.confirm, function (confirmation){
                if (!confirmation.moveon) {
                    console.log('Exiting now.');
                    process.exit(1);
                }
                gulp.src(__dirname + '/templates/adapter/**')
                    .pipe(template(answers))
                    .pipe(rename(function (file) {
                        if (file.basename[0] === '_') {
                            file.basename = '_' + file.basename.slice(1);
                        }
                    }))
                    .pipe(conflict(dest))
                    .pipe(gulp.dest(dest))
                    .on('end', function () {
                        done();
                    });
            });
        }

        if (answers.silo) {
            inquirer.prompt(prompts.adapterSilo, createAdapter);
        } else {
            createAdapter();
        }

    };

    inquirer.prompt(prompts.type, function (answers) {
        inquirer.prompt(prompts[answers.type], handlers[answers.type]);
    });

});

