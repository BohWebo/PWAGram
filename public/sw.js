importScripts('/src/js/idb.js');
importScripts('/src/js/db.js');

const STATIC_CACHE_NAME = 'static-v4.3';
const DYNAMIC_CACHE_NAME = 'dynamic-v3.5';
const requests = [
    '/',
    '/index.html',
    '/offline.html',
    '/src/js/app.js',
    '/src/js/feed.js',
    '/src/js/idb.js',
    '/src/js/material.min.js',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

self.addEventListener('install', handleInstallEvent);
self.addEventListener('activate', handleActiveEvent);
self.addEventListener('fetch', handleFetchEvent);


async function handleInstallEvent(e) {
    console.log('[SW] install', e);
    const cache = await caches.open(STATIC_CACHE_NAME);

    console.log('[SW] precaching app shell');
    e.waitUntil(cache.addAll(requests));
}

async function handleActiveEvent(e) {
    console.log('[SW] activate', e);
    const keys = await caches.keys();
    const promise = Promise.all(keys.map(transformKeyToPromise));

    e.waitUntil(promise);

    return self.clients.claim();
}

//TODO:Strategy cache first

// function handleFetchEvent(e) {
//     console.log('[SW] fetch event handle', e);
//
//     function saveResToCache(res) {
//         return caches
//             .open(DYNAMIC_CACHE_NAME)
//             .then(cache => void cache.put(e.request.url, res.clone()) || res)
//     }
//
//     const response = caches
//         .match(e.request)
//         .then(response => response
//             ? response
//             : fetch(e.request)
//                 .then(saveResToCache))
//                 .catch(() => caches
//                     .open(STATIC_CACHE_NAME)
//                     .then(cache => cache.match('/offline.html')));
//
//     e.respondWith(response);
// }


//TODO: Strategy network first
async function handleFetchEvent(event) {
    console.log('[SW] fetch event handle', event);
    const url = 'https://pwagram-f2fd8.firebaseio.com/posts.json';

    if (event.request.url.includes(url)) {
        const response = await fetch(event.request);
        const clonedRes = response.clone();
        const data = await clonedRes.json();

        for (const post of Object.values(data)) {
            const db = await dbPromise;
            const tx = db.transaction('posts', 'readwrite');
            const store = tx.objectStore('posts');

            store.put(post);
        }

        event.respondWith(response);
    } else {

        try {
            const response = await fetch(event.request);
            event.respondWith(saveResToCache(response, event));
        } catch (e) {
            event.respondWith(errorHandler(e, event));
        }
    }
}


async function saveResToCache(res, e) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    cache.put(e.request.url, res.clone());

    return res;
}

async function errorHandler(err, e) {
    console.error('[SW fetch handler request catching]', err);
    const response = await caches.match(e.request);

    if (response) return response;

    try {
        const cache = await caches.open(STATIC_CACHE_NAME);

        return cache.match('/offline.html')
    } catch (e) {
        console.log('[SW] failed attempt to get an offline page from the cache' + e)
    }
}

async function transformKeyToPromise(key) {
    if (STATIC_CACHE_NAME !== key && DYNAMIC_CACHE_NAME !== key) {
        console.log('[SW removing old cache]', key);

        return caches.delete(key);
    }
}
