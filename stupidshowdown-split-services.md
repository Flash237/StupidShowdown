# StupidShowdown — split game server and client into two services

## Why

Right now one container runs two Node processes sharing Render's free 512MB:
the battle simulator (`pokemon-showdown start`) and the client/proxy
(`serve_client.js`). Once enough is loaded/active in memory, the container
gets OOM-killed and restarted — which looks like "works fine, then 404s,
consistently, after about a minute."

A static site was considered and rejected: `serve_client.js` isn't just
serving static files anymore. It also proxies the game server's HTTP/WebSocket
traffic under `/showdown/`, relays login requests to
`play.pokemonshowdown.com`, and runs the `/actionproxy` tunnel. A static site
can't run any of that server-side logic, so making the client a static site
would break login and battles entirely.

The fix instead: **two separate Render web services**, each with its own
independent 512MB, both built from the same repo/Dockerfile via
`dockerCommand` overrides — no Dockerfile changes needed.

Render **private services** (internal-only, free inter-service networking)
would be the cleaner way to do this, but they aren't available on the Free
plan — only Web services, static sites, Postgres, and Redis support the Free
instance type. So the game service still gets a public `.onrender.com` URL
(nobody needs to visit it directly), and the two services talk to each other
over that public URL via HTTPS/WSS rather than Render's private network.

## What changed

1. **`render.yaml`** — replace the single-service blueprint with two services.
   See the full file below.
2. **`serve_client.js`** — the proxy code (`proxyGameHttp`, `proxyGameUpgrade`,
   `waitForGameServer`) talked to the game server over plaintext
   `127.0.0.1:8000`, which only works when both processes share a container.
   Patched to support a second mode: when the `GAMEHOST` env var is set to
   something other than `127.0.0.1`/`localhost`, it switches to TLS on port
   443 (Render web services only expose 443 publicly — there's no raw TCP
   port to reach) and rewrites the outbound `Host` header to `GAMEHOST`,
   since Render's edge routes by that header. When `GAMEHOST` is unset, the
   old same-container plaintext behavior is unchanged — verified locally,
   both branches start cleanly.
3. **Hardening, found along the way, unrelated to the split:** the file has a
   comment claiming `config/testclient-key.js` (a live session token) is
   "never served," but nothing in the code actually enforced that — it just
   happened to be true because the file doesn't currently exist in the repo.
   If that file is ever created for local dev and accidentally lands in a
   commit or a deploy, it would previously have been served to anyone who
   asked. Added an explicit block so the guarantee is real, independent of
   whether the file exists.

**Not changed:** `StupidShowdownClient/config/config.js`'s
`Config.defaultserver` still points at `stupidshowdown-web`'s own public
hostname — the browser still only ever talks to the client service's origin;
only the *server-side* proxy target changed.

## Apply

1. Replace `render.yaml` with the file below (update the two `value:` /
   `name:` hostnames if you use different service names than
   `stupidshowdown-web` / `stupidshowdown-game`).
2. Replace `serve_client.js` with the file below in full.
3. Commit and push (or apply via GitHub web editor, same as last time — no
   local checkout needed).
4. In the Render dashboard, this repo currently maps to one service
   (`stupid-showdown`). Re-apply the Blueprint (New → Blueprint, point it at
   this repo) so Render picks up both services from `render.yaml`. Delete the
   old single service once both new ones are confirmed healthy, so you're not
   paying free-tier build-minute budget on a service nothing points to
   anymore.

## Known trade-offs (free tier)

- **Independent cold starts.** Each free service spins down after 15 min of
  inactivity, independently. If the game service has spun down and a visitor
  hits the client, `waitForGameServer` will show a longer "waiting for game
  server" delay (up to `GAME_READY_TIMEOUT`, default 180s) while it wakes up
  — this is inherent to two separate free services and wasn't a factor when
  they shared one container.
- **Doubled build minutes.** Both services build the full Dockerfile
  (including the client build), so each deploy consumes ~2x the free-tier
  build-pipeline minutes it used to. The game service doesn't actually need
  the built client at all; trimming that out of its build is a possible
  future optimization, not done here to keep this change minimal and low-risk.
- **`GAMEHOST` is a hardcoded literal**, not a Render `fromService` wire-up —
  intentional. Free web services can't receive Render private-network
  traffic, so a private-network `fromService` reference wouldn't help here
  anyway; keeping the target a plain string avoided an unverified assumption
  about what `fromService`'s `host` property resolves to for a *public*
  (non-private) web service. If you rename either service, update the other's
  `GAMEHOST`/`name` to match.

---

## `render.yaml`

```yaml
services:
  # Public-facing: serves the client, proxies /showdown/ HTTP+WS traffic to
  # the game server below, relays login/action-proxy requests. This is what
  # players actually connect to.
  - type: web
    name: stupidshowdown-web
    env: docker
    dockerfilePath: ./Dockerfile
    dockerCommand: node serve_client.js
    plan: free
    envVars:
      - key: PORT
        value: 10000
      # Must match the game service's `name:` below - Render's public
      # hostname is always <service-name>.onrender.com. Free-tier services
      # can't use Render's private network (only paid Starter+ can), so this
      # talks to the game service over its public HTTPS endpoint instead.
      - key: GAMEHOST
        value: stupidshowdown-game.onrender.com

  # Not directly visited by players. Runs only the battle simulator/server,
  # in its own container with its own independent 512MB memory budget -
  # this is the actual fix for the OOM/404s.
  - type: web
    name: stupidshowdown-game
    env: docker
    dockerfilePath: ./Dockerfile
    # pokemon-showdown takes its port as a CLI arg, not an env var, so this
    # needs a shell to expand $PORT - a bare dockerCommand string is NOT run
    # through a shell by Render.
    dockerCommand: sh -c "node pokemon-showdown start --skip-build $PORT"
    plan: free
    envVars:
      - key: PORT
        value: 10000
```
-e 
---

## `serve_client.js` (full file)

```javascript
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const net = require('node:net');
const tls = require('node:tls');
const fs = require('node:fs');
const { StaticServer } = require('./dist/lib/static-server');

const clientRoot = path.resolve(__dirname, 'StupidShowdownClient/play.pokemonshowdown.com');
const configRoot = path.resolve(__dirname, 'StupidShowdownClient/config');
// The build script outputs the processed index HTML to caches/index-old.html (not index.html)
const indexHtml = path.join(clientRoot, 'caches/index-old.html');

console.log(`[CLIENT-SERVER] clientRoot exists: ${fs.existsSync(clientRoot)}`);
console.log(`[CLIENT-SERVER] index (caches/index-old.html) exists: ${fs.existsSync(indexHtml)}`);

const clientServer = new StaticServer(clientRoot, { cacheTime: 0 });
const configServer = new StaticServer(configRoot, { cacheTime: 0 });
const port = process.env.PORT || 8080;

// The game server speaks SockJS on the /showdown path prefix. The browser
// reaches it through this same public port, so tunnel everything under
// /showdown to it - both plain HTTP (SockJS info/long-polling/xhr-streaming
// requests) and WebSocket upgrades.
//
// Two deployment shapes are supported:
//  - Same container (default): GAMEHOST unset, we talk plaintext to
//    127.0.0.1:8000 where the Docker CMD spawned the game server alongside
//    this process.
//  - Separate Render service (set GAMEHOST to that service's hostname, e.g.
//    stupidshowdown-game.onrender.com): Render web services only expose
//    443/HTTPS publicly - there's no raw TCP port to reach - so we speak
//    TLS to the game server's own public port 443 instead.
const GAME_HOST = process.env.GAMEHOST || '127.0.0.1';
const GAME_PORT = Number(process.env.GAMEPORT) || 8000;
const GAME_USE_TLS = GAME_HOST !== '127.0.0.1' && GAME_HOST !== 'localhost';
const gameTransportPort = GAME_USE_TLS ? 443 : GAME_PORT;

function proxyGameHttp(req, res) {
	const headers = { ...req.headers };
	delete headers.connection; // hop-by-hop; let Node manage keep-alive
	if (GAME_USE_TLS) headers.host = GAME_HOST;
	const proxied = (GAME_USE_TLS ? https : http).request({
		host: GAME_HOST,
		port: gameTransportPort,
		path: req.url,
		method: req.method,
		headers,
	}, proxyRes => {
		res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
		proxyRes.pipe(res); // stream: SockJS xhr-streaming responses never "end" early
	});
	proxied.on('error', err => {
		console.error(`[GAMESRV-ERROR] ${req.url}: ${err.message}`);
		if (!res.headersSent) res.writeHead(502);
		res.end('Game server unavailable');
	});
	req.pipe(proxied);
}

// The game server (spawned alongside this process by the Docker CMD) needs
// several seconds to load all battle data and bind its SockJS port, while this
// process can bind $PORT in well under a second. On hosts where "the port is
// open" is what marks a deploy live, listening immediately means the first
// visitor loads the client against a battle server that isn't accepting
// connections yet: SockJS connect fails, no |formats| message ever arrives,
// and the teambuilder shows an empty format list. Wait for the game port to
// accept connections before we start serving, so traffic is only routed here
// once the battle server can actually answer.
function waitForGameServer() {
	const timeout = Number(process.env.GAME_READY_TIMEOUT) || 180000;
	const startedAt = Date.now();
	return new Promise(resolve => {
		const attempt = () => {
			const socket = GAME_USE_TLS ?
				tls.connect({ host: GAME_HOST, port: gameTransportPort, servername: GAME_HOST }) :
				net.connect(GAME_PORT, GAME_HOST);
			let settled = false;
			const retry = () => {
				if (settled) return;
				settled = true;
				socket.destroy();
				if (Date.now() - startedAt >= timeout) {
					console.error(`[GAMESRV] still not accepting connections after ${timeout}ms; serving anyway`);
					resolve(false);
					return;
				}
				setTimeout(attempt, 500);
			};
			socket.once(GAME_USE_TLS ? 'secureConnect' : 'connect', () => {
				if (settled) return;
				settled = true;
				socket.destroy();
				resolve(true);
			});
			socket.once('timeout', retry);
			socket.once('error', retry);
			socket.setTimeout(2000);
		};
		attempt();
	});
}

function proxyGameUpgrade(req, clientSocket, head) {
	const upstream = GAME_USE_TLS ?
		tls.connect({ host: GAME_HOST, port: gameTransportPort, servername: GAME_HOST }) :
		net.connect(GAME_PORT, GAME_HOST);
	upstream.on(GAME_USE_TLS ? 'secureConnect' : 'connect', () => {
		// forward the raw request verbatim (method, URL, headers incl. Upgrade).
		// When GAME_USE_TLS, this is going to the game server's own Render
		// hostname over its public port 443, and Render's edge routes by the
		// Host header - so that header has to say GAME_HOST, not whatever
		// domain the browser originally connected to (this client service's).
		const lines = [`${req.method} ${req.url} HTTP/1.1`];
		for (let i = 0; i < req.rawHeaders.length; i += 2) {
			const name = req.rawHeaders[i];
			const value = (GAME_USE_TLS && name.toLowerCase() === 'host') ? GAME_HOST : req.rawHeaders[i + 1];
			lines.push(`${name}: ${value}`);
		}
		upstream.write(lines.join('\r\n') + '\r\n\r\n');
		if (head.length) upstream.write(head);
		clientSocket.pipe(upstream);
		upstream.pipe(clientSocket);
	});
	upstream.on('error', err => {
		console.error(`[GAMESRV-WS-ERROR] ${req.url}: ${err.message}`);
		clientSocket.destroy();
	});
	clientSocket.on('error', () => upstream.destroy());
}

// The client repo intentionally excludes the big binary assets (sprites/,
// audio/) for size reasons — see StupidShowdownClient/README.md. Anything we
// don't have locally under those paths gets transparently proxied from
// Pokémon Showdown's live server instead, so the browser sees a complete
// client on our own origin. Custom StupidShowdown mons will 404 upstream too
// and keep the client's built-in placeholder until custom art is added.
const UPSTREAM_ASSET_HOST = 'play.pokemonshowdown.com';
const UPSTREAM_PREFIXES = ['/sprites/', '/audio/'];
// The client repo also ships without sprites/ (see .gitignore), so
// ./build-tools/build-minidex can't measure animated sprite dimensions and
// deletes the files it would otherwise have generated. The old client loads
// data/pokedex-mini.js on every page, so without a fallback it 404s. These two
// are the only /data/ files built from sprite sizes - everything else in
// data/ is generated from our own server's dist/ and exists locally.
const UPSTREAM_FILES = ['/data/pokedex-mini.js', '/data/pokedex-mini-bw.js'];
// Login server relay: forward /~~<serverid>/action.php to the real login
// server verbatim (method, body, cookies). Cookies matter: the client stores
// its session (`sid`) on our origin, and the login server keys sessions off it.
const LOGIN_HOST = 'play.pokemonshowdown.com';
function serveLoginServer(req, res) {
	const headers = { ...req.headers };
	headers.host = LOGIN_HOST;
	delete headers.connection; // hop-by-hop
	const proxied = https.request({
		hostname: LOGIN_HOST,
		port: 443,
		path: req.url,
		method: req.method,
		headers,
	}, proxyRes => {
		res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
		proxyRes.pipe(res);
	});
	proxied.on('error', err => {
		console.error(`[LOGIN-ERROR] ${req.url}: ${err.message}`);
		if (!res.headersSent) res.writeHead(502);
		res.end('Login server unavailable');
	});
	req.pipe(proxied);
}

function serveUpstream(req, res) {
	const upstream = https.get({
		hostname: UPSTREAM_ASSET_HOST,
		path: req.url,
		headers: {
			// forward the browser's cache validators so upstream 304s still work
			'if-none-match': req.headers['if-none-match'] || '',
			'if-modified-since': req.headers['if-modified-since'] || '',
			'accept-encoding': req.headers['accept-encoding'] || 'identity',
			'accept': req.headers['accept'] || '*/*',
			'user-agent': 'StupidShowdown-asset-proxy/1.0',
		},
	}, upstreamRes => {
		const headers = { ...upstreamRes.headers };
		// don't forward upstream's CSP/frame headers if any
		delete headers['content-security-policy'];
		delete headers['x-frame-options'];
		res.writeHead(upstreamRes.statusCode || 502, headers);
		upstreamRes.pipe(res);
	});
	upstream.on('error', err => {
		console.error(`[PROXY-ERROR] ${req.url}: ${err.message}`);
		if (!res.headersSent) res.writeHead(502);
		res.end('Upstream asset fetch failed');
	});
	req.on('error', () => upstream.destroy());
}

// Custom art for this fork's roster.
//
// The client asks for sprites by three fixed names - sprites/home-centered/<id>.png
// for the teambuilder, sprites/gen5/<id>.png and sprites/gen5-back/<id>.png in
// battle - plus the *-shiny variant of each. The art we have is whatever the
// artist exported (png, webp, jpeg, avif), so rather than renaming files to .png
// and lying about their type, we index what's actually on disk under
// client-patches/sprites/ and answer any of those requests from the real file
// with the Content-Type matching its real extension. That's not cosmetic: these
// are CSS background-images, and a background-image whose bytes are WebP but
// whose Content-Type says image/png is silently dropped by the browser.
//
// The index is keyed by filename stem, so `custom/nilou.png` answers
// `home-centered/nilou.png` and `custom/nilou-shiny.png` answers
// `home-centered-shiny/nilou.png`. Built once at startup - the art is baked into
// the image. Note this reads client-patches/ directly (present in the image via
// the Dockerfile's `COPY . .`), so it behaves the same locally and in Docker.
const CUSTOM_ASSET_ROOT = path.resolve(__dirname, 'client-patches/sprites');
const CUSTOM_SPRITE_DIR = path.join(CUSTOM_ASSET_ROOT, 'custom');
const CUSTOM_ITEMICON_DIR = path.join(CUSTOM_ASSET_ROOT, 'itemicons');
const IMAGE_MIME_TYPES = {
	'.png': 'image/png',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.avif': 'image/avif',
	'.svg': 'image/svg+xml',
};

function indexAssets(dir) {
	const index = new Map();
	let entries;
	try {
		entries = fs.readdirSync(dir);
	} catch {
		return index; // directory is optional: it only holds art we may not have
	}
	for (const entry of entries) {
		if (entry.startsWith('.') || /\.md$/i.test(entry)) continue;
		const dot = entry.lastIndexOf('.');
		if (dot <= 0) continue;
		index.set(entry.slice(0, dot).toLowerCase(), entry);
	}
	return index;
}

const customSprites = indexAssets(CUSTOM_SPRITE_DIR);
const customItemIcons = indexAssets(CUSTOM_ITEMICON_DIR);
console.log(`[CLIENT-SERVER] custom sprites: ${customSprites.size}, custom item icons: ${customItemIcons.size}`);

// Returns false if the file isn't there after all (so the caller can fall back).
function serveCustomAsset(reqPath, res, dir, file) {
	const filename = path.join(dir, file);
	let size;
	try {
		size = fs.statSync(filename).size;
	} catch {
		return false;
	}
	console.log(`[CUSTOM] ${reqPath} -> ${path.relative(CUSTOM_ASSET_ROOT, filename)}`);
	res.writeHead(200, {
		'content-type': IMAGE_MIME_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
		// Upstream's own sprites go out without one; the client's cachebusters do
		// the invalidating, and a wrong length would truncate the image.
		'content-length': size,
		'cache-control': 'max-age=0',
	});
	fs.createReadStream(filename).on('error', () => res.end()).pipe(res);
	return true;
}

// Returns true when the request was one of ours and has been handled.
function tryServeCustomSprite(pathname, res) {
	const match = /^\/sprites\/([^/]+)\/([^/]+)\.(?:png|gif|webp|jpe?g|avif|svg)$/.exec(pathname);
	if (!match) return false;
	const [, spriteDir, spriteName] = match;
	const name = spriteName.toLowerCase();
	if (spriteDir === 'itemicons') {
		const file = customItemIcons.get(name);
		return !!file && serveCustomAsset(pathname, res, CUSTOM_ITEMICON_DIR, file);
	}
	// `home-centered-shiny` / `gen5-shiny` name the same id as the plain
	// directory does; take the artist's shiny export when there is one.
	const file = (spriteDir.endsWith('-shiny') && customSprites.get(`${name}-shiny`)) ||
		customSprites.get(name);
	return !!file && serveCustomAsset(pathname, res, CUSTOM_SPRITE_DIR, file);
}

// Note: config/testclient-key.js holds a live session token for whoever owns this
// machine, so it must never be handed to anyone connecting over the LAN/internet -
// only to requests that are actually local to this machine (loopback). We don't
// serve it at all, which is the safe default: every visitor falls back to the
// client's normal manual-login/guest flow instead of being logged into your account.

// Login-server proxy: the real play.pokemonshowdown.com/~~server/action.php calls
// (username availability checks, login, etc.) are cross-origin from this dev client,
// which browsers block outright unless the login server opts in with CORS headers of
// its own (it doesn't, since it doesn't know about us). Rather than falling back to
// the stock client's manual copy/paste dialog for every guest who wants to pick a
// name, we tunnel those specific requests through our own origin: the browser talks
// to us (same-origin, no CORS issue), and we relay server-to-server (no CORS applies
// between two servers) to the real login server and hand back its response verbatim.
// This carries no secret of ours - it's a transparent passthrough of each visitor's
// own request - so unlike testclient-key.js, it's fine to expose to everyone.
// Locked down to exactly the login server's action.php path so this can't be abused
// as an open relay to arbitrary URLs.
const ACTION_HOST = 'play.pokemonshowdown.com';
function isAllowedActionUrl(url) {
	return url.protocol === 'https:' && url.hostname === ACTION_HOST &&
		/^\/~~[^/]+\/action\.php$/.test(url.pathname);
}

function readBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		req.on('data', chunk => chunks.push(chunk));
		req.on('end', () => resolve(Buffer.concat(chunks)));
		req.on('error', reject);
	});
}

async function serveActionProxy(req, res) {
	const requestUrl = new URL(req.url, 'http://internal');
	const target = requestUrl.searchParams.get('url');
	let targetUrl;
	try {
		targetUrl = new URL(target);
	} catch {
		res.writeHead(400);
		res.end('Bad target URL');
		return;
	}
	if (!isAllowedActionUrl(targetUrl)) {
		res.writeHead(403);
		res.end('Proxy target not allowed');
		return;
	}

	const init = { method: req.method, headers: {} };
	const contentType = req.headers['content-type'];
	if (contentType) init.headers['content-type'] = contentType;
	if (req.method === 'POST') init.body = await readBody(req);

	let upstream;
	try {
		upstream = await fetch(targetUrl, init);
	} catch (err) {
		console.error(err);
		res.writeHead(502);
		res.end('Upstream request failed');
		return;
	}
	const body = Buffer.from(await upstream.arrayBuffer());
	res.writeHead(upstream.status, {
		'content-type': upstream.headers.get('content-type') || 'text/plain',
	});
	res.end(body);
}

// The old client pulls js/oldclient/clean-cookies.php in with a <script> tag.
// Upstream serves that path through PHP; here it's an ordinary static file, so
// the browser used to receive raw `<?php` source and die with
// "Uncaught SyntaxError: Unexpected token '<'". Serve the same
// oversized-cookie cleanup as JavaScript instead.
// Ported from play.pokemonshowdown.com/src/oldclient/clean-cookies.php.
const CLEAN_COOKIES_JS = `(function () {
	var cleaned = false;
	var parts = document.cookie ? document.cookie.split(';') : [];
	for (var i = 0; i < parts.length; i++) {
		var part = parts[i].trim();
		var eq = part.indexOf('=');
		if (eq < 0) continue;
		if (part.slice(eq + 1).length <= 3000) continue;
		// A cookie this big means broken settings; it has to go. (The PHP
		// original also expired copies on pokemonshowdown.com domains, which
		// a script on our origin can't and shouldn't touch.)
		document.cookie = part.slice(0, eq) + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
		cleaned = true;
	}
	if (cleaned) {
		alert('You had a cookie which was too big to handle and had to be deleted. If you had cookie settings, they may have been deleted.');
	}
})();
`;

// The upstream client repo ships only `config/*-example.*` files; on
// play.pokemonshowdown.com, config/colors.json and config/coil.json are symlinks
// to files their deploy generates. In our image those targets don't exist, so
// the symlinks dangle and the client's startup fetches 404. Answer with our own
// defaults instead: `{}` means "no custom username colors" and "no Coil
// settings", which is exactly right for a server that has neither.
// (Anything actually dropped into StupidShowdownClient/config/ still wins.)
const CONFIG_DEFAULT_FILES = {
	'/config/colors.json': '{}',
	'/config/coil.json': '{}',
};

// The main menu fetches `https://<Config.routes.root>/news.json` - that's our
// own domain - and renders data[0] and data[1] without checking whether they
// exist, so the file has to exist AND hold at least two entries: a 404, an empty
// array, or null all make the news box throw instead of staying empty.
// Replace these posts with your own announcements.
const NEWS_JSON = JSON.stringify([
	{
		id: 1,
		title: 'Welcome to StupidShowdown',
		summaryHTML: 'This server runs custom formats and custom Pok&eacute;mon. ' +
			'Pick a format in the teambuilder to see them.',
		author: 'StupidShowdown',
		date: 1790640000,
	},
	{
		id: 2,
		title: 'Custom art is on the way',
		summaryHTML: 'Until sprite art is added for the custom roster, they fall back ' +
			'to the regular client placeholder graphics.',
		author: 'StupidShowdown',
		date: 1790640000,
	},
]);

const server = http.createServer((req, res) => {
	console.log(`[REQ] ${req.method} ${req.url}`);
	const reqPath = req.url.split('?')[0]; // request path without the cachebuster query
	if (CONFIG_DEFAULT_FILES[reqPath] && !fs.existsSync(path.join(configRoot, path.basename(reqPath)))) {
		console.log(`[RES] 200 ${reqPath} (built-in default)`);
		res.writeHead(200, {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'max-age=0',
		});
		res.end(CONFIG_DEFAULT_FILES[reqPath]);
		return;
	}
	if (reqPath === '/news.json') {
		res.writeHead(200, {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'max-age=0',
		});
		res.end(NEWS_JSON);
		return;
	}
	if (req.url.startsWith('/actionproxy?')) {
		serveActionProxy(req, res).catch(err => {
			console.error(err);
			res.writeHead(500);
			res.end('Internal Server Error');
		});
		return;
	}

	// Login server relay: the client's own copy of the request is made
	// same-origin (for cookie access) to /~~<serverid>/action.php, which is the
	// login server's endpoint - a third Pokemon Showdown component this repo
	// doesn't ship. Relay it to upstream's login server, which already knows
	// our registered server id. This is a transparent passthrough of each
	// visitor's own request - no secrets of ours are involved.
	if (/^\/~~[^/]+\/action\.php/.test(req.url)) {
		console.log(`[LOGIN] ${req.method} ${req.url}`);
		return void serveLoginServer(req, res);
	}

	// Game server tunnel: SockJS (and the raw websocket fallback) both live
	// under /showdown on the game server started by the Docker CMD.
	if (req.url.startsWith('/showdown/')) {
		console.log(`[GAMESRV] ${req.method} ${req.url}`);
		return void proxyGameHttp(req, res);
	}

	// Handled before the static server so the raw PHP source is never served.
	if (reqPath === '/js/oldclient/clean-cookies.php') {
		console.log('[RES] 200 /js/oldclient/clean-cookies.php (built-in JS)');
		res.writeHead(200, {
			'content-type': 'application/javascript; charset=utf-8',
			'cache-control': 'max-age=0',
		});
		res.end(CLEAN_COOKIES_JS);
		return;
	}

	const isConfig = req.url.startsWith('/config/');
	const server = isConfig ? configServer : clientServer;
	if (isConfig) req.url = req.url.slice('/config'.length);

	// The build script rewrites /play.pokemonshowdown.com/... → /stupidshowdown.onrender.com/...
	// Strip our hostname prefix so the static server can resolve files from clientRoot
	if (req.url.startsWith('/stupidshowdown.onrender.com/')) {
		req.url = req.url.slice('/stupidshowdown.onrender.com'.length);
	}

	// Custom roster art, checked before the upstream proxy below so one of our
	// species is never answered by play.pokemonshowdown.com's 404. The build
	// rewrites asset URLs to our own hostname, and some arrive as an absolute path
	// rooted at it (the static server strips that further down, after this runs).
	if (tryServeCustomSprite(reqPath.replace(/^\/stupidshowdown\.onrender\.com/, ''), res)) return;

	// Missing sprites/audio: transparently proxy from Pokémon Showdown's live
	// server (see UPSTREAM_PREFIXES above for the rationale).
	const shouldProxyUpstream = UPSTREAM_PREFIXES.some(prefix => reqPath.startsWith(prefix)) ||
		UPSTREAM_FILES.includes(reqPath);
	if (shouldProxyUpstream) {
		let haveLocal = false;
		try {
			haveLocal = fs.statSync(path.join(clientRoot, reqPath)).isFile();
		} catch {}
		if (!haveLocal) {
			console.log(`[PROXY] ${reqPath} -> ${UPSTREAM_ASSET_HOST}`);
			return void serveUpstream(req, res);
		}
	}

	if (req.url === '/' || req.url === '' || req.url === '/index.html') {
		// Build script outputs the processed HTML to caches/index-old.html
		clientServer.serveFile('/caches/index-old.html', 200, {}, req, res).then(result => {
			console.log(`[RES] ${result?.status} / (caches/index-old.html)`);
		}).catch(err => {
			console.error(err);
			res.writeHead(500);
			res.end('Internal Server Error');
		});
		return;
	}

	server.serve(req, res).then(result => {
		console.log(`[RES] ${result?.status} ${req.url}`);
	}).catch(err => {
		console.error(err);
		res.writeHead(500);
		res.end('Internal Server Error');
	});
});

// WebSocket transport pass-through (must be on the same server/port; the
// game server's own SockJS endpoint answers the handshake).
server.on('upgrade', (req, socket, head) => {
	if (!req.url || !req.url.startsWith('/showdown/')) {
		socket.destroy();
		return;
	}
	console.log(`[GAMESRV-WS] ${req.url}`);
	proxyGameUpgrade(req, socket, head);
});

server.on('error', err => {
	console.error(`[CLIENT-SERVER] listen failed: ${err.message}`);
	process.exitCode = 1;
});

console.log(`[CLIENT-SERVER] waiting for game server on ${GAME_HOST}:${gameTransportPort}` +
	`${GAME_USE_TLS ? ' (tls)' : ''}...`);
waitForGameServer().then(gameReady => {
	server.listen(port, () => {
		console.log(`Client serving at http://localhost:${port}` +
			(gameReady ? '' : ' (game server never came up)'));
	});
});
```
