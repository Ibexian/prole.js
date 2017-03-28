const vorpal = require('vorpal')();
const fs = require('fs');
const {Builder, By, until} = require('selenium-webdriver');
const ncp = require('ncp').ncp;
const shell = require('shelljs');
const chalk = require('chalk');
var browser;

//Current Defaults
const targetDir = '/Users/wkamovitch/Sites/compass/src/js';
const defaultUrl = 'http://localhost:9000/';

ncp.limit = 16;

var copyDir = function(source, destination) {
  return new Promise(function(resolve, reject){
    fs.stat(__dirname + source, function(err, stat) {
      if (!err) {
        ncp(__dirname + source, targetDir + destination, function (err) {
         if (err) { reject(err); }
         resolve();
        });
      } else {
        reject(`Issue with ${source} (${err.code}) - Aborting`);
      }
    });
  });
};

var moveFilesAndOpenBrowser = function(promiseArr, address, message, callback) {
  Promise.all(promiseArr).then(() => {
    vorpal.log(chalk.blue("Files Moved"));
    if (browser) { //clear out any existing Selenium instances
      browser.quit();
      browser = '';
    }
    //open window
    require('chromedriver');
    browser = new Builder()
      .usingServer()
      .withCapabilities({'browserName': 'chrome' })
      .build();
    browser.get(address)
      .then(() => {
        vorpal.log(chalk.green(message));
        browser.executeScript('navigator.serviceWorker.register("/js/sw.js")');
        vorpal.show();
        callback();
      });
  }, reason => { //if the promises fail don't try to open the browser
    vorpal.log(chalk.red(reason));
    vorpal.exec('clean');
    callback();
  });
};

vorpal
  .command('record', 'Installs service workers and records API server responses')
  //.option()
  .action(function(args, callback) {
    var self = this;
    //TODO binding serviceWorker
      // selenium-webdriver to execute JS and bind serviceWorker that way
        // Unbind any already registered service workers
        // then register the one we want navigator.serviceWorker.register('/sw.js');
    return this.prompt({ //https://www.npmjs.com/package/inquirer
      type: 'input',
      name: 'targetURL',
      default: defaultUrl,
      message: 'What\'s the target url to record? ',
    }, function(result){
      self.log("Binding to " + targetDir);
      vorpal.hide();
      //Move files and folders to target directory (config, ask, or default)
      var fileArr = [copyDir('/workers/sw.js','/sw.js'), copyDir('/swDeps', '/swDeps')];
      moveFilesAndOpenBrowser(fileArr, result.targetURL, "Server recording", callback);
    });
  });

vorpal
  .command('write <outputName>', 'Stops any ongoing caching and saves the results')
  .action(function(args, callback) {
    //TODO Access indexedDb in through selenium
    //save contents to file => fs.writefile(outputFile, content);
    var out = args.outputName + ".json";
    fs.writeFile(out, 'Hello Node.js', (err) => {
      if (err) throw err;
      vorpal.log('It\'s saved!');
      callback();
    });

    //Wrap the above in a promise (https://github.com/dthree/vorpal/wiki/API-%7C-vorpal#vorpalexeccommand-callback)
    return vorpal.exec('clean');
  });

  vorpal
    .command('clean', 'Stops any ongoing caching without writing to file')
    .alias('clear')
    .action(function(args, callback) {
      //TODO Terminate Service worker through selenium "executescript"
      //close window/instance
      try {
        browser.quit();
        browser = ''; //Clear out the browser variable to allow for new instances
      } catch (e) {
        this.log('No Selenium instance to close');
      }
      //Remove swDeps and sw.js or swCache.js
      shell.rm('-rf', targetDir + '/swDeps');
      shell.rm(targetDir + '/sw.js', targetDir + '/cacheSw.js');
      this.log(chalk.green('Selenium closed and service workers removed'));
      vorpal.show();
      callback();
    });

vorpal
  .command('serve <cacheFile>', 'Installs service workers and serves previously cached results')
  .action(function(args, callback){
    var self = this;
    return this.prompt({ //https://www.npmjs.com/package/inquirer
      type: 'input',
      name: 'targetURL',
      default: defaultUrl,
      message: 'What\'s the target url for serving the cache? ',
    }, function(result){
      self.log("Binding to " + targetDir);
      vorpal.hide();
      //Move files and folders to target directory (config, ask, or default)
      var fileArr = [copyDir('/workers/cacheSw.js', '/cacheSw.js'), copyDir('/' + args.cacheFile , '/' + args.cacheFile), copyDir('/swDeps', '/swDeps')];
      moveFilesAndOpenBrowser(fileArr, result.targetURL, "Serving cache from " + args.cacheFile, callback);
    });
  });

vorpal
  .delimiter('prol⚒')
  .show();
