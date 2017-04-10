(global => {
  'use strict';

  // Load the sw-toolbox library.
  importScripts('/swDeps/sw-toolbox/sw-toolbox.js', '/swDeps/reg.js');

  // Ensure that our service worker takes control of the page as soon as possible.
  global.addEventListener('install', event => event.waitUntil(global.skipWaiting()));
  global.addEventListener('activate', event => event.waitUntil(global.clients.claim()));

  //Pre-cached File
  var cachedJson;

  //Compare request with cached
  var postHandler = function(req) {
    if (proleOpts.strict) {
      return req.clone().text().then(function(text){
        return apiHandler(req, 'POST', text);
      });
    }
    return apiHandler(req, 'POST');
  };

  var apiHandler = function(req, type, reqText) {
    console.log(req, type, reqText);
    type = type ? type : 'GET';
    var modUrl = req.url.replace(/(currentTime|now_time)=\d*&?/g, ''); // remove anti-caching url modifiers
    var checkPostRequestData = function(cachedReqText) { //checks request post data against cached request data
      if (proleOpts.strict && type === 'POST') {
        console.log(cachedReqText, reqText);
        return cachedReqText === reqText;
      }
      return true;
    };
    if (!cachedJson) {
      return fetch('prole.json').then(function(response) {
        response.json().then(function(jsonRep) {  //return cached response from json
          cachedJson = jsonRep;
          var cachedResp = cachedJson[type + ":" + modUrl];
          if (cachedResp && checkPostRequestData(cachedResp.requestContent)) {
            return new Response(cachedResp.response, {
              headers: { "Content-Type" : cachedResp.contentType }
            });
          } else if (!proleOpts.strict) {
            return fetch(req);
          }
        });
      });
    } else if (cachedJson[type + ":" + modUrl]) {
      //return cached response from json
      var cachedResp = cachedJson[type + ":" + modUrl];
      //In strict mode we want non-matching requests to fail
      if (!checkPostRequestData(cachedResp.requestContent)){ return; }
      return new Response(cachedResp.response, {
        headers: { "Content-Type" : cachedResp.contentType }
      });
    } else if (!proleOpts.strict) { //pass through any requests not in the cacheFile if not in strict mode
      return fetch(req);
    }
  };

  toolbox.router.get(proleOpts.reg, apiHandler);
  toolbox.router.post(proleOpts.reg, postHandler);

})(self);
