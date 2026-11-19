import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

class FakeRequest {
  constructor(input, init = {}) {
    const source = input instanceof FakeRequest ? input : null;
    this.url = String(source ? source.url : input);
    this.method = (init.method || source?.method || 'GET').toUpperCase();
    this.headers = new Headers(init.headers || source?.headers || {});
    this.body = init.body ?? source?.body ?? null;
  }
}
globalThis.Request = FakeRequest;
const source = await fs.readFile(new URL('../../workers/bikerlink-website-production/src/worker.js', import.meta.url), 'utf8');
const mod = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const worker = mod.default;
const contentManifest = JSON.parse(await fs.readFile(new URL('../../docs/cloudflare-migration/LEGACY_CONTENT_MANIFEST.json', import.meta.url), 'utf8'));
let pass = 0;
const check = (condition, label) => { assert.ok(condition, label); pass++; };
let r2Options;
const makeEnv = () => ({
  RAILWAY_ORIGIN: 'https://bikerlink-production.up.railway.app',
  PUBLIC_SITE_ORIGIN: 'https://biker-link.net',
  ASSETS: { fetch: async request => new Response('STATIC:' + new URL(request.url).pathname, {status:200,headers:{'content-type':new URL(request.url).pathname.endsWith('.js')?'application/javascript':'text/html','x-fixture':'assets'}}) },
  SITE_ASSETS: { get: async (key, options) => {
    r2Options=options;
    if (key !== 'assets/images/hero-community.webp') return null;
    return {httpEtag:'"etag-r2"',size:3,body:new Uint8Array([1,2,3]),writeHttpMetadata(headers){headers.set('content-type','image/webp');headers.set('content-length','3');}};
  }}
});
const realFetch=globalThis.fetch;
let upstream;
globalThis.fetch=async request=>{
  upstream=request;
  const path=new URL(request.url).pathname;
  if (path==='/privacy-policy') return new Response(null,{status:301,headers:{location:'/privacy'}});
  if (path==='/delete-account') return new Response('<title>Delete account</title><a href="https://bikerlink-production.up.railway.app/delete-account">Open</a>',{status:200,headers:{'content-type':'text/html; charset=utf-8','content-length':'101','etag':'W/"origin-html"'}});
  if (path.startsWith('/assets/images/')&&request.headers.has('if-none-match')) return new Response(null,{status:304,headers:{etag:'"origin-etag"'}});
  if (path.startsWith('/assets/images/')&&request.headers.has('range')&&!request.headers.has('if-range')) return new Response('12',{status:206,headers:{'content-type':'image/webp','content-range':'bytes 0-1/9','content-length':'2'}});
  if (path.startsWith('/assets/images/')&&request.headers.has('if-range')) return new Response('fullimage',{status:200,headers:{'content-type':'image/webp','content-length':'9'}});
  return new Response('{"ok":true}',{status:200,headers:{'content-type':'application/json','set-cookie':'connect.sid=fixture; Path=/; HttpOnly; Secure; SameSite=Lax'}});
};
let res=await worker.fetch(new FakeRequest('https://biker-link.net/api/health?probe=1',{headers:{authorization:'Bearer fixture','x-trace-id':'trace-1',host:'spoof.example'}}),makeEnv());
check(res.status===200&&(await res.json()).ok,'API health response passed through');
check(upstream.url==='https://bikerlink-production.up.railway.app/api/health?probe=1','API path and query preserved');
check(upstream.headers.get('authorization')==='Bearer fixture'&&upstream.headers.get('x-trace-id')==='trace-1','authorization and caller headers preserved');
check(upstream.headers.get('x-forwarded-host')==='biker-link.net'&&upstream.headers.get('x-forwarded-proto')==='https','public forwarded host and scheme preserved');
check(upstream.headers.get('host')===null,'caller-supplied Host is removed and origin Host comes from Railway URL');
check(res.headers.get('set-cookie')?.includes('connect.sid=fixture'),'Set-Cookie passed through');
res=await worker.fetch(new FakeRequest('https://biker-link.net/api/chat/stream?room=demo'),makeEnv());
check(upstream.url.endsWith('/api/chat/stream?room=demo'),'SSE route remains on Railway');
res=await worker.fetch(new FakeRequest('https://biker-link.net/ws/admin/notifications'),makeEnv());
check(upstream.url==='https://bikerlink-production.up.railway.app/ws/admin/notifications','WebSocket route selects Railway');
res=await worker.fetch(new FakeRequest('https://biker-link.net/assets/images/hero-community.webp'),makeEnv());
check(res.status===200&&res.headers.get('content-type')==='image/webp'&&res.headers.get('cache-control')?.includes('immutable'),'R2 image cache matches origin policy');
check(res.headers.get('etag')==='"etag-r2"'&&res.headers.get('accept-ranges')==='bytes','R2 validator and range headers set');
check(res.headers.get('x-content-type-options')==='nosniff'&&res.headers.get('referrer-policy')==='strict-origin-when-cross-origin','R2 image retains origin security headers');
check(r2Options===undefined,'plain image request uses simple R2 object read');
res=await worker.fetch(new FakeRequest('https://biker-link.net/assets/images/hero-community.webp',{headers:{range:'bytes=1-2'}}),makeEnv());
check(upstream.url.endsWith('/assets/images/hero-community.webp'),'Range request uses Railway origin');
check(upstream.method==='GET'&&upstream.headers.get('range')==='bytes=1-2','Range method and header reach Railway unchanged');
check(res.status===206&&res.headers.get('accept-ranges')==='bytes'&&res.headers.get('content-range')==='bytes 0-1/9','Range response keeps byte-range signaling');
res=await worker.fetch(new FakeRequest('https://biker-link.net/assets/images/hero-community.webp',{headers:{'if-none-match':'"etag-r2"'}}),makeEnv());
check(upstream.url.endsWith('/assets/images/hero-community.webp'),'conditional image request uses Railway origin');
check(upstream.headers.get('if-none-match')==='"etag-r2"','conditional validator reaches Railway unchanged');
check(res.status===304&&res.headers.get('accept-ranges')==='bytes','304 response keeps byte-range signaling');
res=await worker.fetch(new FakeRequest('https://biker-link.net/assets/images/hero-community.webp',{method:'HEAD'}),makeEnv());
check(upstream.method==='HEAD'&&upstream.url.endsWith('/assets/images/hero-community.webp'),'HEAD image metadata uses Railway origin');
res=await worker.fetch(new FakeRequest('https://biker-link.net/assets/images/hero-community.webp',{headers:{'if-range':'"etag-r2"',range:'bytes=0-1'}}),makeEnv());
check(upstream.url.endsWith('/assets/images/hero-community.webp'),'If-Range request uses Railway origin');
res=await worker.fetch(new FakeRequest('https://biker-link.net/assets/images/not-in-r2.webp'),makeEnv());
check(upstream.url.endsWith('/assets/images/not-in-r2.webp'),'missing R2 image falls back to Railway');
res=await worker.fetch(new FakeRequest('https://biker-link.net/'),makeEnv());
check(res.status===200&&(await res.text()).startsWith('STATIC:/index.html'),'homepage maps to Workers Static Assets');
check(res.headers.get('x-content-type-options')==='nosniff'&&res.headers.get('referrer-policy')==='strict-origin-when-cross-origin','static assets retain origin security headers');
res=await worker.fetch(new FakeRequest('https://biker-link.net/web-session.js'),makeEnv());
check(res.status===200&&res.headers.get('content-type')==='application/javascript'&&(await res.text()).startsWith('STATIC:/web-session.js'),'session bootstrap script is served as a static JavaScript asset');
res=await worker.fetch(new FakeRequest('https://biker-link.net/blog',{headers:{accept:'text/html'}}),makeEnv());
const blogStaticBody=await res.text();
check(res.status===200&&blogStaticBody==='STATIC:/blog/index.html','legacy blog index is served from Workers Static Assets');
check(!upstream.url.endsWith('/blog'),'legacy blog no longer falls through to the Railway frontend');
res=await worker.fetch(new FakeRequest('https://bikerlink-website-content-preview.example.workers.dev/'),makeEnv());
check(res.status===200&&res.headers.get('x-robots-tag')==='noindex','workers.dev preview pages are excluded from indexing');
res=await worker.fetch(new FakeRequest('https://biker-link.net/'),makeEnv());
check(res.status===200&&!res.headers.has('x-robots-tag'),'official custom domain remains indexable');
res=await worker.fetch(new FakeRequest('https://biker-link.net/matching/come-funziona'),makeEnv());
check(res.status===200&&(await res.text())==='STATIC:/matching/come-funziona/index.html','legacy matching detail page is served from Workers Static Assets');
res=await worker.fetch(new FakeRequest('https://biker-link.net/features'),makeEnv());
check(res.status===200&&(await res.text())==='STATIC:/features/index.html','legacy feature hub is served from Workers Static Assets');
res=await worker.fetch(new FakeRequest('https://biker-link.net/terms'),makeEnv());
check(res.status===200&&(await res.text())==='STATIC:/terms/index.html','terms page is served from Workers Static Assets');
res=await worker.fetch(new FakeRequest('https://biker-link.net/delete-account',{headers:{accept:'text/html'}}),makeEnv());
check(upstream.url==='https://bikerlink-production.up.railway.app/delete-account','account deletion remains on Railway');
const accountHtml=await res.text();
check(res.status===200&&accountHtml.includes('Delete account')&&accountHtml.includes('https://biker-link.net/delete-account')&&!accountHtml.includes('bikerlink-production.up.railway.app'),'application-owned HTML is readable and its public host is rewritten');
check(upstream.headers.get('accept-encoding')==='identity'&&!res.headers.has('etag')&&res.headers.get('content-length')===String(new TextEncoder().encode(accountHtml).byteLength),'rewritten account HTML has correct encoding and entity headers');
res=await worker.fetch(new FakeRequest('https://bikerlink-website-content-preview.example.workers.dev/delete-account',{headers:{accept:'text/html'}}),makeEnv());
check(res.headers.get('x-robots-tag')==='noindex','Railway HTML previews are excluded from indexing');
res=await worker.fetch(new FakeRequest('https://biker-link.net/blog/new-article'),makeEnv());
check(upstream.url==='https://bikerlink-production.up.railway.app/blog/new-article','unlisted blog routes retain the existing Railway handling');
res=await worker.fetch(new FakeRequest('https://biker-link.net/docs'),makeEnv());
check(upstream.url==='https://bikerlink-production.up.railway.app/docs','protected documentation remains on Railway');
for (const page of contentManifest.pages) {
  const assetPath=page.path==='/'?'/index.html':`${page.path}/index.html`;
  res=await worker.fetch(new FakeRequest(`https://biker-link.net${page.path}`),makeEnv());
  check(res.status===200&&(await res.text())===`STATIC:${assetPath}`,`legacy page ${page.path} maps to its preserved static copy`);
}
for (const path of ['/raduni','/horus','/ecosistema','/en','/en/matching','/en/raduni','/en/community','/en/horus','/en/sos','/en/privacy','/en/ecosistema','/en/download']) {
  const assetPath=path==='/en'?'/en/index.html':`${path}/index.html`;
  res=await worker.fetch(new FakeRequest(`https://biker-link.net${path}`),makeEnv());
  check(res.status===200&&(await res.text())===`STATIC:${assetPath}`,`existing candidate page ${path} remains served`);
}
res=await worker.fetch(new FakeRequest('https://biker-link.net/api'),makeEnv());
check(upstream.url==='https://bikerlink-production.up.railway.app/api','/api namespace has precedence');
res=await worker.fetch(new FakeRequest('https://biker-link.net/does-not-exist'),makeEnv());
check(res.status===404&&!(res.headers.get('content-type')||'').includes('text/html'),'unknown route is non-HTML 404');
res=await worker.fetch(new FakeRequest('https://biker-link.net/?expo-platform=ios',{headers:{'expo-platform':'ios'}}),makeEnv());
check(upstream.url==='https://bikerlink-production.up.railway.app/?expo-platform=ios','Expo root handshake stays on Railway');
res=await worker.fetch(new FakeRequest('https://biker-link.net/privacy-policy'),makeEnv());
check(res.status===301&&res.headers.get('location')==='/privacy','legacy privacy URL preserves Railway redirect');
res=await worker.fetch(new FakeRequest('https://biker-link.net/',{method:'POST',body:'x'}),makeEnv());
check(res.status===404,'unmapped non-API write method is rejected at the Worker');
res=await worker.fetch(new FakeRequest('https://biker-link.net/healthz',{method:'POST',body:'x'}),makeEnv());
check(res.status===404,'unsupported readiness method is not broadly proxied');
res=await worker.fetch(new FakeRequest('https://biker-link.net/api/health',{method:'POST',body:'x'}),makeEnv());
check(upstream.url==='https://bikerlink-production.up.railway.app/api/health','API write methods still reach Railway');
res=await worker.fetch(new FakeRequest('https://biker-link.net/api/health'),{ASSETS:{fetch:()=>{throw Error('must not serve static')}},SITE_ASSETS:{get:()=>null}});
check(res.status===503,'missing Railway origin fails closed');
globalThis.fetch=realFetch;
console.log(JSON.stringify({checks:pass,status:'PASS',scope:'local route harness; no live Cloudflare or authenticated session tested'}));
