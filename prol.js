const vorpal = require('vorpal')();
const fs = require('fs');
const webdriver = require('selenium-webdriver');
const ncp = require('ncp').ncp;
const shell = require('shelljs');
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
        reject(`Issue with ${source} (${err.code})`);
      }
    });
  });
};

var createOpenBrowser = function(address, message) {
  require('chromedriver');
  browser = new webdriver.Builder()
    .usingServer()
    .withCapabilities({'browserName': 'chrome' })
    .build();
  browser.get(address)
    .then(console.log(message));
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
      //Move files and folders to target directory (config, ask, or default)
      Promise.all([copyDir('/workers/sw.js','/sw.js'), copyDir('/swDeps', '/swDeps')]).then(() => {
        console.log("Files Moved");
        //open window - probably need to close any existing web driver instances
        createOpenBrowser(result.targetURL, "Server recording");
      }, reason => { //if the promises fail don't try to open the browser
        vorpal.exec('clean');
        console.log(reason);
        callback();
      });
    });
  });

vorpal
  .command('write <outputName>', 'Stops any ongoing caching and saves the results') //This might need to happen inside record
  .action(function(args, callback) {
    //TODO Access indexedDb in through selenium
    //save contents to file => fs.writefile(outputFile, content);
    var out = args.outputName + ".json";
    fs.writeFile(out, 'Hello Node.js', (err) => {
      if (err) throw err;
      console.log('It\'s saved!');
      callback();
    });

    //Wrap the above in a promise (https://github.com/dthree/vorpal/wiki/API-%7C-vorpal#vorpalexeccommand-callback)
    return vorpal.exec('clean');
  });

  vorpal
    .command('clean', 'Stops any ongoing caching without writing to file') //This might need to happen inside record
    .action(function(args, callback) {
      //TODO Terminate Service worker through selenium "executescript"
      //close window/instance
      try {
        browser.quit();
      } catch (e) {
        this.log('No Selenium instance to close');
      }
      //Remove swDeps and sw.js or swCache.js - unappend main file
      shell.rm('-rf', targetDir + '/swDeps');
      shell.rm(targetDir + '/sw.js', targetDir + '/swCache.js');
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
      //TODO Verify files actually moved else stop trying
      //Move files and folders to target directory (config, ask, or default)
      Promise.all([copyDir('/workers/swCache.js', '/swCache.js'), copyDir('/' + args.cacheFile , '/' + args.cacheFile), copyDir('/swDeps', '/swDeps')])
        .then(() => {
          console.log("Files Moved");
          //open window - probably need to close any existing web driver instances
          createOpenBrowser(result.targetURL, "Serving cache from " + args.cacheFile);
        }, reason => {
          vorpal.exec('clean');
          console.log(reason);
          callback();
        });
    });
  });

vorpal
  .delimiter('prol⚒')
  .show();
