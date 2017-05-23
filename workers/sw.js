(global => {
  'use strict';

  // Load the sw-toolbox library.
  importScripts('/swDeps/sw-toolbox/sw-toolbox.js', '/swDeps/reg.js');

  // Ensure that our service worker takes control of the page as soon as possible.
  global.addEventListener('install', event => event.waitUntil(global.skipWaiting()));
  global.addEventListener('activate', event => event.waitUntil(global.clients.claim()));

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
  var recordedResponses = {};

  var postHandler = function(req, values) {
    return req.clone().text().then(function(text){
      return apiHandler(req, text);
    });
  };

  var apiHandler = function(req, reqText) {
    var modUrl = req.url.replace(/(currentTime|now_time)=\d*&?/g, '');
    console.log('Cached: ', modUrl);
    var altResp;
    return fetch(req).then(function(response) {
      var contentType = response.headers.get('Content-Type');
      var addToDB = function(data){
        proleDB.then(function(db) {
          var tx = db.transaction("caches", "readwrite").objectStore("caches");
          var put = tx.put(data, data.method + ":" + data.url);
          put.onerror = function(event) {
            console.log(event);
          };
        });
      };
      var putData = function(resp, type) {
        var putData = {
          'url': modUrl,
          'response': resp,
          'contentType': contentType,
          'method': req.method,
          'requestContent': reqText
        };
        if(type === 'json'){putData.response = JSON.stringify(resp);}
        addToDB(putData);
      };
      if (contentType === 'application/json') {
        response.clone().json().then(
          function(altResp){putData(altResp, 'json');}
        );
      } else {
        response.clone().text().then(
          function(altResp){putData(altResp);}
        );
      }
      return response;
    });
  };
  //If the request is a get cache the response
  toolbox.router.get(proleOpts.reg, apiHandler);
  //If the request is a post also cache the request and the response
  toolbox.router.post(proleOpts.reg, postHandler);

})(self);
