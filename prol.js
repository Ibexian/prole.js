const vorpal = require('vorpal')();
const fs = require('fs');
const webdriver = require('selenium-webdriver');
const ncp = require('ncp').ncp;
const cmd = require('node-cmd');

ncp.limit = 16;

var copyDir = function(source, destination) {
  ncp(source, destination, function (err) {
   if (err) {
     return console.error(err);
   }
   console.log('done!');
  });
};

vorpal
  .command('record', 'Installs service workers and records API server responses')
  //.option()
  .action(function(args, callback) {
    //Move files and folders to target directory (config, ask, or default)
      //fs.readfile => fs.writefile => main app file (likely app.js)
        //OR use selenium-webdriver to execute JS and bind serviceWorker that way
      //copyDir(sw.js, target/sw.js) ?
      //copyDir(/swDeps, target/swDeps);
    //Append to main file (config, ask, or default)
      //navigator.serviceWorker.register('/sw.js');
    //run server
      // default is cmd.run('npm run dev') in target directory
    //open window
      // var browser = new webdriver.Builder().usingServer().withCapabilities({'browserName': 'chrome' }).build();
    return this.prompt({ //https://www.npmjs.com/package/inquirer
      type: 'input',
      name: 'appPage',
      default: 'app.js',
      message: 'What\'s the name of the main js file? ',
    }, function(result){
      this.log("Binding to " + result.appPage);
      this.log("Server recording");
      callback();
    });
  });

vorpal
  .command('write <outputFile>', 'Stops any ongoing caching and saves the results')
  .action(function(args, callback) {
    //Access indexedDb in through selenium
    //Terminate Service worker through selenium "executescript"
    //save contents to file => fs.writefile(outputFile, content);
    //close window/instance
      //browser.quit();
    //Remove swDeps and sw.js - unappend main file
    var out = args.outputFile + ".json";
    fs.writeFile(out, 'Hello Node.js', (err) => {
      if (err) throw err;
      console.log('It\'s saved!');
      callback();
    });
  });

vorpal
  .command('serve <cacheFile>', 'Installs service workers and serves previously cached results')
  .action(function(args, callback){
    //move files
      // fs.readfile => fs.writefile => app.js
      // copyDir(swCache.js, target/swCache.js)
      // copy cacheFile as well
      // copyDir(/swDeps, target/swDeps);
    //run server
      // default is cmd.run('npm run dev') in target directory
    this.log("Serving cache from " + args.cacheFile);
    callback();
  });

vorpal
  .delimiter('prol$') //	⚒
  .show();
