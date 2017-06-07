'use strict';

const fs = require('fs');
const {Builder} = require('selenium-webdriver');
const ncp = require('ncp').ncp;
const shell = require('shelljs');
const chalk = require('chalk');
const jsdiff = require('diff');
var browser;
var defaultCB = function(){console.log('default');};
var prole = {};

ncp.limit = 16;

//Current Defaults
prole.targetDir = '/Users/wkamovitch/Sites/compass/src';
prole.defaultUrl = 'http://localhost:9000/';
prole.defaultRegex = '(dmp|api)';

var copyDir = function(source, destination, nonlocal) {
  return new Promise(function(resolve, reject){
    var src = nonlocal ? source : __dirname + source;
    fs.stat(src, function(err, stat) {
      if (!err) {
        ncp(src, prole.targetDir + destination, function (err) {
        //  if (err && err[0].code !== 'EEXIST') {
        //    //we're ok with the file already existing (this helps with running tests in parallel)
        //    reject(err);
        //  }
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

var moveFilesAndOpenBrowser = function(promiseArr, address, message, callback, sw, vorpal, instanceBrowser) {
  var logger = vorpal ? vorpal : console;
  Promise.all(promiseArr).then(() => {
    logger.log(chalk.blue("Files Moved"));
    if (browser) { //clear out any existing Selenium instances
      browser.quit();
      browser = '';
    }
    //open window
    require('chromedriver');
    var tempBrowser = new Builder()
      .usingServer()
      .withCapabilities({'browserName': 'chrome' })
      .build();
    tempBrowser.get(address)
      .then(() => {
        logger.log(chalk.green(message));
        tempBrowser.executeScript('navigator.serviceWorker.register("'+ sw +'")').then(function(){
          tempBrowser.sleep(1000);
        });
        if (vorpal){vorpal.show();}
        if (!instanceBrowser) {
          browser = tempBrowser;
          callback();
        } else {
          callback(tempBrowser);
        }
      });
  }, reason => { //if the promises fail don't try to open the browser
    logger.log(chalk.red(reason));
    prole.clean({'callback': callback, 'vorpal': vorpal});
    callback();
  });
};

prole.record = function(args){
  var logger = args.vorpal ? args.vorpal : console;
  var callback = args.callback || defaultCB;
  var targetURL = args.targetURL || prole.defaultUrl;
  var regex = args.regex || prole.defaultRegex;

  logger.log("Binding to " + prole.targetDir);
  if(args.vorpal){args.vorpal.hide();}
  //Create regex file
  createOptionsFile(regex);
  //Move files and folders to target directory (config, ask, or default)
  var fileArr = [copyDir('/workers/sw.js','/sw.js'), copyDir('/swDeps', '/swDeps')];
  moveFilesAndOpenBrowser(fileArr, targetURL, "Server recording", callback, 'sw.js', args.vorpal);
};

prole.write = function(args){
  var out = args.outputName + ".json";
  var logger = args.vorpal ? args.vorpal : console;
  var callback = args.callback || defaultCB;
  var options = args.options || {};
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
      if (options.log && content.length && content[0].expected) { //Only save the serve log if errors exist
        content.map(function(call) {
          var diff = jsdiff.diffChars(call.expected, call.actual);
          var diffString = '';
          diff.map(function(part){
            var partColor = part.added ? chalk.green :
              part.removed ? chalk.red : chalk.gray;
            diffString += partColor(part.value);
          });
          logger.log(diffString);
        });
        contentObj = content;
      } else {
        content.map(call => contentObj[call.method + ":" + call.url] = call);
      }
      writeToFile(out, JSON.stringify(contentObj, null, 4), callback); //save db contents to file
    });
  }).then(function(){prole.clean(args);});
};

prole.clean = function(args){
  var logger = args.vorpal ? args.vorpal : console;
  var callback = args.callback || defaultCB;
  //close window/instance
  try {
    browser.quit();
    browser = ''; //Clear out the browser variable to allow for new instances
  } catch (e) {
    logger.log('No Selenium instance to close');
  }
  //Remove swDeps and sw.js or swCache.js
  shell.rm('-rf', prole.targetDir + '/swDeps');
  shell.rm(prole.targetDir + '/sw.js', prole.targetDir + '/cacheSw.js', prole.targetDir + '/prole.json');
  logger.log(chalk.green('Selenium closed and service workers removed'));
  if(args.vorpal){args.vorpal.show();}
  callback();
};

prole.serve = function(args){
  var logger = args.vorpal ? args.vorpal : console;
  var callback = args.callback || defaultCB;
  var {nonlocal, address = prole.defaultUrl, regex = prole.defaultRegex, strict} = args.options;
  logger.log("Binding to " + prole.targetDir);
  if(args.vorpal){args.vorpal.hide();}
  //Create regex file
  createOptionsFile(regex, strict);
  //Move files and folders to target directory (config, ask, or default)
  var respMessage = "Serving cache from " + args.cacheFile;
  var fileArr = [
    copyDir('/workers/cacheSw.js', '/cacheSw.js'),
    copyDir('/' + args.cacheFile + '.json' , '/prole.json', nonlocal),
    copyDir('/swDeps', '/swDeps')
  ];

  moveFilesAndOpenBrowser(fileArr, address, respMessage, callback, 'cacheSw.js', args.vorpal, args.instanceBrowser);
};

prole.driver = function(args) {
  //Returns a new selenium instance serving from a cache
  return new Promise(function(resolve, reject){
    args.instanceBrowser = true;
    args.callback = function(x){resolve(x);};
    prole.serve(args);
  });
};

module.exports = prole;
