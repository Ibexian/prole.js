(global => {
  'use strict';

  // Load the sw-toolbox library.
  importScripts('/swDeps/sw-toolbox/sw-toolbox.js');

  // Ensure that our service worker takes control of the page as soon as possible.
  global.addEventListener('install', event => event.waitUntil(global.skipWaiting()));
  global.addEventListener('activate', event => event.waitUntil(global.clients.claim()));

  //Pre-cached File
  var cachedJson;

  var apiHandler = function(req) {
    var modUrl = req.url.replace(/(currentTime|now_time)=\d*&?/g, '');
    if (!cachedJson){
      //TODO Figure out initial load weirdness
      return fetch('prol.json').then(function(response) {
        response.json().then(function(jsonRep){  //return cached response from json
          cachedJson = jsonRep;
          var cachedResp = cachedJson[modUrl];
          return new Response(cachedResp.response, {
            headers: { "Content-Type" : cachedResp.contentType }
          });
        });
      });
    } else {
      //return cached response from json
      var cachedResp = cachedJson[modUrl];
      return new Response(cachedResp.response, {
        headers: { "Content-Type" : cachedResp.contentType }
      });
    }
  };
  //catch all not just get
  toolbox.router.get(/(dmp|api)/, apiHandler);

})(self);
