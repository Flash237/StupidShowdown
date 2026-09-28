# Multi-stage Dockerfile for Render deployment
FROM node:20-slim AS builder

WORKDIR /app

# Copy root package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy client package files and build client if needed
COPY StupidShowdownClient/package*.json ./StupidShowdownClient/
RUN cd StupidShowdownClient && npm ci

# Copy full source
COPY . .

# Build server TypeScript code and client assets
RUN npm run build
RUN cd StupidShowdownClient && node build

# Production image
FROM node:20-slim

WORKDIR /app

# Install runtime tools if needed (e.g. static server runner / process manager)
COPY package*.json ./
RUN npm ci --omit=dev

COPY StupidShowdownClient/package*.json ./StupidShowdownClient/
RUN cd StupidShowdownClient && npm ci --omit=dev

# Copy compiled build artifacts and necessary runtime source files
COPY --from=builder /app/build ./build
COPY --from=builder /app/tools ./tools
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/config ./config
COPY --from=builder /app/server ./server
COPY --from=builder /app/sim ./sim
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/pokemon-showdown ./pokemon-showdown
COPY --from=builder /app/serve_client.js ./serve_client.js
COPY --from=builder /app/StupidShowdownClient/play.pokemonshowdown.com ./StupidShowdownClient/play.pokemonshowdown.com
COPY --from=builder /app/StupidShowdownClient/config ./StupidShowdownClient/config

# Environment variables
ENV PORT=10000
ENV NODE_ENV=production

EXPOSE 10000

# Start script running both Game Server (background port 8000) and Client Proxy (foreground port 10000 / $PORT)
CMD ["node", "-e", "const { spawn } = require('child_process'); const port = process.env.PORT || 10000; console.log('Starting Game Server on port 8000...'); spawn('node', ['pokemon-showdown', 'start', '--skip-build', '8000'], { stdio: 'inherit' }); console.log('Starting Client Server on port ' + port + '...'); spawn('node', ['serve_client.js'], { stdio: 'inherit', env: { ...process.env, PORT: port } });"]
