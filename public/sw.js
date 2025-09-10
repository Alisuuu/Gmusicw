const CACHE_NAME = 'suquinho-cache-v5'; // Incremented version to force update
const OFFLINE_PAGE = '/index.html';

const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/p2.png',
  OFFLINE_PAGE
];

// Instala e armazena os arquivos
self.addEventListener('install', event => {
  self.skipWaiting();  // Ativação mais rápida
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Limpa caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();  // Controle imediato das páginas
});

// Estratégia de cache
self.addEventListener('fetch', event => {
  // Ignora requisições não-GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then(response => {
      // Retorna do cache se disponível
      if (response) return response;
      
      // Busca na rede
      return fetch(event.request).then(networkResponse => {
        // Filtra respostas inválidas
        if (!networkResponse || 
            networkResponse.status !== 200 || 
            networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        // Armazena no cache
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        
        return networkResponse;
      }).catch(() => {
        // Fallback para navegação offline
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_PAGE);
        }
        // Fallback genérico
        return new Response('Offline - Conteúdo não disponível');
      });
    })
  );
});
