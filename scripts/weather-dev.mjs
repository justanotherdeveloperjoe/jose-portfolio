// Local stand-in for public/api/weather.php, since Vite can't run PHP: the same polite, cached relay to MET Norway.
const source = 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=25.6866&lon=-100.3161';
const agent = 'jose-portfolio/1.0 (+https://hechoporjs.com)';

export function weatherRelay() {
  let cached = null;
  async function refresh() {
    try {
      const reply = await fetch(source, { headers: { 'User-Agent': agent, Accept: 'application/json', ...(cached?.lastModified && { 'If-Modified-Since': cached.lastModified }) }, signal: AbortSignal.timeout(8000) });
      const expires = Math.max(Date.now() + 600000, Date.parse(reply.headers.get('expires')) || Date.now() + 1800000);
      if (reply.status === 304 && cached?.body) cached.expires = expires;
      else if (reply.ok) cached = { body: await reply.text(), expires, lastModified: reply.headers.get('last-modified') };
      else cached = { ...cached, expires: Date.now() + 300000 };
    } catch {
      cached = { ...cached, expires: Date.now() + 300000 };
    }
  }
  return {
    name: 'weather-relay',
    configureServer(server) {
      server.middlewares.use('/api/weather.php', async (request, response) => {
        if (!cached || Date.now() >= cached.expires) await refresh();
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (!cached?.body) { response.statusCode = 503; response.end('{"error":"Weather is unavailable right now."}'); return; }
        response.end(cached.body);
      });
    },
  };
}
