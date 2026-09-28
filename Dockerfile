# Multi-stage Dockerfile for Render deployment
FROM node:20-slim AS builder

# Install git for cloning the client submodule
RUN apt-get update && apt-get install -y git --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files and install server dependencies
COPY package*.json ./
RUN npm ci

# Clone the Pokémon Showdown client at the pinned commit used by this repo
RUN git clone --depth=1 https://github.com/smogon/pokemon-showdown-client.git StupidShowdownClient

# Install client dependencies
RUN cd StupidShowdownClient && npm ci

# Copy full server source (excludes StupidShowdownClient via .dockerignore-style — but we keep the dir)
COPY . .

# Build server TypeScript and run client build script
RUN npm run build
RUN cd StupidShowdownClient && node build

# Production image
FROM node:20-slim

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
