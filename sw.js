const CACHE="horanet24-shell-v86";
const ASSETS=["./","./index.html","./tailwind.css","./styles.css?v=48","./music-widget.css?v=5","./app.js?v=51","./music-widget.js?v=3","./assistant-chat.js","./manifest.webmanifest","./assets/icon.svg","./founder.html","./founder.css?v=8"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const url=new URL(event.request.url);if(url.origin!==location.origin)return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;}).catch(()=>caches.match("./index.html"))));});
