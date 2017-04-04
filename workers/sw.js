var reg = /(dmp|api)/;
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
      var requestProl = indexedDB.open('prolDB', 13);
      var db;

      requestProl.onerror = function(event){
        reject(event);
      };
      requestProl.onupgradeneeded = function(event){
        db = event.target.result;
        // Create an objectStore for this database
        var objectStore = db.createObjectStore("caches");

        objectStore.transaction.oncomplete = function(event) {
          console.log("resolve");
          resolve(db);
        };
      };
    });
  };
  var prolDB = openDb();
  var recordedResponses = {};

  var apiHandler = function(req) {
    var modUrl = req.url.replace(/(currentTime|now_time)=\d*&?/g, '');
    var altResp;
    var modReq = new Request(modUrl, {
        method: req.method,
        headers: req.headers,
        mode: 'same-origin', // need to set this properly
        credentials: req.credentials,
        redirect: 'manual'   // let browser handle redirects
    });
    return fetch(modReq).then(function(response) {
      var contentType = response.headers.get('Content-Type');
      var addToDB = function(data){
        prolDB.then(function(db) {
          var tx = db.transaction("caches", "readwrite").objectStore("caches");
          var put = tx.put(data, data.url);
          put.onerror = function(event) {
            console.log(event);
          };
        });
      };
      if (contentType === 'application/json') {
        response.clone().json().then(function(altResp){
          var putData = {'url': modUrl, 'response': JSON.stringify(altResp), 'contentType': contentType};
          addToDB(putData);
        });
      } else {
        response.clone().text().then(function(altResp){
          var putData = {'url': modUrl, 'response': altResp, 'contentType': contentType};
          addToDB(putData);
        });
      }
      return response;
    });
  };

  toolbox.router.any(reg, apiHandler);

})(self);
