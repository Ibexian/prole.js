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
const defaultRegex = '(dmp|api)';

ncp.limit = 16;

var copyDir = function(source, destination, nonlocal) {
  return new Promise(function(resolve, reject){
    var src = nonlocal ? source : __dirname + source;
    fs.stat(src, function(err, stat) {
      if (!err) {
        ncp(src, targetDir + destination, function (err) {
         if (err) { reject(err); }
         resolve();
        });
      } else {
        reject(`Issue with ${source} (${err.code}) - Aborting`);
      }
    });
  });
};

var writeToFile = function(fileName, content, cb){
  fs.writeFile(fileName, content, (err) => {
    if (err) throw err;
    vorpal.log(fileName + ' saved!');
    if(cb) {
      cb();
    }
  });
};

var createOptionsFile = function(reg, strict) {
  //Move regex and other options to file then bind to service workers
  var fileName = 'swDeps/reg.js';
  var content = `(function (global) {'use strict';
    var proleOpts = function(){}; proleOpts.reg = /${reg}/; proleOpts.strict = ${Boolean(strict)};
    global.proleOpts = proleOpts;})(this);`;
  writeToFile(fileName,content);
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
        browser.executeScript('navigator.serviceWorker.register("'+ sw +'")').then(function(){
          browser.sleep(1000);
          //browser.executeScript('location.reload()');
        });
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
  .option('-a, --address <url>', 'Use a non-default url')
  .option('-r, --regex <regexString>', 'Use non-default regex to determine which requests get recorded')
  .types({
    string: ['a', 'address']
  })
  .action(function(args, callback) {
    var self = this;
    var targetURL = args.options.address || defaultUrl;
    var regex = args.options.regex || defaultRegex;
    self.log("Binding to " + targetDir);
    vorpal.hide();
    //Create regex file
    createOptionsFile(regex);
    //Move files and folders to target directory (config, ask, or default)
    var fileArr = [copyDir('/workers/sw.js','/sw.js'), copyDir('/swDeps', '/swDeps')];
    moveFilesAndOpenBrowser(fileArr, targetURL, "Server recording", callback, 'sw.js');
  });

vorpal
  .command('write <outputName>', 'Stops any ongoing caching and saves the results')
  .action(function(args, callback) {
    var out = args.outputName + ".json";
    //JS to pass to the open browser through Selenium
    var dbPromise = `var openDb = function() {
      return new Promise(function(resolve, reject){
        var requestProle = indexedDB.open('proleDB');
        requestProle.onsuccess = function(event){
          var tx = event.target.result.transaction("caches", "readwrite").objectStore("caches").getAll();
          tx.onsuccess = function(event) { resolve(event.target.result); };
        };
      });
    };
    openDb().then(contents => dbContents = contents);`;
    browser.executeScript(dbPromise).then(function() { //Set up the promise in the browser
      browser.sleep(1000);
      browser.executeScript('return dbContents').then(function(content){ //get the returned value
        var contentObj = {};
        content.map(call => contentObj[call.method + ":" + call.url] = call);
        writeToFile(out, JSON.stringify(contentObj), callback); //save db contents to file
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
      shell.rm(targetDir + '/sw.js', targetDir + '/cacheSw.js', targetDir + '/prole.json');
      this.log(chalk.green('Selenium closed and service workers removed'));
      vorpal.show();
      callback();
    });

vorpal
  .command('serve <cacheFile>', 'Installs service workers and serves previously cached results from json')
  .option('-a, --address <url>', 'Use a non-default url')
  .option('-n, --nonlocal', 'cacheFile is not located in the prole.js directory')
  .option('-r, --regex <regexString>', 'Use non-default regex to determine which requests get recorded')
  .option('-s, --strict', 'Disables fallback to server for requests not in cache file')
  .types({
    string: ['a', 'address']
  })
  .action(function(args, callback){
    var self = this;
    var {nonlocal, address = defaultUrl, regex = defaultRegex, strict} = args.options;
    self.log("Binding to " + targetDir);
    vorpal.hide();
    //Create regex file
    createOptionsFile(regex, strict);
    //Move files and folders to target directory (config, ask, or default)
    var respMessage = "Serving cache from " + args.cacheFile;
    var fileArr = [
      copyDir('/workers/cacheSw.js', '/cacheSw.js'),
      copyDir('/' + args.cacheFile + '.json' , '/prole.json', nonlocal),
      copyDir('/swDeps', '/swDeps')
    ];

    moveFilesAndOpenBrowser(fileArr, address, respMessage, callback, 'cacheSw.js');

  });

vorpal
  .delimiter('prole ⚒')
  .show()
  .parse(process.argv);
