(global => {
  'use strict';

  // Load the sw-toolbox library.
  importScripts('/swDeps/sw-toolbox/sw-toolbox.js', '/swDeps/reg.js');

  // Ensure that our service worker takes control of the page as soon as possible.
  global.addEventListener('install', event => event.waitUntil(global.skipWaiting()));
  global.addEventListener('activate', event => event.waitUntil(global.clients.claim()));

  //Pre-cached File
  var cachedJson;

  // Open DB
  var openDb = function() {
    return new Promise(function(resolve, reject){
      var requestProle = indexedDB.open('proleDB', 13);
      var db;

      requestProle.onerror = function(event){
        reject(event);
      };
      requestProle.onupgradeneeded = function(event){
        db = event.target.result;
        // Create an objectStore for this database
        var objectStore = db.createObjectStore("caches");

        objectStore.transaction.oncomplete = function(event) {
          console.log("Database Opened");
          resolve(db);
        };
      };
    });
  };
  var proleDB = openDb();
  var callIndex = 0;

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
        var requestMatch = cachedReqText === reqText;
        console.log(cachedReqText, reqText);
        if (!requestMatch) {
          var reqData = {'expected': cachedReqText, 'actual': reqText};
          proleDB.then(function(db) { //Store incorrect requests
            var tx = db.transaction("caches", "readwrite").objectStore("caches");
            var put = tx.put(reqData, callIndex);
            callIndex++;
            put.onerror = function(event) {
              console.log(event);
            };
          });
        }
        return requestMatch;
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
