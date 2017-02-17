(global => {
  'use strict';
  var cacheFileName = 'prol.json';

  // Load the sw-toolbox library.
  importScripts('/bower_components/sw-toolbox/sw-toolbox.js');

  // Ensure that our service worker takes control of the page as soon as possible.
  global.addEventListener('install', event => event.waitUntil(global.skipWaiting()));
  global.addEventListener('activate', event => event.waitUntil(global.clients.claim()));

  //Pre-cached File
  var cachedJson;

  var apiHandler = function(req) {
    var modUrl = req.url.replace(/(currentTime|now_time)=\d*&?/g, '');
    if (!cachedJson){
      return fetch(cacheFileName).then(function(response) {
        cachedJson = response.json(); //return cached response from json
        var cachedResp = cachedJson[modUrl];
        return new Response(cachedResp.response, {
          headers: { "Content-Type" : cachedResp.contentType }
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
