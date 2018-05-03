const crayon = require('caporal');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const exec = require('../../utils/execute.js');
const config = require('../../utils/config');
const storeStub = fs.readFileSync(path.resolve(`${__dirname}/stubs/index.js`), 'utf8');

const configJsDir = config.get('js_directory');
const configJsEntry = config.get('js_entry');

const jsDir = `${process.cwd()}/${ configJsDir !== undefined ? configJsDir : 'resources/assets/js' }`;
const appEntry = `${jsDir}/${ configJsEntry !== undefined ? configJsEntry : 'app.js' }`;
const storeLocation = `${jsDir}/store`;

crayon.command('add:vuex', 'Adds Vuex to your project')
    .action((args, options, logger) => {
        
        // Read app.js
        if (!fs.existsSync(appEntry)) {
            return logger.error(chalk.red('App entry point not found.'));
        }

        const appJs = fs.readFileSync(appEntry, 'utf8');
        const appJsArray = appJs.split('\n');

        // Insert store import
        appJsArray.splice(0, 0, 'import store from \'./store\';\n');

        // Insert store into vue initialise
        if (!appJsArray.includes('new Vue({')) {
            return logger.info(chalk.red('Please add Vue to your project first.'));
        }

        // Install Vuex
        exec('yarn add vuex', false).catch((err) => {
            logger.error(chalk.red(`ERROR: ${JSON.stringify(err)}`));
        });

        // Create store
        fs.ensureDirSync(storeLocation);

        // Create store/index.js
        fs.writeFileSync(`${storeLocation}/index.js`, storeStub);

        const newVueIndex = appJsArray.indexOf('new Vue({');
        appJsArray.splice(newVueIndex + 1, 0, '    store,');

        // Write app.js with new lines
        fs.writeFileSync(appEntry, appJsArray.join('\n'));

        logger.info(chalk.green('Vuex installed successfully.'));
    });