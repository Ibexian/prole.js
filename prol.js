const vorpal = require('vorpal')();
const fs = require('fs');
const {Builder} = require('selenium-webdriver');
const ncp = require('ncp').ncp;
const shell = require('shelljs');
const chalk = require('chalk');
var browser;

//Current Defaults
const targetDir = '/Users/wkamovitch/Sites/compass/src';
const defaultUrl = 'http://localhost:9000/';

ncp.limit = 16;

/*
TODO
  Generalize swDeps in service worker code
  Change location of cache file?
  Make sure POST calls also cache
  Option to bypass prompt?
*/

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

var moveFilesAndOpenBrowser = function(promiseArr, address, message, callback, sw) {
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
        browser.executeScript('navigator.serviceWorker.register("'+ sw +'")');
        browser.executeScript('location.reload()');
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
    return this.prompt({
      type: 'input',
      name: 'targetURL',
      default: defaultUrl,
      message: 'What\'s the target url to record? ',
    }, function(result){
      self.log("Binding to " + targetDir);
      vorpal.hide();
      //Move files and folders to target directory (config, ask, or default)
      var fileArr = [copyDir('/workers/sw.js','/sw.js'), copyDir('/swDeps', '/swDeps')];
      moveFilesAndOpenBrowser(fileArr, result.targetURL, "Server recording", callback, 'sw.js');
    });
  });

vorpal
  .command('write <outputName>', 'Stops any ongoing caching and saves the results')
  .action(function(args, callback) {
    var out = args.outputName + ".json";
    //JS to pass to the open browser through Selenium
    var dbPromise = `var openDb = function() {
      return new Promise(function(resolve, reject){
        var requestProl = indexedDB.open('prolDB');
        requestProl.onsuccess = function(event){
          var tx = event.target.result.transaction("caches", "readwrite").objectStore("caches").getAll();
          tx.onsuccess = function(event) { resolve(event.target.result); };
        };
      });
    };
    openDb().then(contents => dbContents = contents);`;
    var writeToFile = function(fileName, content){
      fs.writeFile(fileName, content, (err) => {
        if (err) throw err;
        vorpal.log('It\'s saved!');
        callback();
      });
    };
    browser.executeScript(dbPromise).then(function(){ //Set up the promise in the browser
      browser.executeScript('return dbContents').then(function(content){ //get the returned value
        var contentObj = {};
        content.map(call => contentObj[call.url] = call);
        writeToFile(out, JSON.stringify(contentObj)); //save db contents to file
      });
    });
    return vorpal.exec('clean');
  });

  vorpal
    .command('clean', 'Stops any ongoing caching without writing to file')
    .alias('clear')
    .action(function(args, callback) {
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
  .command('serve <cacheFile>', 'Installs service workers and serves previously cached results from json')
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
      var respMessage = "Serving cache from " + args.cacheFile;
      var fileArr = [
        copyDir('/workers/cacheSw.js', '/cacheSw.js'),
        copyDir('/' + args.cacheFile + '.json' , '/prol.json'),
        copyDir('/swDeps', '/swDeps')
      ];

      moveFilesAndOpenBrowser(fileArr, result.targetURL, respMessage, callback, 'cacheSw.js');
    });
  });

vorpal
  .delimiter('prol⚒')
  .show()
  .parse(process.argv);
