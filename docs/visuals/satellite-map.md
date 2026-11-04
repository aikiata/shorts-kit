# Satellite and vector map (§5h): `satellite-map`

**Use when** the claim lives on the ground: a distance, a route, a border, a coastline,
a flood area, "why is there no bridge here". The viewer sees the real place, the camera
moves over it, and the facts are drawn on top of it in the same coordinates.

Components: `src/shared/map/` (import from `src/shared/map/index.ts`). Browse them with
`bun run dev gallery` (shots `map-*`).

| Piece | What it does |
| --- | --- |
| `SatelliteMap` | one SVG whose `viewBox` is the camera box; stacks mosaics and cross-fades to the sharper one as you zoom in |
| `move`, `fly`, `glide`, `coast`, `drift` (`camera.ts`) | camera between two boxes in log-zoom (zoom feels even), with a speed floor so no move lands dead, and a slow coast after it |
| `VectorLayer` | coastlines, borders, rivers, region fills; stroke width stays constant in screen pixels at any zoom |
| `Route` | a line along `[lon, lat]` points that draws on (`progress` 0 to 1), optional moving head, dashed variant, great-circle option for long distances |
| `Pin`, `Ping`, `Cross`, `Measure`, `GhostSpan`, `Region` | labels that stay inside the safe area, a pulse on a point, a measured distance (`distanceKm`), a ghost span, a filled area |
| `VietnamMap`, `VIETNAM_VIEWS`, `PLACES` | a ready Vietnam map: outline, neighbours, rivers, the Hoàng Sa and Trường Sa archipelagos, labels in Vietnamese or English |
| `Archipelagos` | the two archipelagos alone, for any map that shows the East Sea |

Coordinates: everything is in **world units** (Web Mercator normalised to 0–65536,
`mercator.ts`). That is the one space where a raster mosaic and a vector river share a
`viewBox`, which is what makes the camera possible. Use `boxAround(lon, lat, spanLon)` to
frame a place at 9:16.

## Data

1. List the camera shots in `src/videos/<id>/map.json`:

   ```json
   {"shots": [
     {"id": "country", "lon": 106.8, "lat": 14.5, "spanLon": 21},
     {"id": "saigon", "lon": 106.71, "lat": 10.78, "spanLon": 0.45, "zoom": 12}
   ]}
   ```

2. `bun run satellite <id>` fetches EOX Sentinel-2 cloudless tiles for each shot, stitches
   one mosaic per shot into `public/img/sat/<id>/` (git-ignored, rebuild any time), writes
   `src/videos/<id>/satellite.json`, and records the EOX attribution in
   `docs/facts/sources.json`.
3. `bun run geo <id>` extracts Natural Earth coastlines, countries, borders and rivers for
   the same area into `src/videos/<id>/geo.json`, simplified to about half a pixel.
   `bun run geo --vietnam` rebuilds the bundled Vietnam preset.

## Rules

1. **One shot per scale.** A fly from country to city needs a mosaic at each scale it
   passes (for example zoom 9, 10, 11, 12). `SatelliteMap` hands over to the sharper one as
   it covers the frame. One coarse mosaic stretched to street level is blur, and nobody
   reports blur.
2. **The camera never cuts between places that are on one map.** Fly. A cut throws away
   the one thing a map gives: where B is relative to A.
3. **Draw on the imagery, not on a card.** Routes, measures and regions sit in the same
   coordinates as the ground. A floating panel over a map is a slide.
4. **Measure, do not quote.** Distances on frame come from `distanceKm()` between the real
   coordinates, and the coordinates come from a fact record. When sources disagree, say the
   measured number and keep the sources' range in the fact's caveat.
5. **Map style matches the era of the story.** Satellite imagery is today. A story about
   1904 borders shows the border as it was (an `archive-plate` map, or vector borders
   labelled with the year), never today's satellite with an old line on it and no label.
6. **Attribution on frame.** EOX imagery is CC BY 4.0: the `SatelliteMap` credit line stays
   visible, and the same string goes in the pinned comment (`sk-handoff`).
7. **Labels in the viewer's language,** placed inside the safe area (`Pin` clamps them).
8. **Imagery is 2016.** EOX cloudless is a 2016 mosaic. If the claim is about a recent
   change (a new city, a flood), say so or use dated imagery as an `archive-plate`.

## Traps

- **Natural Earth is incomplete at the edges of your story.** Small islands and disputed
  areas may be missing or drawn as another country's. Check the area you show; the
  bundled Vietnam data draws the archipelagos from their own island coordinates for this
  reason.
- **Tile seams over water.** Neighbouring tiles from different passes can differ in tone
  over the sea. Pad the shot (`pad` in `map.json`) and frame the move so seams stay off
  the subject.
- **Zoom only in.** A camera that zooms back out past the coarsest mosaic shows the edge
  of the imagery.

## Cases run

| Video | Date | What it taught |
| --- | --- | --- |

## Change log

| Date | Change | Why |
| --- | --- | --- |
