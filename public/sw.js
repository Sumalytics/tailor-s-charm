const CACHE_NAME = 'tailorflow-v2';
const STATIC_CACHE_NAME = 'tailorflow-static-v2';
const DYNAMIC_CACHE_NAME = 'tailorflow-dynamic-v2';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  // Add other static assets as needed
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/',
  '/dashboard',
  '/customers',
  '/orders',
  '/measurements',
  '/settings'
];

// Cache strategies
const CACHE_STRATEGIES = {
  STATIC: 'cache-first',
  API: 'network-first',
  DYNAMIC: 'stale-while-revalidate'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Pre-cache critical API responses
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Preparing dynamic cache');
        return cache; // We'll add items as they're requested
      })
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - implement different caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip Firebase requests - let them go through network directly
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('firebasestorage.googleapis.com') || 
      url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('googleapis.com')) {
    return;
  }
  
  // Determine cache strategy
  let strategy = CACHE_STRATEGIES.DYNAMIC;
  
  if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
    strategy = CACHE_STRATEGIES.STATIC;
  } else if (API_CACHE_PATTERNS.some(pattern => request.url.includes(pattern))) {
    strategy = CACHE_STRATEGIES.API;
  }
  
  // Apply the appropriate strategy
  switch (strategy) {
    case CACHE_STRATEGIES.STATIC:
      event.respondWith(cacheFirst(request));
      break;
    case CACHE_STRATEGIES.API:
      event.respondWith(networkFirst(request));
      break;
    case CACHE_STRATEGIES.DYNAMIC:
    default:
      event.respondWith(staleWhileRevalidate(request));
      break;
  }
});

// Cache-first strategy for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached version immediately
    return cachedResponse;
  }
  
  try {
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response for future
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Network request failed:', error);
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html') || new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
    
    throw error;
  }
}

// Network-first strategy for API calls
async function networkFirst(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API requests
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'No network connection and no cached data available'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale-while-revalidate strategy for dynamic content
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  // Always try to fetch fresh data
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      // Update cache with fresh data
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch((error) => {
    console.error('Fetch failed:', error);
    return null;
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Wait for network if no cache
  return fetchPromise;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('TailorFlow', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received');
  
  event.notification.close();
  
  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Background sync implementation
async function doBackgroundSync() {
  try {
    // Get all pending actions from IndexedDB
    const pendingActions = await getPendingActions();
    
    // Process each pending action
    for (const action of pendingActions) {
      try {
        await processAction(action);
        await removePendingAction(action.id);
      } catch (error) {
        console.error('Failed to process action:', action, error);
      }
    }
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// IndexedDB helpers for offline actions
async function getPendingActions() {
  // This would integrate with IndexedDB to store pending actions
  // For now, return empty array
  return [];
}

async function removePendingAction(actionId) {
  // Remove action from IndexedDB
  console.log('Removing pending action:', actionId);
}

async function processAction(action) {
  // Process the action based on its type
  console.log('Processing action:', action);
  
  switch (action.type) {
    case 'CREATE_CUSTOMER':
    case 'UPDATE_ORDER':
    case 'CREATE_PAYMENT':
      // Send to server
      return fetch(action.url, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${action.token}`
        },
        body: JSON.stringify(action.data)
      });
    
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}
