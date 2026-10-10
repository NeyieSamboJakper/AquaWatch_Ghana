// Bump this when you want to force clients to drop old cached pages/assets —
// changing this string changes the file's bytes, which is what makes browsers
// notice an update and install a new service worker.
const CACHE_VERSION = 'v3'
const CACHE_NAME = `aquawatch-${CACHE_VERSION}`
const OFFLINE_URL = '/offline'

const PRECACHE_URLS = [
  '/',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Path prefixes/extensions we're willing to runtime-cache. Deliberately
// narrow — anything not matched here (including Next.js's internal RSC data
// fetches used by router.push/router.refresh) just passes straight through
// to the network, uncached.
//
// Intentionally excludes /_next/static/ — those chunk URLs are NOT guaranteed
// stable across rebuilds in dev mode (Turbopack can reuse a path for
// different content), so cache-first here can serve stale JS indefinitely.
// Next.js/the browser's own HTTP cache already handles these efficiently in
// production (they're content-hashed there), so there's no upside to also
// caching them ourselves.
const CACHEABLE_STATIC = /^\/icons\//
const CACHEABLE_EXT = /\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf)$/

function isNextInternalRequest(request, url) {
  return (
    request.headers.get('RSC') === '1' ||
    request.headers.has('Next-Router-State-Tree') ||
    request.headers.has('Next-Router-Prefetch') ||
    request.headers.has('Next-Action') ||
    url.searchParams.has('_rsc')
  )
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Never touch Supabase or any other cross-origin request — this app's data
  // is live, and silently serving a stale cached API response would be worse
  // than just failing when offline.
  if (url.origin !== self.location.origin) return

  // Never intercept Next.js's own data-fetch requests — the App Router relies
  // on these being fresh every time (router.push/router.refresh, prefetch,
  // server actions). Caching them previously corrupted the client router.
  if (isNextInternalRequest(request, url)) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match(OFFLINE_URL))),
    )
    return
  }

  if (!CACHEABLE_STATIC.test(url.pathname) && !CACHEABLE_EXT.test(url.pathname)) return

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)
    }),
  )
})
