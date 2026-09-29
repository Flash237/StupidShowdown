# Multi-stage Dockerfile for Render deployment
FROM node:22-slim AS builder

WORKDIR /app

# build-indexes/build-learnsets/etc. used to git clone+pull upstream
# smogon/pokemon-showdown; we've patched them to read from our own
# server's dist/ instead (see client-patches/build-tools), so git is
# no longer strictly required for that — but npm/postinstall scripts
# elsewhere may still shell out to it, so keep it installed.
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy root package files and install server dependencies
COPY package*.json ./
RUN npm ci

# Copy client package files and install client dependencies
# (StupidShowdownClient is already synced by Render via git submodules)
COPY StupidShowdownClient/package*.json ./StupidShowdownClient/
RUN cd StupidShowdownClient && npm ci

# Copy full source (includes synced submodule files via build context)
COPY . .

# Overlay our patched client build tools (they read from our own server
# dist/ instead of git-cloning upstream smogon/pokemon-showdown, which
# is what makes our custom Pokemon/moves/formats show up in the client).
# Copying after `COPY . .` so this wins over Render's synced submodule copy.
COPY client-patches/build-tools/ ./StupidShowdownClient/build-tools/

# Write production client config — start from the shipped example so every
# property the client expects (Config.customcolors, Config.whitelist,
# Config.bannedHosts, ...) is defined, then append only our own server. Writing
# a config from scratch used to drop Config.customcolors, which
# BattleLog.usernameColor() reads on startup — the resulting TypeError aborted
# `new App()` before the client could connect at all.
# `node build` appends its generated Config.routes block to whatever is here.
# client-config-extra.js is then appended too: it's the client-side hook that
# points the two custom items at their own icon files instead of cell 0 of the
# shared itemicons sheet (see that file, and client-patches/sprites/README.md).
RUN cp StupidShowdownClient/config/config-example.js StupidShowdownClient/config/config.js && \
    printf '%s\n' \
    '' \
    '// StupidShowdown: talk to our own game server, not the official one.' \
    'Config.defaultserver = {' \
    '  id: "stupidshowdown",' \
    '  host: "stupidshowdown.onrender.com",' \
    '  port: 443,' \
    '  httpport: 80,' \
    '  altport: 80,' \
    '  registered: true' \
    '};' \
    >> StupidShowdownClient/config/config.js && \
    cat client-patches/client-config-extra.js >> StupidShowdownClient/config/config.js

# Override routes so asset URLs are rewritten to our domain (not play.pokemonshowdown.com)
RUN printf '%s\n' \
    '{' \
    '  "root": "stupidshowdown.onrender.com",' \
    '  "client": "stupidshowdown.onrender.com",' \
    '  "dex": "dex.pokemonshowdown.com",' \
    '  "replays": "replay.pokemonshowdown.com",' \
    '  "users": "pokemonshowdown.com/users",' \
    '  "teams": "teams.pokemonshowdown.com"' \
    '}' \
    > StupidShowdownClient/config/routes.json

# Overlay custom-mon art into the client tree, alongside the audio below.
# serve_client.js answers sprite requests out of client-patches/sprites/ directly,
# so nothing depends on this copy - it's kept so the art also exists at the paths
# the client itself expects, which is where a future ./build-tools/build-minidex
# run (for animated gifs in sprites/ani/) and any offline tooling would look.
# Expected filenames: client-patches/sprites/README.md
# Each directory must exist in git (they hold a README), because COPY fails on
# a missing source.
COPY client-patches/sprites/ ./StupidShowdownClient/play.pokemonshowdown.com/sprites/
COPY client-patches/audio/ ./StupidShowdownClient/play.pokemonshowdown.com/audio/

# Build server TypeScript first (client full build reads from dist/sim/dex)
RUN npm run build
# 'full' generates all data/*.js files (pokedex, abilities, moves, etc.) from server data
RUN cd StupidShowdownClient && node build full

# Production image
FROM node:22-slim

WORKDIR /app

# Copy everything from builder (server + built client)
COPY --from=builder /app /app

# Ensure required logs directory structure exists
RUN mkdir -p /app/logs/repl

# Environment variables
ENV PORT=10000
ENV NODE_ENV=production

EXPOSE 10000

# Start both servers: game server on 8000 (background) and client proxy on $PORT (foreground)
CMD ["node", "-e", "const { spawn } = require('child_process'); const port = process.env.PORT || 10000; console.log('Starting Game Server on port 8000...'); const game = spawn('node', ['pokemon-showdown', 'start', '--skip-build', '8000'], { stdio: 'inherit' }); game.on('error', e => console.error('Game server error:', e)); game.on('exit', (code, signal) => console.error('Game server exited:', code, signal)); console.log('Starting Client Server on port ' + port + '...'); const client = spawn('node', ['serve_client.js'], { stdio: 'inherit', env: { ...process.env, PORT: String(port) } }); client.on('error', e => console.error('Client server error:', e));"]
