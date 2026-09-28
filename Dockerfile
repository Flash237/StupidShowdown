# Multi-stage Dockerfile for Render deployment
FROM node:22-slim AS builder

WORKDIR /app

# Copy root package files and install server dependencies
COPY package*.json ./
RUN npm ci

# Copy client package files and install client dependencies
# (StupidShowdownClient is already synced by Render via git submodules)
COPY StupidShowdownClient/package*.json ./StupidShowdownClient/
RUN cd StupidShowdownClient && npm ci

# Copy full source (includes synced submodule files via build context)
COPY . .

# Write production client config — points WebSocket at our own game server
RUN printf '%s\n' \
    'var Config = Config || {};' \
    'Config.defaultserver = {' \
    '  id: "stupidshowdown",' \
    '  host: "stupidshowdown.onrender.com",' \
    '  port: 443,' \
    '  httpport: 80,' \
    '  altport: 80,' \
    '  registered: true' \
    '};' \
    > StupidShowdownClient/config/config.js

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

# Build server TypeScript and compile client assets
RUN npm run build
RUN cd StupidShowdownClient && node build

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
CMD ["node", "-e", "const { spawn } = require('child_process'); const port = process.env.PORT || 10000; console.log('Starting Game Server on port 8000...'); const game = spawn('node', ['pokemon-showdown', 'start', '--skip-build', '8000'], { stdio: 'inherit' }); game.on('error', e => console.error('Game server error:', e)); console.log('Starting Client Server on port ' + port + '...'); const client = spawn('node', ['serve_client.js'], { stdio: 'inherit', env: { ...process.env, PORT: String(port) } }); client.on('error', e => console.error('Client server error:', e));"]
