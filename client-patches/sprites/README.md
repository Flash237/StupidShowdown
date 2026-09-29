# Custom-mon sprite art

Real art for this fork's custom roster, plus the two custom item icons. Drop a
file in and `serve_client.js` serves it; no rename, resize, convert, or client
change needed.

**Why this directory instead of the client itself:** the client is a git
submodule pinned to smogon/pokemon-showdown-client, and its own `.gitignore`
excludes `/play.pokemonshowdown.com/sprites/`. Art placed there can never be
committed from this repo, so it has to live here and be served from here.

## Layout

One file per Pokémon, named after its *spriteid* — the lowercased id of the
species name (`Jetstream Sam` → `jetstreamsam`):

```
custom/<spriteid>.<ext>          front / teambuilder art
custom/<spriteid>-shiny.<ext>    optional shiny variant
itemicons/<itemid>.<ext>         held-item icon
```

`<ext>` is whatever the file actually is (`.png`, `.webp`, `.jpeg`, `.avif`).
Extensions are deliberately **not** normalized: the client asks for `.png` URLs,
but `serve_client.js` indexes these directories by filename stem and answers any
sprite request with the real file and the `Content-Type` that matches its real
extension. That matters because these are rendered as CSS `background-image`s,
and a WebP file served as `image/png` is silently dropped.

Because the lookup is by id and ignores directory, one file answers every path
the client might ask for:

| Client URL | This directory | Used for |
|---|---|---|
| `/sprites/home-centered/<id>.png` | `custom/<id>.*` | teambuilder party sprite (drawn 96px tall) |
| `/sprites/gen5/<id>.png` | `custom/<id>.*` | battle sprite, front |
| `/sprites/gen5-back/<id>.png` | `custom/<id>.*` | battle sprite, back |
| `/sprites/*-shiny/<id>.png` | `custom/<id>-shiny.*` | shiny variants, falling back to the normal file |
| `/sprites/itemicons/<itemid>.png` | `itemicons/<itemid>.*` | item icon, via the client hook below |

## The ids

```
nahida           vergil           jetstreamsam     nilou            aws
azure            godzilla         godzilla-earth   dante            demoman
flexseal         ibuprofen        hitachint65ma4   grian            spy
dracannon        technoblade      ghidorah         ghidorah-void    stevenhe
cactus           v1               miyabi           hatsunemiku
```

`godzilla-earth` and `ghidorah-void` are formes of `godzilla` / `ghidorah`, so
they carry the hyphen. `nilou` and `demoman` also have `<id>-shiny` files.

**Placeholders:** `navia`, `furina`, `zhongli` and `raidenshogun` have no art of
their own yet, so all four point at the same 560x560 MissingNo. WebP (from the
[Gaming Urban Legends](https://gaming-urban-legends.fandom.com/wiki/File:MissingNo..webp)
wiki) — a placeholder that says exactly what it is rather than leaving an empty
slot, since a 404 here renders as blank space. Replacing any of them is just
dropping a `<id>.<ext>` file in; nothing else needs to change.

## Item icons

`itemicons/` holds `orbof20000years.png` (Orb of 20000 Years) and
`ghostorbofthebloodritual.png` (Ghost Orb of the Blood Ritual).

Item icons are normally cells in `sprites/itemicons-sheet.png`, positioned from
the item's `spritenum`. Both custom items leave `spritenum: 0`, so they used to
render whatever item owns cell 0. `client-patches/client-config-extra.js` is
appended to the client's generated `config.js` at build time and overrides
`Dex.getItemIcon` to point just those two items at the files here; every other
item still uses the sheet. Adding another custom item icon means adding a file
here **and** an entry in that map.

## Not covered here

- **Party-bar icons.** Not individual files: they're cells in
  `sprites/pokemonicons-sheet.png` indexed by dex number, and `getPokemonIconNum`
  clamps anything above 1025 to icon 0. Custom species therefore always show the
  placeholder icon unless an entry is hand-added to `BattlePokemonIconIndexes` in
  the client's `src/battle-dex-data.ts`. The `*_icon.*` / `*-icon.*` files in the
  original `assets.zip` at the repo root are the source art for that future sheet;
  none of them are served as they are, so they were left out of `custom/` rather
  than adding files nothing reads. The exception is the two files in `itemicons/`,
  which are wired up via the client hook above.
- **Animation and cries.** `./build-tools/build-minidex` needs animated gifs in
  `custom/ani/` to regenerate `data/pokedex-mini.js` with these species in it
  (until then it prints `SKIPPED` and the client proxies the minidex from
  play.pokemonshowdown.com, which doesn't know these species). Without an entry
  there, the client reports no sprite size, doesn't animate, and never asks for a
  cry — so battles use the static `gen5` art above. Cries go in
  `client-patches/audio/cries/<id>.mp3`.
