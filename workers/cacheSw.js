(global => {
  'use strict';

  // Load the sw-toolbox library.
  importScripts('/swDeps/sw-toolbox/sw-toolbox.js', '/swDeps/reg.js');

  // Ensure that our service worker takes control of the page as soon as possible.
  global.addEventListener('install', event => event.waitUntil(global.skipWaiting()));
  global.addEventListener('activate', event => event.waitUntil(global.clients.claim()));

  //Pre-cached File
  var cachedJson;

  var apiHandler = function(req) {
    var modUrl = req.url.replace(/(currentTime|now_time)=\d*&?/g, ''); // remove anti-caching url modifiers
    if (!cachedJson) {
      return fetch('prole.json').then(function(response) {
        response.json().then(function(jsonRep){  //return cached response from json
          cachedJson = jsonRep;
          var cachedResp = cachedJson[modUrl];
          if (cachedResp) {
            return new Response(cachedResp.response, {
              headers: { "Content-Type" : cachedResp.contentType }
            });
          } else {
            return fetch(req);
          }
        });
      });
    } else if (cachedJson[modUrl]) {
      //return cached response from json
      var cachedResp = cachedJson[modUrl];
      return new Response(cachedResp.response, {
        headers: { "Content-Type" : cachedResp.contentType }
      });
    } else { //pass through any requests not in the cacheFile
      return fetch(req);
    }
  };
  //catch all not just get
  toolbox.router.get(reg.reg, apiHandler);

})(self);
