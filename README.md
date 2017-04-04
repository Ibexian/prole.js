Prol.js - power to the workers ⚒
------
Prol.js is an automated server cacher and stub using Service Workers

### Build Instructions
    nvm use
    npm install -g bower
    npm install && bower install
    node prol.js

### Prol Commands
#### record
Installs service worker and records API server responses while you use the site

#### write <outputName>
Stops any ongoing caching and saves the results to `<outputName>.json`

#### clean
Stops any ongoing caching without writing to file

#### serve <cacheFile>
Installs service worker and serves previously cached results from `<cacheFile>.json`

### Prol Options
#### --address
Both the `record` and `serve` actions allow for overwriting of the default address (http://localhost:9000/) through use of the `-a` or `--address` option.

  e.g. `record -a http://localhost:8080/`

#### --regex
The `--regex` or `-r` command overwrites which requests are intercepted by the service workers for either the `record` or `serve` command. By default this is set to `(dmp|api)`

#### --nonlocal
The `serve` command also allows the user to stipulate direct links to cache files with the `-n` or `--nonlocal` option.

  e.g. `serve /Users/{SomeUser}/demo`

### Running Prol Commands Directly
Any of the above prol commands can be run from outside the prol interface by appending them to the `node prol.js` call. This allows for `serve` to be part of an automated testing suite.

e.g. `node prol.js serve demo`
