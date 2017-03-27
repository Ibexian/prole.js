const vorpal = require('vorpal')();
const fs = require('fs');
const webdriver = require('selenium-webdriver');
const ncp = require('ncp').ncp;
const shell = require('shelljs');
var browser;

//Current Defaults
const targetDir = '/Users/wkamovitch/Sites/compass/src/js';

ncp.limit = 16;

var copyDir = function(source, destination) {
  //TODO Check that source exists
  ncp(source, destination, function (err) {
   if (err) {
     return console.error(err);
   }
   console.log(source + " moved");
  });
};

vorpal
  .command('record', 'Installs service workers and records API server responses')
  //.option()
  .action(function(args, callback) {
    var self = this;
    //binding serviceWorker
      // selenium-webdriver to execute JS and bind serviceWorker that way
        // Unbind any already registered service workers
        // then register the one we want navigator.serviceWorker.register('/sw.js');
    return this.prompt({ //https://www.npmjs.com/package/inquirer
      type: 'input',
      name: 'targetURL',
      default: 'http://localhost:9000/',
      message: 'What\'s the target url to record? ',
    }, function(result){
      self.log("Binding to " + targetDir);
      //Move files and folders to target directory (config, ask, or default)
      copyDir(__dirname + '/workers/sw.js', targetDir + '/sw.js');
      copyDir(__dirname + '/swDeps', targetDir  + '/swDeps');
      //open window - probably need to close any existing web driver instances
      require('chromedriver');
      browser = new webdriver.Builder().usingServer().withCapabilities({'browserName': 'chrome' }).build();
      browser.get(result.targetURL);
      self.log("Server recording");
      // callback();
    });
  })
  .cancel(function () { //This is not yet working
    this.log('Closing chromedriver and removing service workers');
    browser.quit();
  });

vorpal
  .command('write <outputFile>', 'Stops any ongoing caching and saves the results') //This might need to happen inside record
  .action(function(args, callback) {
    //Access indexedDb in through selenium
    //Terminate Service worker through selenium "executescript"
    //save contents to file => fs.writefile(outputFile, content);
    var out = args.outputFile + ".json";
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
      //Terminate Service worker through selenium "executescript"
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
      default: 'http://localhost:9000/',
      message: 'What\'s the target url to record? ',
    }, function(result){
      self.log("Binding to " + targetDir);
      //Move files and folders to target directory (config, ask, or default) - This is a duplicate action of 'record' - pull this out
      copyDir(__dirname + '/workers/sw.js', targetDir + '/swCache.js'); //copy main service worker
      copyDir(__dirname + '/' + args.cacheFile , targetDir + '/' + args.cacheFile); //caching file
      copyDir(__dirname + '/swDeps', targetDir  + '/swDeps'); //dependencies
      //open window
      require('chromedriver');
      browser = new webdriver.Builder().usingServer().withCapabilities({'browserName': 'chrome' }).build();
      browser.get(result.targetURL);
      self.log("Serving cache from " + args.cacheFile);
      // callback();
    });
  });

vorpal
  .delimiter('prol⚒') //
  .show();
