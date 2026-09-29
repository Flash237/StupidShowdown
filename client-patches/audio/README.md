# Custom-mon cries

Optional. Copied into the client image at build time alongside
`client-patches/sprites/` (see the root `Dockerfile`). Keep at least one file in
this directory so the `COPY` step has a source.

Expected path per cry:

```
client-patches/audio/cries/<spriteid>.mp3   ->   /audio/cries/<id>.mp3
```

The client only requests a cry when it has size data for the species, i.e. once
`data/pokedex-mini.js` contains an entry for it — which only happens after
animated sprites exist in `client-patches/sprites/ani/`. So add these last; until
then the cry is never requested, rather than requested and 404ing.

Any missing cry falls through to the upstream proxy (`serve_client.js`), which
404s for custom species. A failed cry is silent — the battle just has no sound
for that Pokémon.
