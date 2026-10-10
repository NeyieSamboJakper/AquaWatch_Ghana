'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Only register in production — dev-mode bundles aren't content-hashed,
    // so a cached service worker can serve stale JS across rebuilds and make
    // fixed bugs look like they're still happening.
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('Service worker registration failed:', err)
      })
    }
  }, [])

  return null
}
