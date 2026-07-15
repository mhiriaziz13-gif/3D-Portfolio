const base = new URL(process.argv[2] || "http://localhost:3000");
const timeoutMs = 10000;
const failures = [];
const warnings = [];
const pages = new Map();
const fetchPage = async (url) => { const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),timeoutMs); try{return await fetch(url,{signal:controller.signal,redirect:"follow"})}finally{clearTimeout(timer)} };
const text = (html, pattern) => html.match(pattern)?.[1]?.trim() || "";
const productionOrigin = "https://ahmedaziz-portfolio.vercel.app";
const sameOrigin = (href) => { try { const origin=new URL(href, base).origin; return origin===base.origin||origin===productionOrigin; } catch { return false; } };
const attribute = (html, selector, name) => { const tag=html.match(selector)?.[0]||""; return tag.match(new RegExp(`${name}=["']([^"']*)`,"i"))?.[1]||""; };
for (const [path, type] of [["/robots.txt","text/plain"],["/sitemap.xml","xml"],["/llms.txt","text/plain"]]) { try { const r=await fetchPage(new URL(path,base)); if(r.status!==200) failures.push(`${path} returned ${r.status}`); if(!r.headers.get("content-type")?.includes(type)) failures.push(`${path} has unexpected content type`); pages.set(path,{response:r,html:await r.text()}); } catch(e){failures.push(`${path} request failed: ${e.message}`)} }
const sitemap=pages.get("/sitemap.xml")?.html||"";
const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
if(!urls.length) failures.push("Sitemap has no URLs");
if(urls.some(u=>!sameOrigin(u))) failures.push("Sitemap contains a cross-origin URL");
if(urls.some(u=>/\/(admin|auth|api)(\/|$)/.test(u))) failures.push("Sitemap contains an operational URL");
const queue=[...new Set(urls)];
for(let i=0;i<queue.length;i+=4){await Promise.all(queue.slice(i,i+4).map(async canonicalUrl=>{const path=new URL(canonicalUrl).pathname;const localUrl=new URL(path,base);try{const r=await fetchPage(localUrl);const html=await r.text();if(r.status!==200)failures.push(`${path} returned ${r.status}`);pages.set(localUrl.toString(),{response:r,html});}catch(e){failures.push(`${path} failed: ${e.message}`)}}))}
const titles=new Map(), descriptions=new Map(), linked=new Set();
for(const [url,{html}] of pages){if(!String(url).startsWith("http"))continue;const title=text(html,/<title[^>]*>([^<]*)<\/title>/i);const description=attribute(html,/<meta[^>]+name=["']description["'][^>]*>/i,"content");const canonical=attribute(html,/<link[^>]+rel=["']canonical["'][^>]*>/i,"href");const h1=(html.match(/<h1\b/gi)||[]).length;if(!title)failures.push(`${url} is missing a title`);if(!description)failures.push(`${url} is missing a description`);if(!canonical||!canonical.startsWith(productionOrigin))failures.push(`${url} has no absolute production canonical`);if(h1!==1)failures.push(`${url} has ${h1} H1 elements`);if(!/property=["']og:title["']/.test(html))failures.push(`${url} is missing Open Graph metadata`);if(!/name=["']twitter:card["']/.test(html))failures.push(`${url} is missing Twitter metadata`);for(const [map,value,label] of [[titles,title,"title"],[descriptions,description,"description"]]){if(value&&map.has(value))failures.push(`${url} duplicates ${label} from ${map.get(value)}`);else if(value)map.set(value,url)}for(const m of html.matchAll(/href=["']([^"'#]+)["']/g)){if(sameOrigin(m[1]))linked.add(new URL(m[1],base).pathname)}for(const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)){try{JSON.parse(m[1])}catch{failures.push(`${url} contains invalid JSON-LD`)}}if(/hcaptcha\.com|api\.js\?render/.test(html)&&new URL(url).pathname==="/")failures.push("Homepage loads hCaptcha");if(/\/api\/auth\/logout/.test(html)&&!new URL(url).pathname.startsWith("/admin"))failures.push(`${url} exposes logout in public markup`)}
for(const url of urls){const path=new URL(url).pathname;if(path!=="/"&&!linked.has(path))warnings.push(`${path} may be orphaned from crawled pages`)}
for(const path of ["/admin/login","/admin/forgot-password"]){try{const r=await fetchPage(new URL(path,base));const html=await r.text();if(!/noindex/.test(html))failures.push(`${path} is not noindex`)}catch(e){failures.push(`${path} request failed: ${e.message}`)}}
console.log(`SEO audit: ${failures.length} failure(s), ${warnings.length} warning(s)`);warnings.forEach(v=>console.warn(`WARN ${v}`));failures.forEach(v=>console.error(`FAIL ${v}`));process.exitCode=failures.length?1:0;
