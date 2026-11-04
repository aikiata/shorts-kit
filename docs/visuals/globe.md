# Globe (§5i): `globe`

**Use when** the claim spans the planet: a journey across oceans, two places far apart,
"how far is that", a drift line, a route that only makes sense as a curve on a sphere.

Components: `src/shared/map/globe.tsx`, `globe-line.tsx`, `GlobeReveal.tsx`. Browse them
with `bun run dev gallery` (shots `globe-*`).

| Piece | What it does |
| --- | --- |
| `Globe`, `GlobeStage` | a textured 3D Earth (NASA Blue Marble, `public/img/earth-4k.jpg`), viewed as `{lon, lat, scale}` |
| `mixView`, `viewTrack`, `midView` | move the view between two places smoothly: shortest way round in longitude, even log-zoom |
| `GlobeLine`, `GlobeTravel` | a line that draws on along a great circle or a polyline, and a dot travelling it |
| `GlobeBorders`, `graticule` | borders and a latitude/longitude grid locked to the sphere |
| `GlobePin`, `GlobePoly` | labelled pins (labels flip side by screen half) and filled areas on the sphere |
| `distanceKm`, `scaleForSpanKm`, `pxPerKm` | true distances, and the zoom that fits a span on screen |
| `GlobeReveal` | the pull-out: a flat scene shrinks into its point on the globe while the globe appears around it; `direction="in"` pushes back in |

## Rules

1. **The reveal is one continuous move.** Stay in the scene (a boat, a street, a map)
   while the story is local, then pull out to the globe for the scale. Showing the globe
   first kills the feeling of not knowing where you are (flow P, flow R).
2. **Long routes are great circles**, not straight screen lines. A route drawn straight on
   a flat map between continents is wrong, and viewers who know will say so.
3. **Two clocks or a counter beside the line** when the story is about time on the route
   (flow Q): the line says where, the clocks say how long.
4. **Say what the line is.** A modelled drift path, a reconstructed route or a straight
   distance is labelled on frame ("model, not a GPS track"), and the source is in the fact.
5. **Compare to a distance the viewer knows** (Saigon to London, coast to coast), measured
   with `distanceKm`, not quoted.
6. **The texture is public domain; credit it anyway** in the pinned comment ("NASA Blue
   Marble").

## Traps

- **First-frame flash.** The 3D canvas must not draw before the texture loads; `Globe`
  waits for it. If you swap textures, keep that behaviour.
- **Labels behind the horizon.** A pin on the far side of the sphere is hidden; check the
  view keeps every labelled place on the near side for the whole move.
- **Zooming a globe past city scale.** The texture is 4096 px wide: below country scale,
  hand over to a `satellite-map` shot with `GlobeReveal` in reverse.

## Cases run

| Video | Date | What it taught |
| --- | --- | --- |

## Change log

| Date | Change | Why |
| --- | --- | --- |
