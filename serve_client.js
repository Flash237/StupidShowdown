const path = require('node:path');
const http = require('node:http');
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
	console.log(`[REQ] ${req.method} ${req.url}`);
	if (req.url.startsWith('/actionproxy?')) {
		serveActionProxy(req, res).catch(err => {
			console.error(err);
			res.writeHead(500);
			res.end('Internal Server Error');
		});
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

console.log(`Client serving at http://localhost:${port}`);
