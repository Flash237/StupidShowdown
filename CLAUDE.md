# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The **web client** for StupidShowdown, a personal fork of Pokémon Showdown. This `client` branch holds only the client side; the game server, simulator and game data are on the `server` branch of this same repository. Don't expect to find server code here, and don't add any.

The client is **not forked**: `StupidShowdownClient/` is a git submodule pinned to upstream [smogon/pokemon-showdown-client](https://github.com/smogon/pokemon-showdown-client), and every change this fork makes to it lives in `client-patches/` as an overlay applied at build time. Keep it that way so the submodule stays mergeable with upstream — prefer adding a file to `client-patches/` over editing the submodule checkout, and never commit inside the submodule.

## Common commands

There is no build at this branch root; the client's own `package.json` is inside the submodule.

- `git submodule update --init StupidShowdownClient` — fetch the client checkout.
- `cd StupidShowdownClient && npm ci` — install client dependencies.
- `SITE_HOST=... GAME_HOST=... node setup-config.js` — generate `config/config.js` and `config/routes.json` (run from this branch root; see `README.md` for the env vars).
- `cd StupidShowdownClient && node build full` — build the client into `play.pokemonshowdown.com/`.

## Where things are

- `client-patches/build-tools/` — our replacements for the client's build tools. Upstream's clone and build the game server for dex data; ours read it from the server's build output instead (a `dist/` at this branch root, with `caches/pokemon-showdown` pointing at a server checkout). The fork's custom Pokémon, moves, items and formats only appear in the client because of these.
- `client-patches/sprites/` — custom battle art (`custom/`), party icons (`icons/`), item icons (`itemicons/`); `README.md` there lists expected filenames.
- `client-patches/client-config-extra.js` — appended to `config/config.js`; redirects custom item and species icons to their own files, since upstream's icon sheets have no cells for them.
- `assets.zip` — source art exports for the custom roster, not read by any build.
