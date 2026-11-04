# public/img

Images the kit ships with. Every file here must have its source and licence recorded below.

| File | What | Source | Licence |
|---|---|---|---|
| `earth-4k.jpg` | Equirectangular Earth texture, 4096 × 2048, used by `Globe` (`src/shared/map/globe.tsx`) | NASA Visible Earth, Blue Marble Next Generation (land surface with shaded topography and bathymetry, a northern-winter month), downscaled to 4096 × 2048 | Public domain (NASA imagery is not copyrighted). Credit is courteous, not required: "NASA Blue Marble". |

Notes

- The texture is equirectangular: longitude −180 at the left edge, +180 at the right, latitude +90 at the top.
  Any other equirectangular image (another month, the Moon, Mars) works with `<Globe texture="img/<file>.jpg" />`;
  record its source and licence in this table before it ships in a video.
- Satellite mosaics fetched per video live under `public/img/sat/` (git-ignored); see `public/img/sat/README.md`.
