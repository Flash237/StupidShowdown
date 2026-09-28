const http = require('node:http');
const { StaticServer } = require('./dist/lib/static-server');

// cacheTime: 0 - this is a local dev server; always serve fresh files instead of
// letting the browser cache data/*.js (pokedex, search-index, etc.) for an hour.
const clientServer = new StaticServer('./StupidShowdownClient/play.pokemonshowdown.com', { cacheTime: 0 });
// The real play.pokemonshowdown.com serves `config/` as a sibling directory via its
// Apache virtual host mapping - pages request it as `../config/...` (e.g. testclient
// pages loading config/testclient-key.js). Mirror that here, or those requests 404
// and things like the testclient auto-login key silently never load.
const configServer = new StaticServer('./StupidShowdownClient/config', { cacheTime: 0 });
const port = process.env.PORT || 8080;

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

http.createServer((req, res) => {
	if (req.url.startsWith('/actionproxy?')) {
		serveActionProxy(req, res).catch(err => {
			console.error(err);
			res.writeHead(500);
			res.end('Internal Server Error');
		});
		return;
	}
	const isConfig = req.url.startsWith('/config/');
	if (isConfig && !isLoopback(req)) {
		res.writeHead(404);
		res.end('Not found');
		return;
	}
	const server = isConfig ? configServer : clientServer;
	if (isConfig) req.url = req.url.slice('/config'.length);
	server.serve(req, res).catch(err => {
		console.error(err);
		res.writeHead(500);
		res.end('Internal Server Error');
	});
}).listen(port);

console.log(`Client serving at http://localhost:${port}`);
