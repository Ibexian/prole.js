Prol.js - power to the workers
------
Prol.js is an automated server cacher and stub using Service Workers

### Build Instructions
`nvm use`

`npm install -g bower`

`npm install && bower install`

`node prol.js`

### Prol Commands
`record` - Installs service worker and records API server responses while you use the site

`write <outputName>` - Stops any ongoing caching and saves the results to `<outputName>.json`

`clean` - Stops any ongoing caching without writing to file

`serve <cacheFile>` - Installs service worker and serves previously cached results from `<cacheFile>.json`
