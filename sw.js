const CACHE_NAME = 'cofre-btc-v1.3-seed';
const CACHE_PREFIX = 'cofre-btc-';

const OFFLINE_FILES = [
  './index.html',
  './manifest.json',
  './icone.png'
];

// Instalação: busca sempre da rede, evita cópias antigas
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    for (const arquivo of OFFLINE_FILES) {
      try {
        const resposta = await fetch(new Request(arquivo, { cache: 'reload' }));
        if (resposta.ok) {
          await cache.put(arquivo, resposta);
        }
      } catch (e) {
        console.log('Arquivo indisponível:', arquivo);
      }
    }

    await self.skipWaiting();
  })());
});

// Ativação: limpa APENAS caches antigos deste app — não afeta outros
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const nomes = await caches.keys();

    await Promise.all(
      nomes
        .filter(nome => nome.startsWith(CACHE_PREFIX) && nome !== CACHE_NAME)
        .map(nome => caches.delete(nome))
    );

    await self.clients.claim();
  })());
});

// Estratégia: rede primeiro → se falhar, usa o cache
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Apenas arquivos locais — NÃO intercepta nada externo
  if (url.origin !== self.location.origin) return;

  // Navegação (página): tenta rede primeiro, se não tiver usa cache
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const resposta = await fetch(request, { cache: 'no-store' });

        if (resposta && resposta.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('./index.html', resposta.clone());
        }

        return resposta;
      } catch (e) {
        const salvo = await caches.match('./index.html');
        return salvo || Response.error();
      }
    })());
    return;
  }

  // Arquivos estáticos: rede primeiro, atualiza cache
  event.respondWith((async () => {
    try {
      const resposta = await fetch(request, { cache: 'no-cache' });

      if (resposta && resposta.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, resposta.clone());
      }

      return resposta;
    } catch (e) {
      const salvo = await caches.match(request);
      return salvo || Response.error();
    }
  })());
});
