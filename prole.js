const vorpal = require('vorpal')();
const prole = require('./prole-test');

vorpal
  .command('record', 'Installs service workers and records API server responses')
  .option('-a, --address <url>', 'Use a non-default url')
  .option('-r, --regex <regexString>', 'Use non-default regex to determine which requests get recorded')
  .types({
    string: ['a', 'address']
  })
  .action(function(args, callback) {
    var self = this;
    var targetURL = args.options.address;
    var regex = args.options.regex;
    prole.record({'targetURL': targetURL, 'regex': regex, 'vorpal': vorpal, 'callback': callback});
  });

vorpal
  .command('write <outputName>', 'Stops any ongoing caching and saves the results')
  .option('-l, --log', 'Saves any strict mode serving errors to log')
  .action(function(args, callback) {
    prole.write({'outputName': args.outputName, 'callback': callback, 'vorpal': vorpal, 'options': args.options});
  });

vorpal
  .command('clean', 'Stops any ongoing caching without writing to file')
  .alias('clear')
  .action(function(args, callback) {
    prole.clean({'callback': callback, 'vorpal': vorpal});
  });

vorpal
  .command('serve <cacheFile>', 'Installs service workers and serves previously cached results from json')
  .option('-a, --address <url>', 'Use a non-default url')
  .option('-n, --nonlocal', 'cacheFile is not located in the prole.js directory')
  .option('-r, --regex <regexString>', 'Use non-default regex to determine which requests get intercepted')
  .option('-s, --strict', 'Disables fallback to server for requests not in cache file')
  .types({
    string: ['a', 'address']
  })
  .action(function(args, callback){
    var self = this;
    prole.serve({'options': args.options, 'vorpal': vorpal, 'callback': callback, 'cacheFile': args.cacheFile});
  });

vorpal
  .delimiter('prole ⚒')
  .show()
  .parse(process.argv);
