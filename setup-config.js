#!/usr/bin/env node
'use strict';
/**
 * Generates the client's config/config.js and config/routes.json for a
 * deployment, without hardcoding a hostname - this replaces the two
 * `RUN printf ... >> config/config.js` steps the old Render Dockerfile used.
 *
 * Both files are written inside the StupidShowdownClient submodule (upstream
 * ignores config/config.js, and routes.json is per deployment).
 *
 * Usage, from this branch root:
 *
 *   SITE_HOST=stupidshowdown.netlify.app \
 *   GAME_HOST=stupidshowdown-xxxx.run.app \
 *   node setup-config.js
 *
 *   SITE_HOST  where this client is served from. The client build rewrites
 *              asset URLs to an absolute path rooted here (routes.json `root`),
 *              so it must match the hostname players actually load.
 *   GAME_HOST  the game server the browser connects to (Config.defaultserver).
 *   GAME_PORT  defaults to 443.
 */

const fs = require('fs');
const path = require('path');

const clientRoot = path.resolve(__dirname, 'StupidShowdownClient');
const configDir = path.join(clientRoot, 'config');

const siteHost = process.env.SITE_HOST;
const gameHost = process.env.GAME_HOST;
const gamePort = Number(process.env.GAME_PORT) || 443;

if (!siteHost || !gameHost) {
	console.error(
		'Usage: SITE_HOST=<client host> GAME_HOST=<game server host> node setup-config.js'
	);
	process.exit(1);
}

if (!fs.existsSync(configDir)) {
	console.error(
		`${configDir} does not exist - fetch the submodule first:\n` +
		'  git submodule update --init StupidShowdownClient'
	);
	process.exit(1);
}

// Start from the shipped example rather than writing a config from scratch:
// every property the client reads on startup (Config.customcolors and friends)
// has to be defined, or `new App()` throws before the client can connect.
const configPath = path.join(configDir, 'config.js');
fs.writeFileSync(configPath, fs.readFileSync(path.join(configDir, 'config-example.js'), 'utf8'));

fs.appendFileSync(configPath, `
// StupidShowdown: talk to our own game server, not the official one.
Config.defaultserver = {
  id: "stupidshowdown",
  host: "${gameHost}",
  port: ${gamePort},
  httpport: 80,
  altport: 80,
  registered: true
};
`);

// Custom item/species icon hooks - see the file's header comment.
fs.appendFileSync(configPath, fs.readFileSync(path.join(__dirname, 'client-patches', 'client-config-extra.js'), 'utf8'));

const routesPath = path.join(configDir, 'routes.json');
const routes = {
	root: siteHost,
	client: siteHost,
	dex: 'dex.pokemonshowdown.com',
	replays: 'replay.pokemonshowdown.com',
	users: 'pokemonshowdown.com/users',
	teams: 'teams.pokemonshowdown.com',
};
fs.writeFileSync(routesPath, JSON.stringify(routes, null, 2) + '\n');

console.log(`Wrote config/config.js   (game host: ${gameHost}:${gamePort})`);
console.log(`Wrote config/routes.json (site host: ${siteHost})`);
