(global => {
  'use strict';

  // Load the sw-toolbox library.
  importScripts('/bower_components/sw-toolbox/sw-toolbox.js');

  //Set timer for writes

  // Ensure that our service worker takes control of the page as soon as possible.
  global.addEventListener('install', event => event.waitUntil(global.skipWaiting()));
  global.addEventListener('activate', event => event.waitUntil(global.clients.claim()));
  var recordedResponses = {};

  var apiHandler = function(req) {
    var modUrl = req.url.replace(/(currentTime|now_time)=\d*&?/g, '');
    var modReq = new Request(modUrl, {
        method: req.method,
        headers: req.headers,
        mode: 'same-origin', // need to set this properly
        credentials: req.credentials,
        redirect: 'manual'   // let browser handle redirects
    });

    toolbox.cache(modReq, {cache: {
      name: "recordedResponses"
    }});
    return fetch(modReq).then(function(response) {
      if (response.headers.get('Content-Type') === 'application/json') {
        response.clone().json().then(function(altResp){
          recordedResponses[modUrl] = altResp;
        });
      } else {
        response.clone().text().then(function(altResp){
          recordedResponses[modUrl] = altResp;
        });
      }
      console.log(JSON.stringify(recordedResponses));
      return response;
    });
  };

  toolbox.router.get(/(dmp|api)/, apiHandler);

})(self);
