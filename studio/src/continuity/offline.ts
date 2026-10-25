/// <reference types="vite/client" />
export const SHELL_CACHE='kairo-reading-shell-v1';
export async function prepareOfflineShell(){
  if(!import.meta.env.PROD)throw new Error('Offline reopening is available in the production build. Reading copies and exports still work here.');
  if(!('serviceWorker' in navigator)||!('caches' in window))throw new Error('This browser cannot save the app for offline reopening. Download your reading copies instead.');
  // Cache only the published app shell and its directly referenced build assets. Never API responses.
  const response=await fetch('/saved',{cache:'reload'});
  if(!response.ok||response.redirected||!response.headers.get('content-type')?.includes('text/html'))throw new Error('Connect to save the reading screen.');
  const html=await response.clone().text();
  const paths=[...html.matchAll(/(?:src|href)="(\/assets\/[A-Za-z0-9_.-]+\.(?:js|css))"/g)].map(m=>m[1]);
  // Router eagerly imports the small reading home, so Vite includes its static dependencies in these links.
  if(!paths.some(p=>p.endsWith('.js')))throw new Error('The reading screen could not be prepared.');
  const cache=await caches.open(SHELL_CACHE);
  const assets:{path:string;response:Response}[]=[];
  const pending=[...new Set(paths)],seen=new Set<string>();let bytes=0;
  while(pending.length){
    const path=pending.shift()!;if(seen.has(path))continue;seen.add(path);
    if(seen.size>50)throw new Error('The reading screen is too large to save. Download reading copies instead.');
    const r=await fetch(path,{cache:'reload'});if(!r.ok||r.redirected)throw new Error('A reading-screen file could not be saved. Reconnect and try again.');
    const body=await r.clone().text();bytes+=new TextEncoder().encode(body).length;
    if(bytes>10_000_000)throw new Error('The reading screen is too large to save. Download reading copies instead.');
    assets.push({path,response:r});
    // Follow static imports only. Dynamic studio/model loads remain online features.
    if(path.endsWith('.js'))for(const match of body.matchAll(/(?:\bfrom\s*|\bimport\s*)["']([^"']+\.js)["']/g)){
      const target=new URL(match[1],new URL(path,location.origin));
      if(target.origin!==location.origin||!/^\/assets\/[A-Za-z0-9_.-]+\.js$/.test(target.pathname)||target.search)throw new Error('An offline dependency is not supported. Download reading copies instead.');
      pending.push(target.pathname);
    }
  }
  for(const a of assets)await cache.put(a.path,a.response);
  await cache.put('/home',response.clone());
  await cache.put('/saved',response);
  await navigator.serviceWorker.register('/kairo-offline-sw.js',{scope:'/'});
  await navigator.serviceWorker.ready;
}
export async function removeOfflineShell(){if('caches' in window)await caches.delete(SHELL_CACHE);if('serviceWorker' in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs)if(new URL(r.active?.scriptURL||r.waiting?.scriptURL||r.installing?.scriptURL||location.href).pathname==='/kairo-offline-sw.js')await r.unregister();}}
