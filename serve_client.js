const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const net = require('node:net');
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

// The game server (started by the Docker CMD on port 8000) speaks SockJS on
// the /showdown path prefix. The browser reaches it through this same public
// port, so tunnel everything under /showdown to it - both plain HTTP (SockJS
// info/long-polling/xhr-streaming requests) and WebSocket upgrades.
const GAME_HOST = '127.0.0.1';
const GAME_PORT = Number(process.env.GAMEPORT) || 8000;

function proxyGameHttp(req, res) {
	const headers = { ...req.headers };
	delete headers.connection; // hop-by-hop; let Node manage keep-alive
	const proxied = http.request({
		host: GAME_HOST,
		port: GAME_PORT,
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

function proxyGameUpgrade(req, clientSocket, head) {
	const upstream = net.connect(GAME_PORT, GAME_HOST);
	upstream.on('connect', () => {
		// forward the raw request verbatim (method, URL, headers incl. Upgrade)
		const lines = [`${req.method} ${req.url} HTTP/1.1`];
		for (let i = 0; i < req.rawHeaders.length; i += 2) {
			lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
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

// config/testclient-key.js holds a live session token for whoever owns this machine.
// It must never be handed to anyone connecting over the LAN/internet - only requests
// that are actually local to this machine (loopback) get it. Everyone else falls back
// to the client's normal manual-login/guest flow instead of being logged into your account.
const LOOPBACK_ADDRESSES = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
function isLoopback(req) {
	return LOOPBACK_ADDRESSES.includes(req.socket.remoteAddress || '');
}

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

const server = http.createServer((req, res) => {
	console.log(`[REQ] ${req.method} ${req.url}`);
	if (req.url.startsWith('/actionproxy?')) {
		serveActionProxy(req, res).catch(err => {
			console.error(err);
			res.writeHead(500);
			res.end('Internal Server Error');
		});
		return;
	}

	// Game server tunnel: SockJS (and the raw websocket fallback) both live
	// under /showdown on the game server started by the Docker CMD.
	if (req.url.startsWith('/showdown/')) {
		console.log(`[GAMESRV] ${req.method} ${req.url}`);
		return void proxyGameHttp(req, res);
	}

	const isConfig = req.url.startsWith('/config/');
	const server = isConfig ? configServer : clientServer;
	if (isConfig) req.url = req.url.slice('/config'.length);

	// The build script rewrites /play.pokemonshowdown.com/... → /stupidshowdown.onrender.com/...
	// Strip our hostname prefix so the static server can resolve files from clientRoot
	if (req.url.startsWith('/stupidshowdown.onrender.com/')) {
		req.url = req.url.slice('/stupidshowdown.onrender.com'.length);
	}

	// Missing sprites/audio: transparently proxy from Pokémon Showdown's live
	// server (see UPSTREAM_PREFIXES above for the rationale).
	if (UPSTREAM_PREFIXES.some(prefix => req.url.startsWith(prefix))) {
		let haveLocal = false;
		try {
			haveLocal = fs.statSync(path.join(clientRoot, req.url)).isFile();
		} catch {}
		if (!haveLocal) {
			console.log(`[PROXY] ${req.url} -> ${UPSTREAM_ASSET_HOST}`);
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
}).listen(port);

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

console.log(`Client serving at http://localhost:${port}`);
