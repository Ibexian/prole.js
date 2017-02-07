const vorpal = require('vorpal')();
const fs = require('fs');

vorpal
  .command('record', 'Installs service workers and records API server responses')
  //.option()
  .action(function(args, callback) {
    this.log("Server recording");
    callback();
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
