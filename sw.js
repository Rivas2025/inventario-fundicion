const CACHE_NAME = 'cvg-inventario-v3'; // Sube este número (v2, v3) cada vez que modifiques el index.html

// Lista de archivos ESTRICTAMENTE necesarios. 
// OJO: Si jspdf y autotable están dentro de tu index.html, no los pongas aquí.
const assets = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Instalación: Precarga de la interfaz
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Guardando caché inicial...');
        return cache.addAll(assets);
      })
      .then(() => self.skipWaiting()) // Fuerza la activación inmediata
      .catch(err => console.error('[SW] Fallo crítico en cache.addAll:', err))
  );
});

// Activación: Limpieza de versiones viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antiguo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepción de red optimizada para Single Page Applications
self.addEventListener('fetch', event => {
  // Si la petición es de navegación (recargar la página o cambiar la URL principal)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').catch(() => {
        return fetch(event.request);
      })
    );
    return; // Detiene la ejecución aquí para este tipo de peticiones
  }

  // Para el resto de peticiones (imágenes, scripts) ignoramos parámetros extra en la URL
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then(cachedResponse => {
        return cachedResponse || fetch(event.request).catch(() => {
            console.warn('[SW] Recurso offline no encontrado:', event.request.url);
        });
      })
  );
});