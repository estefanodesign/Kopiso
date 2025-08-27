// Service Worker for Kopiso E-commerce Platform
// Provides caching, offline support, and performance optimization

const CACHE_NAME = 'kopiso-v1.0.0'
const STATIC_CACHE = 'kopiso-static-v1.0.0'
const DYNAMIC_CACHE = 'kopiso-dynamic-v1.0.0'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/products',
  '/cart',
  '/checkout',
  '/profile',
  '/admin',
  '/manifest.json',
  // Add critical CSS and JS files here
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/products/,
  /\/api\/categories/,
  /\/api\/auth\/me/,
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }
  
  // Handle static assets
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request))
    return
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }
  
  // Default: network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone()
        caches.open(DYNAMIC_CACHE)
          .then((cache) => {
            cache.put(request, responseClone)
          })
        return response
      })
      .catch(() => {
        return caches.match(request)
      })
  )
})

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful GET requests
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
    }
    
    // Return offline response for critical endpoints
    if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'You are offline. Please check your connection.',
          offline: true
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    throw error
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  // Try cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Fetch from network and cache
  try {
    const networkResponse = await fetch(request)
    const cache = await caches.open(STATIC_CACHE)
    cache.put(request, networkResponse.clone())
    return networkResponse
  } catch (error) {
    // Return placeholder for images
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af">Image unavailable</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      )
    }
    throw error
  }
}

// Handle navigation requests
async function handleNavigation(request) {
  try {
    return await fetch(request)
  } catch (error) {
    // Return cached page or offline fallback
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page
    return caches.match('/offline.html') || new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Kopiso</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-message { max-width: 400px; margin: 0 auto; }
            h1 { color: #e53e3e; }
            p { color: #666; margin: 20px 0; }
            button { 
              background: #3182ce; 
              color: white; 
              border: none; 
              padding: 10px 20px; 
              border-radius: 5px; 
              cursor: pointer; 
            }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>You're Offline</h1>
            <p>It looks like you're not connected to the internet. Please check your connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}

// Utility functions
function isStaticAsset(request) {
  const url = new URL(request.url)
  return url.pathname.includes('/static/') ||
         url.pathname.includes('/_next/') ||
         url.pathname.includes('/images/') ||
         url.pathname.includes('/icons/') ||
         request.destination === 'image' ||
         request.destination === 'script' ||
         request.destination === 'style'
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Handle offline actions when connection is restored
  try {
    const offlineActions = await getOfflineActions()
    for (const action of offlineActions) {
      await processOfflineAction(action)
    }
    await clearOfflineActions()
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

async function getOfflineActions() {
  // Get actions stored while offline
  const db = await openDB()
  const transaction = db.transaction(['offlineActions'], 'readonly')
  const store = transaction.objectStore('offlineActions')
  return store.getAll()
}

async function processOfflineAction(action) {
  // Process actions like cart updates, form submissions, etc.
  try {
    const response = await fetch(action.url, {
      method: action.method,
      headers: action.headers,
      body: action.body
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    console.log('Offline action processed:', action.id)
  } catch (error) {
    console.error('Failed to process offline action:', error)
  }
}

async function clearOfflineActions() {
  const db = await openDB()
  const transaction = db.transaction(['offlineActions'], 'readwrite')
  const store = transaction.objectStore('offlineActions')
  await store.clear()
}

// Simple IndexedDB wrapper
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KopisoDB', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('offlineActions')) {
        const store = db.createObjectStore('offlineActions', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: data.data,
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action) {
    // Handle action buttons
    handleNotificationAction(event.action, event.notification.data)
  } else {
    // Handle notification click
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    )
  }
})

function handleNotificationAction(action, data) {
  switch (action) {
    case 'view_order':
      clients.openWindow(`/orders/${data.orderId}`)
      break
    case 'view_product':
      clients.openWindow(`/products/${data.productId}`)
      break
    default:
      clients.openWindow('/')
  }
}