Prole.js - power to the workers ⚒
------
Prole.js is an automated server cacher and stub using Service Workers

### Build Instructions
    nvm use
    npm install -g bower
    npm install && bower install
    node prole.js

### Prole Commands
#### record
Installs service worker and records API server responses while you use the site

#### write <outputName>
Stops any ongoing caching and saves the results to `<outputName>.json`. After serving with the `--strict` tag from json, the write command can also accept a `--log` option to save a log of all POST requests that did not match those in the cached json file.

#### clean
Stops any ongoing caching without writing to file

#### serve <cacheFile>
Installs service worker and serves previously cached results from `<cacheFile>.json`

### Prole Options
#### --address
Both the `record` and `serve` actions allow for overwriting of the default address (http://localhost:9000/) through use of the `-a` or `--address` option.

  e.g. `record -a http://localhost:8080/`

#### --regex
The `--regex` or `-r` command overwrites which requests are intercepted by the service workers for either the `record` or `serve` command. By default this is set to `(dmp|api)`

#### --nonlocal
The `serve` command also allows the user to stipulate direct links to cache files with the `-n` or `--nonlocal` option.

  e.g. `serve /Users/{SomeUser}/demo`

#### --strict
Passing the `--strict` or `-s` option to `serve` modifies how prole serves from cache. By default any non-cached request is passed through. With strict mode any non-cached request will fail.
Strict mode also verifies that any data attached to a POST request matches the "requestContent" in the cache file.

### Running Prole Commands Directly
Any of the above prole commands can be run from outside the prole interface by appending them to the `node prole.js` call. This allows for `serve` to be part of an automated testing suite.

e.g. `node prole.js serve demo`
