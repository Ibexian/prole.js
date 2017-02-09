const vorpal = require('vorpal')();
const fs = require('fs');


vorpal
  .command('record', 'Installs service workers and records API server responses')
  //.option()
  .action(function(args, callback) {
    //navigator.serviceWorker.register('/sw.js');
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
    this.log("Serving cache from " + args.cacheFile);
    callback();
  });

vorpal
  .delimiter('prol$')
  .show();
