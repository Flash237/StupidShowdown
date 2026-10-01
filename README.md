StupidShowdown Client
========================================================================

This branch is the **web client** for StupidShowdown. The game server, battle
simulator and game data live on the sibling
[`server`](https://github.com/Flash237/StupidShowdown/tree/server) branch of
this repository; nothing here simulates battles or serves them.

Layout
------------------------------------------------------------------------

- `StupidShowdownClient/` — git submodule pinned to upstream
  [smogon/pokemon-showdown-client](https://github.com/smogon/pokemon-showdown-client).
  The client is *not* forked, so it stays mergeable with upstream.
- `client-patches/` — everything this fork adds to that checkout:
  - `build-tools/` — our replacements for the client's build tools. Upstream's
    clone and build the game server to produce the client's dex/learnsets;
    ours read that data from the server's build output instead, which is what
    makes the custom Pokémon, moves, items and formats show up in the client.
  - `src/battle-dex-search.ts` — client source override.
  - `sprites/` — custom battle art, party icons and item icons
    (expected filenames: `sprites/README.md`).
  - `audio/` — custom cries (README only so far).
  - `client-config-extra.js` — appended to `config/config.js`; teaches the
    client's Dex to serve the custom item and species icons from their own
    files instead of cell 0 of the shared sheets. Its header comment explains
    the two bugs it fixes.
- `assets.zip` — source art exports for the custom roster. Nothing reads it at
  build time; the served art is what's in `client-patches/sprites/`.
- `setup-config.js` — generates the client's `config/config.js` and
  `config/routes.json` for a given deployment.

Generating config
------------------------------------------------------------------------

Both generated files are written inside the submodule (upstream ignores
`config/config.js`, and `routes.json` is per deployment). Run it from this
branch root:

    SITE_HOST=stupidshowdown.netlify.app \
    GAME_HOST=stupidshowdown-xxxx.run.app \
    node setup-config.js

- `SITE_HOST` — where this client is served from. The build rewrites asset URLs
  against it (`routes.json` `root`), so it must match the hostname players
  actually load.
- `GAME_HOST` — the game server the browser connects to (written into
  `Config.defaultserver`). `GAME_PORT` defaults to 443.

`config/config.js` deliberately starts from the submodule's `config-example.js`:
writing one from scratch drops properties the client reads on startup
(`Config.customcolors` among them), which aborts `new App()` before the client
can connect at all.

Building
------------------------------------------------------------------------

Roughly what a Netlify build has to do once it's wired up:

1. check out this branch with submodules, then `npm ci` inside
   `StupidShowdownClient/`;
2. overlay `client-patches/` onto the submodule — `build-tools/` and `src/`
   over their counterparts, `sprites/` and `audio/` into
   `play.pokemonshowdown.com/`;
3. give the patched build tools the game server's data: they read it from
   `dist/` at this branch root, with `caches/pokemon-showdown` pointing at a
   server checkout (that's what the old deployment symlinked in);
4. run `setup-config.js`, then `node build full` inside the submodule, and
   serve `StupidShowdownClient/play.pokemonshowdown.com/` as static files.

License note: the client (including the submodule) is AGPL-3.0; the game server
is MIT.
