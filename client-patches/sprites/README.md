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

- **Party-bar icons** used to be one of these - see `icons/` below for how they
  are covered now.

## icons/ - party-bar and teambuilder-list icons

Individual icon files (head shots, logos, class icons from the asset pack),
named by species id: `icons/nahida.webp`, `icons/demoman.jpg`,
`icons/azure.svg`, ... The client hook in `client-config-extra.js` renders
these in the icon slot for roster species instead of the shared
`pokemonicons-sheet.png` (whose cells are indexed by dex number and clamp
anything above 1025 back to placeholder 0). Like `custom/`, the extension on
disk is the artist's real one and `serve_client.js` answers with the matching
Content-Type; the client always asks for `<id>.png`.

Covered: aws, azure, cactus, dante, demoman, dracannon, flexseal, ghidorah,
ghidorah-void, godzilla, godzilla-earth, grian, hatsunemiku, hitachint65ma4,
ibuprofen, jetstreamsam, miyabi, nahida, nilou, spy, stevenhe, technoblade,
v1, vergil. Not in the pack (icon falls back to the species' battle render,
same MissingNo. placeholder as its battle sprites): navia, furina, zhongli,
raidenshogun.
- **Animation and cries.** `./build-tools/build-minidex` needs animated gifs in
  `custom/ani/` to regenerate `data/pokedex-mini.js` with these species in it
  (until then it prints `SKIPPED` and the client proxies the minidex from
  play.pokemonshowdown.com, which doesn't know these species). Without an entry
  there, the client reports no sprite size, doesn't animate, and never asks for a
  cry — so battles use the static `gen5` art above. Cries go in
  `client-patches/audio/cries/<id>.mp3`.
