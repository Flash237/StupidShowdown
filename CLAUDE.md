# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

This is **StupidShowdown**, a personal fork of [Pokémon Showdown](https://github.com/smogon/pokemon-showdown) (the game server, written in TypeScript on Node.js). It tracks upstream closely (commit history is upstream's) but layers on custom content:

- Custom formats/tiers such as `[Gen 9 Champions]`, `35 Pokes`, `Artemis` (a mod), and hypothetical future metagame shifts (tier lists dated into 2026) — these live in `config/formats.ts` and `data/mods/`.
- A handful of custom crossover "fakemon" (e.g. `vergil`, `nahida`, `jetstreamsam`, `nilou`) added directly into `data/pokedex.ts`, `data/learnsets.ts`, and `data/formats-data.ts` with dex numbers starting at `10002+`.
- **This branch is the game server only.** The web client lives on the sibling `client` branch of this repository (a `StupidShowdownClient/` submodule of [pokemon-showdown-client](https://github.com/smogon/pokemon-showdown-client) plus a `client-patches/` overlay that is applied at build time). Don't look for client code here, and keep client-only changes on that branch.
- `ai-coder-resources/` — a scratch folder of source art/audio for the custom fakemon (and some unrelated assets), not wired into the build. Nothing under `data/` reads from it automatically.
- Root-level helper scripts outside the upstream project: `index.js` (placeholder, not a real entry point).

When making changes, prefer following upstream Pokémon Showdown conventions (see `CONTRIBUTING.md`) even for custom content, since custom formats/mons are added the same way upstream expects contributors to add them.

## Common commands

Run these from the repo root (this branch is the server; the web client is on the `client` branch).

- `node build` — compile TypeScript/transpile into `dist/`. Needed after pulling changes or editing `.ts` files; the server auto-runs this on `start` unless `--skip-build` is passed. `node build --force` if the incremental build gets into a bad state.
- `node pokemon-showdown start [--skip-build] [PORT]` — start the game server (default port from `config/config.js`, itself default 8000). `config/config.js` is auto-created from `config/config-example.js` on first build if missing.
- `npm test` — lint (`eslint --cache`) then run the Mocha suite, then `tsc` (`posttest`). Mirrors `pretest`/`test`/`posttest` in `package.json`.
- `npx mocha -g "text"` — run only tests whose name contains "text" (per `CONTRIBUTING.md`). Test roots are configured in `.mocharc.json`: `test/main.js`, `test/lib`, `test/server`, `test/sim`, `test/tools`, `test/random-battles`. Tests tagged `(slow)` in their name are excluded by default (see the `grep` filter in `.mocharc.json`).
- `npm run full-test` — `eslint --max-warnings 0`, `tsc`, full Mocha run (`--forbid-only`, no slow-test skip), and `test-npm` (typechecks the public `sim/` API surface standalone). This is the closest local equivalent to CI (`full-test-ci`).
- `npm run lint` / `npm run fix` — ESLint check / autofix (config in `eslint.config.mjs`, house style in `eslint-ps-standard.mjs`).
- `npm run tsc` — typecheck only, no emit.
- Other CLI subcommands (`generate-team`, `validate-team`, `simulate-battle`, `json-team`, `pack-team`, `export-team`) are documented in `COMMANDLINE.md`; run via `node pokemon-showdown <subcommand>`.

Windows note: replace every `./pokemon-showdown` / `./build` from upstream docs with `node pokemon-showdown` / `node build`.

## Deployment

- **Server (this branch):** the `Dockerfile` builds a server-only image (written for Google Cloud Run, which injects `PORT`). Upstream's `cloud-env` PORT autodetect also still works if you run the server with no port argument.
- **Client:** built from the `client` branch and hosted separately; nothing on this branch serves client files.

## Architecture

The server has three major layers, wired together from `server/index.ts`:

- **`sim/`** — the battle simulator itself: a standalone JS library (also published to npm) for simulating battles and reading Pokédex data. No network/server code lives here. This is what `dist/sim/index.js` (the npm package `main`) exposes.
- **`data/`** — all game data: `pokedex.ts` (species), `moves.ts`, `abilities.ts`, `items.ts`, `learnsets.ts`, `formats-data.ts` (per-species tier/format data), `rulesets.ts` (the rules formats reference), and `random-battles/` (random-format set generation). `data/mods/<modname>/` holds self-contained gameplay variants (e.g. past gens, `Artemis`) that override base data.
- **`config/formats.ts`** — the actual list of playable formats/tiers, referencing rulesets from `data/rulesets.ts` by name. This is where new tiers (including this fork's custom ones) get registered; a `config/custom-formats.ts` (gitignored) can also be used to add local-only formats without touching the tracked file.
- **`server/`** — the network-facing game server: `sockets.ts` (SockJS/WebSocket layer), `users.ts` (`Users`), `rooms.ts` (`Rooms`, including battle rooms that bridge to `sim/`), `chat.ts` (`Chat`, which routes all client→server chat commands), and `chat-commands/` / `chat-plugins/` for individual commands and features.
- **`lib/`** — small in-house utilities the project maintains itself instead of taking on npm dependencies for (see "Dependencies" philosophy in `CONTRIBUTING.md` — anything reimplementable in ~30 lines is written here, e.g. `lib/static-server`).
- **`translations/`** — server-side chat/UI translation strings.

Full three-repo picture (this server, the separate client, and a login server this repo doesn't contain) is in `ARCHITECTURE.md`.

## Code conventions (see `CONTRIBUTING.md` for full detail)

- Quote style is meaningful, not arbitrary: `` ` `` for interpolated strings and protocol/HTML fed to an interpreter; `'` for internal IDs; `"` for user-facing text (names, most English strings).
- Optional values: prefer `T | null` (not `T | undefined` or `T | false`) for "no value". In `sim/`/`data/` event handlers, `T | false | null | undefined` are *distinct sentinels*, not synonyms — `false` = action failed (show failure message), `null` = failed silently (suppress message), `undefined` = ignore/no interaction.
- Prefer `||` over `??` for fallbacks (house convention, not a strict ban on `??`).
- No `.forEach` (use `for...of`); multiline template strings are avoided in favor of explicit `\n` concatenation; no `const enum` (use string union types instead).
- Commit message style enforced by reviewers: imperative mood ("Add", "Fix", not "Adding"/"Adds"), describes *what* not *how*, `<50` char summary, capitalized, no trailing period, prefixed with the relevant area/plugin when it clarifies scope (e.g. `Trivia: Ban Genesect`).
