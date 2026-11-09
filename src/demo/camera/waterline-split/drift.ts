/**
 * The drift from Costa Azul (Mexico) to Tile islet, Ebon Atoll (Marshall Islands).
 *
 * APPROXIMATED from the 16-point band of the University of Hawaii model (fact `alv.model-check`):
 * storm winds push the boat offshore to the south-west, then the North Equatorial Current carries it
 * west around latitude 10-12, finally slanting down to Ebon at 4.6 degrees North. Not a
 * GPS track: nobody has a real one.
 *
 * Longitude is "unwrapped" (minus 360) when crossing the date line, and stays unwrapped to the END of the line
 * (@memory/bd94om): Ebon at 168.7 East is written as -191.3.
 */
export type LonLat = readonly [number, number];

export const COSTA_AZUL: LonLat = [-93.3, 15.55];
export const EBON: LonLat = [168.7 - 360, 4.6];

export const DRIFT: LonLat[] = [
  COSTA_AZUL,
  [-95.5, 13.6],
  [-99.0, 12.2],
  [-105.0, 11.4],
  [-113.0, 11.2],
  [-122.0, 11.5],
  [-131.0, 11.8],
  [-140.0, 11.6],
  [-149.0, 11.0],
  [-158.0, 10.2],
  [-166.0, 9.2],
  [-173.0, 8.1],
  [-179.0, 7.1],
  [-184.5, 6.1],
  [-188.5, 5.2],
  EBON,
];

/** Each model tracer: the same band, offset slightly in latitude, fanning out towards the end (within about 2 degrees of Ebon). */
export const TRACERS: LonLat[][] = Array.from({length: 16}, (_, k) => {
  const off = (k / 15 - 0.5) * 2; // -1..1 degrees
  const reach = 0.93 + 0.12 * ((k * 7) % 16) / 15; // some fall short, some overshoot
  return DRIFT.map(([lon, lat], i): LonLat => {
    const s = i / (DRIFT.length - 1);
    const dLon = (lon - COSTA_AZUL[0]) * reach;
    return [COSTA_AZUL[0] + dLon, lat + off * s * 1.4 + Math.sin(i * 1.3 + k) * 0.35 * s];
  });
});
