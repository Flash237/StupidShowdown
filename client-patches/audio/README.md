# Custom-mon cries

Optional. Copied into the client alongside `client-patches/sprites/` at build
time. Keep at least one file in this directory so the copy step has a source.

Expected path per cry:

```
client-patches/audio/cries/<id>.mp3   ->   /audio/cries/<id>.mp3
```

The client only requests a cry when it has size data for the species, i.e. once
`data/pokedex-mini.js` contains an entry for it — which only happens after
animated sprites exist in `client-patches/sprites/ani/`. So add these last; until
then the cry is never requested, rather than requested and 404ing.

Missing cries just 404 and the battle is silent for that Pokémon.

Note the old Render deployment served these through a custom proxy
(`serve_client.js`) that fell back to upstream for unknown files; that proxy is
gone, so a static host answers these straight out of the client tree.
