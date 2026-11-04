import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {SAFE_BOTTOM} from "../../shared/frame/SafeZones";
import {fade, ramp} from "../../shared/motion/anim";
import {
  at,
  boxAround,
  distanceKm,
  formatKm,
  Measure,
  move,
  NEIGHBOURS,
  Pin,
  type PinSide,
  Ping,
  Region,
  Route,
  SatelliteMap,
  VIETNAM_VIEWS,
  VietnamMap,
} from "../../shared/map";
import {DEFAULT_PALETTE, FONT, W} from "../../shared/theme";
import SAT from "./satellite.json";

/** Same shape as the globe shots: the orchestrator wires both into the gallery. */
export type GalleryShot = {id: string; label: string; note: string; frames: number; Component: React.FC};

const P = DEFAULT_PALETTE;

/** The EOX licence asks for this credit wherever the imagery is shown. */
const SatCredit: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 60,
      top: SAFE_BOTTOM - 74,
      width: W - 220,
      fontFamily: FONT.sans,
      fontSize: 19,
      lineHeight: 1.3,
      color: "rgba(255,255,255,0.82)",
      textShadow: "0 1px 3px rgba(0,0,0,0.9)",
    }}
  >
    Imagery: EOxCloudless 2016 by EOX IT Services GmbH, CC BY 4.0 (contains modified Copernicus Sentinel data 2016)
  </div>
);

// 1 · Vietnam with Hoàng Sa and Trường Sa, a route drawing down the coast.
const ROUTE_FRAMES = 150;
const COAST_ROUTE = ["Hà Nội", "Vinh", "Huế", "Đà Nẵng", "Quy Nhơn", "Nha Trang", "TP. Hồ Chí Minh"].map(at);
const ROUTE_PINS: {name: string; en: string; k: number; side: PinSide}[] = [
  {name: "Hà Nội", en: "Hanoi", k: 0, side: "left"},
  {name: "Huế", en: "Hue", k: 0.33, side: "left"},
  {name: "Đà Nẵng", en: "Da Nang", k: 0.4, side: "right"},
  {name: "TP. Hồ Chí Minh", en: "Ho Chi Minh City", k: 1, side: "left"},
];

const VietnamRoute: React.FC = () => {
  const frame = useCurrentFrame();
  const box = move(frame, {from: VIETNAM_VIEWS.wide, to: VIETNAM_VIEWS.country, frames: [0, 70]});
  const k = ramp(frame, 24, 100);
  return (
    <VietnamMap box={box} countryLabels={["LAO", "KHM", "THA"]} archipelagos={fade(frame, 6, 18)}>
      <Route points={COAST_ROUTE} progress={k} head width={6} />
      {ROUTE_PINS.map((p) => (
        <Pin key={p.name} at={at(p.name)} label={p.name} sub={p.en} size={34} side={p.side} opacity={k >= p.k ? fade(frame, 24 + p.k * 100, 10) : 0} />
      ))}
    </VietnamMap>
  );
};

// 2 · A fly over satellite imagery from the Mekong delta down to Saigon; the sharper mosaic takes over on the way in.
const FLY_FRAMES = 150;
const DELTA = boxAround(106.3, 10.4, 3);
const SAIGON = boxAround(106.71, 10.78, 0.45);

const SatelliteFly: React.FC = () => {
  const frame = useCurrentFrame();
  const box = move(frame, {from: DELTA, to: SAIGON, frames: [8, 120]});
  return (
    <AbsoluteFill>
      <SatelliteMap box={box} mosaics={SAT.mosaics}>
        <Pin at={[106.7009, 10.7769]} label="TP. Hồ Chí Minh" sub="Ho Chi Minh City" size={40} side="bottom" opacity={fade(frame, 112, 12)} />
      </SatelliteMap>
      <SatCredit />
    </AbsoluteFill>
  );
};

// 3 · Region fills fading in over the vector-only preset.
const REGION_FRAMES = 105;
const LAO = NEIGHBOURS.find((n) => n.iso === "LAO")!;
const KHM = NEIGHBOURS.find((n) => n.iso === "KHM")!;

const RegionFill: React.FC = () => {
  const frame = useCurrentFrame();
  const box = move(frame, {from: VIETNAM_VIEWS.mainland, to: boxAround(105.4, 15.6, 11.5), frames: [0, REGION_FRAMES]});
  return (
    <VietnamMap box={box} archipelagos={0} rivers={0.9} countryLabels={["LAO", "KHM", "THA", "VNM"]}>
      <Region d={LAO.d} opacity={fade(frame, 14, 22)} color={P.good} />
      <Region d={KHM.d} opacity={fade(frame, 40, 22)} color={P.warn} />
    </VietnamMap>
  );
};

// 4 · Measure, Ping and Pin on satellite imagery; the measure label is computed, not typed.
const NOTE_FRAMES = 120;
const CAN_THO = at("Cần Thơ");
const HCMC = at("TP. Hồ Chí Minh");

const Annotations: React.FC = () => {
  const frame = useCurrentFrame();
  const box = move(frame, {from: boxAround(106.2, 10.4, 2.4), to: boxAround(106.25, 10.45, 2.0), frames: [0, NOTE_FRAMES]});
  return (
    <AbsoluteFill>
      <SatelliteMap box={box} mosaics={SAT.mosaics} dim={0.15}>
        <Measure from={CAN_THO} to={HCMC} progress={ramp(frame, 30, 40)} label={formatKm(distanceKm(CAN_THO, HCMC))} offset={-80} color={P.warn} />
        <Ping at={CAN_THO} phase={(frame % 40) / 40} color={P.accent} />
        <Ping at={HCMC} phase={((frame + 20) % 40) / 40} color={P.accent} />
        <Pin at={CAN_THO} label="Cần Thơ" sub="Can Tho" dot={0} gap={30} side="bottom" opacity={fade(frame, 8, 10)} />
        <Pin at={HCMC} label="TP. Hồ Chí Minh" sub="Ho Chi Minh City" dot={0} gap={30} side="right" opacity={fade(frame, 16, 10)} />
      </SatelliteMap>
      <SatCredit />
    </AbsoluteFill>
  );
};

export const MAP_SHOTS: GalleryShot[] = [
  {id: "map-vietnam-route", label: "shared/map: VietnamMap, Route, Pin", note: "Hoàng Sa + Trường Sa drawn; route draws on", frames: ROUTE_FRAMES, Component: VietnamRoute},
  {id: "map-satellite-fly", label: "shared/map: SatelliteMap, move()", note: "log-zoom fly; sharper mosaic fades in", frames: FLY_FRAMES, Component: SatelliteFly},
  {id: "map-region", label: "shared/map: Region, VietnamMap rivers", note: "region fills fade in, vector-only", frames: REGION_FRAMES, Component: RegionFill},
  {id: "map-annotations", label: "shared/map: Measure, Ping, Pin", note: "distance computed with distanceKm()", frames: NOTE_FRAMES, Component: Annotations},
];

export const MAP_SHOTS_FRAMES = MAP_SHOTS.reduce((n, s) => n + s.frames, 0);
