const NOME_CACHE = 'cofre-btc-v1';
const ARQUIVOS_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

// Instalação — salva arquivos no cache
self.addEventListener('install', evento => {
    evento.waitUntil(
        caches.open(NOME_CACHE).then(cache => {
            return cache.addAll(ARQUIVOS_CACHE);
        })
    );
    self.skipWaiting();
});

// Ativação — limpa caches antigos
self.addEventListener('activate', evento => {
    evento.waitUntil(
        caches.keys().then(nomes => {
            return Promise.all(
                nomes.filter(nome => nome !== NOME_CACHE)
                    .map(nome => caches.delete(nome))
            );
        })
    );
    self.clients.claim();
});

// Busca — serve do cache quando offline
self.addEventListener('fetch', evento => {
    evento.respondWith(
        caches.match(evento.request).then(respostaCache => {
            return respostaCache || fetch(evento.request)
                .then(respostaRede => {
                    return caches.open(NOME_CACHE).then(cache => {
                        cache.put(evento.request, respostaRede.clone());
                        return respostaRede;
                    });
                });
        })
    );
});
