'use strict';

console.log('Hi from your service-worker.js file!');

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/db.js',
  '/index.js',
  '/main.js',
  '/manifest.webmanifest',
  '/assets/images/icons/icon-192x192.png',
  'style.css'
];

const CACHE_NAME = 'static-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';

self.addEventListener(`install`, event => {
  console.log(`begin install`);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log(`Your files were pre-cached successfully!`);
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

self.addEventListener(`activate`, event => {
  console.log(`being activate`);
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log(`Removing old cache data`, key);
            return caches.delete(key);
          }
          return undefined;
        })
      )
    )
  );

  self.clients.claim();
});

self.addEventListener(`fetch`, event => {
  console.log(`begin fetch`);
  // cache successful requests to the API
  if (event.request.url.includes(`/api/`)) {
    event.respondWith(
      caches
        .open(DATA_CACHE_NAME)
        .then(cache =>
          fetch(event.request)
            .then(response => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(event.request.url, response.clone());
              }

              return response;
            })
            // Network request failed, try to get it from the cache.
            .catch(() => cache.match(event.request))
        )
        .catch(err => console.error(err))
    );
  } else {
    // if the request is not for the API, serve static assets using "offline-first" approach.
    // https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook#cache-falling-back-to-network
    event.respondWith(
      caches
        .match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
