// Opt-in published reading shell only. Personal data and API requests are never cached here.
const CACHE='kairo-reading-shell-v1';
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting());});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});
self.addEventListener('fetch',event=>{
  const r=event.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==self.location.origin||u.search||r.headers.has('authorization'))return;
  const home=r.mode==='navigate'&&['/home','/saved'].includes(u.pathname);
  const asset=/^\/assets\/[A-Za-z0-9_.-]+\.(js|css)$/.test(u.pathname);
  if(!home&&!asset)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(asset){const saved=await cache.match(r);if(saved)return saved;return fetch(r);}
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);
    try{const response=await fetch(r,{signal:controller.signal});if(!response.ok)throw new Error('Unavailable');return response;}
    catch{const saved=await cache.match(u.pathname)||await cache.match('/home');return saved||new Response('Connect to reopen KAIRO. Downloaded notes can still be opened.',{status:503,headers:{'Content-Type':'text/plain'}});}
    finally{clearTimeout(timer);}
  })());
});
