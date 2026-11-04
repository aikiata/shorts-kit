# public/img/sat

Satellite mosaics, one folder per video, built by `bun run satellite <id>` from the
shots in `src/videos/<id>/map.json`. Git-ignored: anyone can rebuild them.

Source: EOX Sentinel-2 cloudless 2016, CC BY 4.0. Attribution, on frame (`SatelliteMap`
draws it) and in the pinned comment:

> EOxCloudless https://cloudless.eox.at by EOX IT Services GmbH (Contains modified
> Copernicus Sentinel data 2016) released under Creative Commons Attribution 4.0
> International License.

Tiles are cached in `.cache/tiles/` so re-runs do not refetch.
