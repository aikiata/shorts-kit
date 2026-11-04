import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {GlobeBorders, GlobeLine, GlobeTravel, graticule} from "../../shared/map/globe-line";
import {GlobeReveal} from "../../shared/map/GlobeReveal";
import {CLOSE, globeDistanceKm, FIT, Globe, GlobePin, midView, spaceBackground, viewTrack, type GlobeLonLat} from "../../shared/map/globe";
import {clamp, ease, ramp} from "../../shared/motion/anim";
import {Clouds, Sea, Sky, Stars, Sun, SUNS} from "../../shared/nature";
import {DEFAULT_PALETTE as P, FONT, H} from "../../shared/theme";

/**
 * Globe shots for the gallery. Each is a plain component that reads its own
 * (sequence-relative) frame. `label` is the import path, `note` what it shows.
 */
const GRID = graticule(30);
const SAIGON: GlobeLonLat = [106.66, 10.76];
const LONDON: GlobeLonLat = [-0.13, 51.51];

const Space: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{background: spaceBackground(P)}}>
    <Stars horizon={H} count={160} on={0.8} />
    {children}
  </AbsoluteFill>
);

/** 1. A globe turning slowly, with a faint graticule locked to it. */
const GlobeTurn: React.FC = () => {
  const frame = useCurrentFrame();
  const view = {lon: 60 + frame * 0.4, lat: 18, scale: FIT * (1 + frame * 0.0004)};
  return (
    <Space>
      <Globe view={view} />
      <GlobeBorders lines={GRID} view={view} opacity={0.22} strokeWidth={1.5} tone={P.accentSoft} />
    </Space>
  );
};

/** 2. Saigon to London: a great circle drawing on, a dot riding its head. */
const LINE_FRAMES = 150;
const LineSaigonLondon: React.FC = () => {
  const frame = useCurrentFrame();
  const view = viewTrack(frame, [
    {at: 0, view: {lon: SAIGON[0] - 6, lat: SAIGON[1] + 12, scale: 0.95}},
    {at: 95, view: midView(SAIGON, LONDON, FIT)},
  ]);
  const draw = ease(interpolate(frame, [18, 118], [0, 1], clamp));
  const km = Math.round(globeDistanceKm(SAIGON, LONDON) / 100) * 100;
  return (
    <Space>
      <Globe view={view} />
      <GlobeLine points={[SAIGON, LONDON]} view={view} progress={draw} tone={P.warn} strokeWidth={6} />
      <GlobeTravel points={[SAIGON, LONDON]} view={view} t={draw} opacity={draw > 0 && draw < 0.999 ? 1 : 0} tone={P.text} size={9} />
      <GlobePin at={SAIGON} view={view} label="Saigon" on={ramp(frame, 4, 12)} />
      <GlobePin at={LONDON} view={view} label="London" sub={`≈ ${km.toLocaleString("en-US")} km`} tone={P.warn} on={ramp(frame, 112, 12)} />
    </Space>
  );
};

/** 3. An illustrated sea shrinks into its point on the globe as the camera pulls out. */
const REVEAL_FRAMES = 150;
const DRIFT_AT: GlobeLonLat = [-150, 14];
const SeaScene: React.FC = () => (
  <AbsoluteFill>
    <Sky sky="day" />
    <Sun {...SUNS.day} />
    <Clouds sky="day" />
    <Sea sky="day" />
  </AbsoluteFill>
);
const PullOut: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <GlobeReveal
      at={DRIFT_AT}
      spanKm={700}
      start={20}
      frames={85}
      backdrop={<Stars horizon={H} count={160} on={0.8} />}
      overlay={(s) => <GlobePin at={DRIFT_AT} view={s.view} label="Mid-Pacific" sub="the flat scene was here" on={ramp(frame, 88, 14)} />}
    >
      <SeaScene />
    </GlobeReveal>
  );
};

/** 4. Pins with labels popping on one at a time; one carries a ground-true halo. */
const PIN_FRAMES = 120;
const PINS: {at: GlobeLonLat; label: string; sub?: string; halo?: number}[] = [
  {at: [139.69, 35.69], label: "Tokyo"},
  {at: [105.85, 21.03], label: "Hanoi", sub: "Hà Nội"},
  {at: [100.5, 13.75], label: "Bangkok"},
  {at: [114.17, 22.32], label: "Hong Kong", sub: "370 km halo", halo: 370},
];
const PinLabels: React.FC = () => {
  const frame = useCurrentFrame();
  const view = viewTrack(frame, [
    {at: 0, view: {lon: 112, lat: 20, scale: CLOSE * 0.95}},
    {at: PIN_FRAMES, view: {lon: 118, lat: 24, scale: CLOSE * 1.12}},
  ]);
  return (
    <Space>
      <Globe view={view} />
      {PINS.map((p, i) => (
        <GlobePin key={p.label} at={p.at} view={view} label={p.label} sub={p.sub} haloKm={p.halo} tone={p.halo ? P.warn : P.accent} on={ramp(frame, 10 + i * 16, 12)} />
      ))}
      <div style={{position: "absolute", left: 60, bottom: 230, fontFamily: FONT.sans, fontSize: 20, color: "rgba(255,255,255,0.55)", textShadow: "0 1px 6px #000"}}>
        Globe texture: NASA Blue Marble (public domain)
      </div>
    </Space>
  );
};

export type GalleryShot = {id: string; label: string; note: string; frames: number; Component: React.FC};

export const GLOBE_SHOTS: GalleryShot[] = [
  {id: "globe-turn", label: "shared/map/globe: Globe, GlobeBorders", note: "a slow turn; graticule() locked to the sphere", frames: 120, Component: GlobeTurn},
  {id: "globe-line", label: "shared/map/globe-line: GlobeLine, GlobeTravel", note: "Saigon to London on a great circle", frames: LINE_FRAMES, Component: LineSaigonLondon},
  {id: "globe-reveal", label: "shared/map/GlobeReveal", note: 'a flat scene pulls out to the globe (direction="in" reverses)', frames: REVEAL_FRAMES, Component: PullOut},
  {id: "globe-pin", label: "shared/map/globe: GlobePin", note: "labels flip side by screen half; haloKm is true to the ground", frames: PIN_FRAMES, Component: PinLabels},
];
