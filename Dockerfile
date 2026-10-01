# Container image for the StupidShowdown game server.
#
# Server only: this branch contains no client code. The web client is built and
# deployed separately from the `client` branch of this repository.
#
# Written for a container host that injects PORT (Google Cloud Run). The port
# reaches the server as a digit argument - server/sockets.ts `start()` scans
# process.argv for one - so the CMD below passes it explicitly rather than
# relying on cloud-env's PORT detection, which is only an optional dependency.
FROM node:22-slim

WORKDIR /app

# Dependencies first, so source edits don't invalidate this layer.
COPY package*.json ./
RUN npm ci

COPY . .

# Compile TypeScript to dist/. Also copies config-example.js and data/*.json
# into dist/, which the server reads at runtime.
RUN npm run build

# Log directory the server expects to exist.
RUN mkdir -p /app/logs/repl

ENV NODE_ENV=production

# Cloud Run's default container port.
ENV PORT=8080
EXPOSE 8080

# --skip-build: the image already built above.
CMD ["sh", "-c", "node pokemon-showdown start --skip-build ${PORT:-8080}"]
