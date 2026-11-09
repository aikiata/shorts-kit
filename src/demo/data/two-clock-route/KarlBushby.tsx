import React from "react";
import {AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {Captions} from "../../shared/caption/Captions";
import {loadChannelFont} from "../../shared/font";
import {PANEL_MAX_W, SAFE_TOP, SafeZones} from "../../shared/frame/SafeZones";
import {Watermark} from "../../shared/frame/Watermark";
import {Globe, GlobePin, project, type GlobeView} from "../../shared/map/globe";
import {GlobeLine, type LonLat} from "../../shared/map/globe-line";
import {FONT, H, MAP as C, W} from "../../shared/theme";
import {distTo, PLACE, pointAt, ROUTE, TOTAL_KM} from "./route";
import {LABEL, SHOT_CFG, type Photo, type ShotCfg} from "./shots";
import {AUDIO, EN, SHOTS, shotAt, type Shot, WORDS} from "./timing";

const XFADE = 12;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const ease = Easing.inOut(Easing.cubic);

const cfgOf = (shot: Shot): ShotCfg => SHOT_CFG[shot.n];
const prevOf = (shot: Shot): Shot | undefined => SHOTS[SHOTS.indexOf(shot) - 1];

// ---------------------------------------------------------------------------
// Camera: fly from the previous shot's view to this shot's view in the first half
// of the shot, then drift slowly (3% push-in) until the shot ends. No frame stands still.
// ---------------------------------------------------------------------------
const viewAt = (frame: number): GlobeView => {
  const shot = shotAt(frame);
  const cfg = cfgOf(shot);
  const prev = prevOf(shot);
  const from = prev ? cfgOf(prev).view : cfg.view;
  const local = frame - shot.start;
  const fly = Math.min(shot.duration * 0.55, 54);
  const t = ease(Math.min(1, local / Math.max(1, fly)));
  const drift = 1 + 0.03 * (local / Math.max(1, shot.duration));
  return {
    lon: from.lon + (cfg.view.lon - from.lon) * t,
    lat: from.lat + (cfg.view.lat - from.lat) * t,
    scale: (from.scale + (cfg.view.scale - from.scale) * t) * drift,
  };
};

/** Distance walked (km along the drawn route) at frame `frame`. */
const distAt = (frame: number) => {
  const shot = shotAt(frame);
  const [a, b] = cfgOf(shot).route;
  const t = ease(interpolate(frame - shot.start, [0, shot.duration * 0.92], [0, 1], clamp));
  return distTo(a) + (distTo(b) - distTo(a)) * t;
};

const yearAt = (frame: number) => {
  const shot = shotAt(frame);
  const [a, b] = cfgOf(shot).year;
  return a + (b - a) * interpolate(frame - shot.start, [0, shot.duration * 0.92], [0, 1], clamp);
};

const moving = (shot: Shot) => {
  const [a, b] = cfgOf(shot).route;
  return a !== b;
};
const waiting = (shot: Shot) => {
  const cfg = cfgOf(shot);
  return !moving(shot) && cfg.year[1] - cfg.year[0] > 0.3;
};

// ---------------------------------------------------------------------------
// The route: solid line is walking, dashed is swimming. Cut by true distance.
// ---------------------------------------------------------------------------
const RUNS = (() => {
  const runs: {leg: "walk" | "swim"; from: number; to: number}[] = [];
  for (let i = 1; i < ROUTE.length; i++) {
    const leg = ROUTE[i].leg;
    const last = runs[runs.length - 1];
    if (last && last.leg === leg) last.to = i;
    else runs.push({leg, from: i - 1, to: i});
  }
  return runs;
})();

const Route: React.FC<{view: GlobeView; dist: number; ghost?: number}> = ({view, dist, ghost = 0}) => {
  const lines: React.ReactNode[] = [];
  RUNS.forEach((run, k) => {
    const all = ROUTE.slice(run.from, run.to + 1);
    const style = run.leg === "swim" ? {tone: C.accentSoft, dash: "4 18", strokeWidth: 7} : {tone: C.accent, strokeWidth: 6};
    if (ghost > 0) {
      lines.push(
        <GlobeLine key={`g${k}`} points={all.map((p) => p.at)} view={view} width={W} height={H} opacity={ghost * 0.6} glow={false} {...style} />,
      );
    }
    if (dist <= all[0].dist) return;
    const shown: LonLat[] = all.filter((p) => p.dist <= dist).map((p) => p.at);
    if (dist < all[all.length - 1].dist) shown.push(pointAt(dist));
    if (shown.length < 2) return;
    lines.push(<GlobeLine key={`r${k}`} points={shown} view={view} width={W} height={H} {...style} />);
  });
  return <>{lines}</>;
};

const Tip: React.FC<{view: GlobeView; dist: number; waitingNow: boolean}> = ({view, dist, waitingNow}) => {
  const frame = useCurrentFrame();
  const [lon, lat] = pointAt(dist);
  const q = project(lon, lat, view, W, H);
  if (q.front <= 0) return null;
  const pulse = waitingNow ? 1 + 0.5 * Math.abs(Math.sin(frame / 9)) : 1;
  const tone = waitingNow ? C.warn : "#FFFFFF";
  const size = 13;
  return (
    <div style={{position: "absolute", left: q.x, top: q.y, opacity: q.front}}>
      <div
        style={{
          position: "absolute",
          left: -size * pulse,
          top: -size * pulse,
          width: size * 2 * pulse,
          height: size * 2 * pulse,
          borderRadius: "50%",
          border: `3px solid ${tone}`,
          opacity: waitingNow ? 0.9 : 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -9,
          top: -9,
          width: 18,
          height: 18,
          borderRadius: 9,
          background: tone,
          boxShadow: `0 0 18px ${tone}, 0 0 40px ${tone}88`,
        }}
      />
    </div>
  );
};

/** Point on the great circle between a and b (k = 0..1), longitude kept continuous with a. */
const slerp = (a: LonLat, b: LonLat, k: number): LonLat => {
  const r = Math.PI / 180;
  const v = (p: LonLat) => [Math.cos(p[1] * r) * Math.cos(p[0] * r), Math.cos(p[1] * r) * Math.sin(p[0] * r), Math.sin(p[1] * r)];
  const p = v(a);
  const q = v(b);
  const dot = Math.max(-1, Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]));
  const w = Math.acos(dot);
  const s1 = w < 1e-6 ? 1 - k : Math.sin((1 - k) * w) / Math.sin(w);
  const s2 = w < 1e-6 ? k : Math.sin(k * w) / Math.sin(w);
  const x = s1 * p[0] + s2 * q[0];
  const y = s1 * p[1] + s2 * q[1];
  const z = s1 * p[2] + s2 * q[2];
  let lon = Math.atan2(y, x) / r;
  while (lon - a[0] > 180) lon -= 360;
  while (lon - a[0] < -180) lon += 360;
  return [lon, Math.atan2(z, Math.hypot(x, y)) / r];
};

/**
 * Dashed flight arc along the great circle: it appears, the plane flies to the waiting
 * place, stays there a while as the year clock runs, then flies back to the exact spot it left.
 */
const Flight: React.FC<{view: GlobeView; cfg: NonNullable<ShotCfg["flight"]>; t: number; start?: number}> = ({view, cfg, t, start = 0.12}) => {
  const a = PLACE[cfg.from];
  const b = cfg.to;
  const pts: LonLat[] = Array.from({length: 60}, (_, i) => slerp(a, b, i / 59));
  const span = 1 - start;
  const at = (x: number) => start + span * x;
  const on = interpolate(t, [at(0), at(0.08)], [0, 1], clamp);
  const go = ease(interpolate(t, [at(0.08), at(0.36)], [0, 1], clamp));
  const back = ease(interpolate(t, [at(0.66), at(0.94)], [0, 1], clamp));
  const there = go - back;
  const k = Math.round(Math.max(0, Math.min(1, there)) * 59);
  const q = project(pts[k][0], pts[k][1], view, W, H);
  return (
    <>
      <GlobeLine points={pts} view={view} width={W} height={H} tone={C.warn} dash="10 14" strokeWidth={4} glow={false} opacity={on} />
      <GlobePin at={b} view={view} width={W} height={H} label={cfg.label} tone={C.warn} on={on} exact size={12} />
      {on > 0.1 && q.front > 0 ? (
        <div
          style={{
            position: "absolute",
            left: q.x - 12,
            top: q.y - 12,
            width: 24,
            height: 24,
            borderRadius: 12,
            background: C.warn,
            boxShadow: `0 0 22px ${C.warn}`,
            opacity: on,
          }}
        />
      ) : null}
    </>
  );
};

/** A walk off the main route, drawn on during the shot. */
const Sidewalk: React.FC<{view: GlobeView; cfg: NonNullable<ShotCfg["sidewalk"]>; t: number}> = ({view, cfg, t}) => {
  const pts: LonLat[] = [];
  for (let i = 1; i < cfg.points.length; i++) {
    for (let k = 0; k < 12; k++) pts.push(slerp(cfg.points[i - 1], cfg.points[i], k / 12));
  }
  pts.push(cfg.points[cfg.points.length - 1]);
  const progress = interpolate(t, [0.45, 0.9], [0, 1], clamp);
  const on = interpolate(t, [0.4, 0.48], [0, 1], clamp);
  return (
    <>
      <GlobeLine points={pts} view={view} width={W} height={H} tone={C.warn} dash="14 10" strokeWidth={5} glow={false} progress={progress} opacity={on} />
      <GlobePin at={cfg.points[cfg.points.length - 1]} view={view} width={W} height={H} label={cfg.label} tone={C.warn} on={progress > 0.95 ? 1 : 0} exact size={12} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Year clock, state pill, caption chip.
// ---------------------------------------------------------------------------
const Clock: React.FC<{year: number; state: "walk" | "wait" | null; opacity: number}> = ({year, state, opacity}) => (
  <div style={{position: "absolute", top: SAFE_TOP + 96, left: 0, right: 0, textAlign: "center", opacity, fontFamily: FONT.sans}}>
    <div style={{fontSize: 30, fontWeight: 700, letterSpacing: 6, color: C.muted, textShadow: "0 2px 12px #000"}}>NĂM</div>
    <div
      style={{
        fontSize: 132,
        lineHeight: 1,
        fontWeight: 900,
        color: "#fff",
        fontVariantNumeric: "tabular-nums",
        textShadow: "0 0 30px rgba(0,0,0,0.9), 0 6px 24px rgba(0,0,0,0.9)",
      }}
    >
      {Math.floor(year)}
    </div>
    {state ? (
      <div
        style={{
          display: "inline-block",
          marginTop: 14,
          padding: "8px 22px",
          borderRadius: 40,
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: 3,
          color: state === "wait" ? "#1a1300" : "#00202b",
          background: state === "wait" ? C.warn : C.accent,
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
        }}
      >
        {state === "wait" ? "ĐANG CHỜ" : "ĐANG ĐI"}
      </div>
    ) : null}
  </div>
);

const Chip: React.FC<{text: string; sub?: string; t: number; until?: number}> = ({text, sub, t, until}) => {
  // `until`: in a shot with a flight arc the chip leaves before take-off, so it does not cover the departure point.
  const on = until ? interpolate(t, [0, 10, until - 10, until], [0, 1, 1, 0], clamp) : interpolate(t, [0, 10], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 650,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: on,
        transform: `translateY(${(1 - on) * 16}px)`,
      }}
    >
      <div
        style={{
          maxWidth: PANEL_MAX_W,
          padding: "16px 28px",
          borderRadius: 18,
          background: "rgba(4,18,26,0.82)",
          border: `2px solid ${C.warn}`,
          textAlign: "center",
          fontFamily: FONT.sans,
          boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{fontSize: 44, fontWeight: 800, color: C.warn, lineHeight: 1.25}}>{text}</div>
        {sub ? <div style={{fontSize: 32, fontWeight: 600, color: C.text, marginTop: 6, lineHeight: 1.3}}>{sub}</div> : null}
      </div>
    </div>
  );
};

const CARD_W = 470;
const CARD_H = 320;
const Card: React.FC<{photo: Photo; t: number; dur: number; side: "left" | "right"}> = ({photo, t, dur, side}) => {
  const on = interpolate(t, [4, 16, dur - 10, dur], [0, 1, 1, 0], clamp);
  const zoom = 1.04 + 0.06 * (t / Math.max(1, dur));
  return (
    <div
      style={{
        position: "absolute",
        left: side === "left" ? 50 : W - CARD_W - 50,
        top: 840,
        width: CARD_W,
        opacity: on,
        transform: `translateY(${(1 - on) * 24}px) rotate(${side === "left" ? -2 : 2}deg)`,
      }}
    >
      <div style={{width: CARD_W, height: CARD_H, overflow: "hidden", borderRadius: 14, border: "6px solid #fff", boxShadow: "0 18px 50px rgba(0,0,0,0.7)"}}>
        <Img src={staticFile(photo.src)} style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`}} />
      </div>
      <div style={{marginTop: 8, fontFamily: FONT.sans, fontSize: 18, color: C.muted, textAlign: "right", textShadow: "0 1px 6px #000"}}>{photo.credit}</div>
    </div>
  );
};

const FullPhoto: React.FC<{photo: Photo; t: number; dur: number}> = ({photo, t, dur}) => {
  const zoom = 1.02 + 0.08 * (t / Math.max(1, dur));
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <Img
        src={staticFile(photo.src)}
        style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: photo.focus ?? "50% 50%", transform: `scale(${zoom})`}}
      />
      <AbsoluteFill style={{background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)"}} />
      <div style={{position: "absolute", left: 40, top: 1250, fontFamily: FONT.sans, fontSize: 20, color: "rgba(255,255,255,0.75)", textShadow: "0 1px 6px #000"}}>
        {photo.credit}
      </div>
    </AbsoluteFill>
  );
};

const Quote: React.FC<{text: string; t: number; top: number}> = ({text, t, top}) => {
  const on = interpolate(t, [6, 20], [0, 1], clamp);
  return (
    <div style={{position: "absolute", top, left: 60, right: 60, textAlign: "center", opacity: on, transform: `scale(${0.96 + 0.04 * on})`}}>
      <div
        style={{
          fontFamily: FONT.sans,
          fontSize: 76,
          fontWeight: 900,
          lineHeight: 1.15,
          color: "#fff",
          textShadow: "0 0 30px rgba(0,0,0,0.95), 0 6px 26px rgba(0,0,0,0.9)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Three bars: planned, actual, the part really spent walking (about half). */
const Bars: React.FC<{t: number}> = ({t}) => {
  const rows = [
    {label: "Dự tính", value: "12 năm", frac: 12 / 28, tone: C.muted, at: 0},
    {label: "Thực tế", value: "28 năm", frac: 1, tone: C.accent, at: 14},
    {label: "Thật sự đi bộ", value: "khoảng một nửa", frac: 0.5, tone: C.warn, at: 28},
  ];
  return (
    <div style={{position: "absolute", top: 600, left: 80, right: 80, padding: "40px 40px 0", borderRadius: 24, background: "rgba(4,18,26,0.78)", fontFamily: FONT.sans}}>
      {rows.map((r) => {
        const fill = ease(interpolate(t, [r.at, r.at + 24], [0, 1], clamp));
        return (
          <div key={r.label} style={{marginBottom: 46, opacity: interpolate(t, [r.at, r.at + 8], [0, 1], clamp)}}>
            <div style={{display: "flex", justifyContent: "space-between", fontSize: 38, fontWeight: 800, color: "#fff", textShadow: "0 2px 12px #000"}}>
              <span>{r.label}</span>
              <span style={{color: r.tone}}>{r.value}</span>
            </div>
            <div style={{marginTop: 12, height: 34, borderRadius: 17, background: "rgba(255,255,255,0.14)", overflow: "hidden"}}>
              <div style={{width: `${r.frac * fill * 100}%`, height: "100%", borderRadius: 17, background: r.tone, boxShadow: `0 0 24px ${r.tone}`}} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// One shot's overlay, drawable for the previous shot too during the crossfade.
// ---------------------------------------------------------------------------
const Overlay: React.FC<{shot: Shot; frame: number; view: GlobeView}> = ({shot, frame, view}) => {
  const cfg = cfgOf(shot);
  const t = frame - shot.start;
  // The photo goes in the half of the frame WITHOUT the shot's destination, so it does not cover what the voice is talking about.
  const target = PLACE[cfg.route[1]];
  const side = cfg.cardSide ?? (project(target[0], target[1], cfg.view, W, H).x > W / 2 ? "left" : "right");
  return (
    <AbsoluteFill>
      {(cfg.pins ?? []).map((name) => (
        <GlobePin key={name} at={PLACE[name]} view={view} width={W} height={H} label={LABEL[name]} on={interpolate(t, [0, 12], [0, 1], clamp)} exact />
      ))}
      {cfg.flight ? <Flight view={view} cfg={cfg.flight} t={t / Math.max(1, shot.duration)} start={shot.n === 7 ? 0.45 : 0.3} /> : null}
      {cfg.sidewalk ? <Sidewalk view={view} cfg={cfg.sidewalk} t={t / Math.max(1, shot.duration)} /> : null}
      {cfg.chip ? <Chip text={cfg.chip} sub={cfg.sub} t={t} until={cfg.flight && shot.n !== 7 ? Math.round(shot.duration * 0.34) : undefined} /> : null}
      {cfg.photo?.mode === "card" ? <Card photo={cfg.photo} t={t} dur={shot.duration} side={side} /> : null}
      {cfg.bars ? <Bars t={t} /> : null}
    </AbsoluteFill>
  );
};

const Vignette = () => (
  <AbsoluteFill style={{pointerEvents: "none", background: "radial-gradient(ellipse 80% 62% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)"}} />
);

export const KarlBushby: React.FC<{safe?: boolean}> = ({safe = false}) => {
  const frame = useCurrentFrame();
  loadChannelFont();
  const shot = shotAt(frame);
  const cfg = cfgOf(shot);
  const prev = prevOf(shot);
  const local = frame - shot.start;
  const crossing = !!prev && local < XFADE;
  const mix = crossing ? local / XFADE : 1;

  const view = viewAt(frame);
  const dist = distAt(frame);
  const year = yearAt(frame);
  const ghost = cfg.ghost ? interpolate(local, [0, 20], [0, 1], clamp) : shot.n >= 24 ? 1 : 0;
  const fullDist = shot.n >= 24 ? TOTAL_KM : dist;

  const full = cfg.photo?.mode === "full";
  const prevFull = prev && cfgOf(prev).photo?.mode === "full";
  // A full photo fades in/out instead of hard-cutting, so the globe reappears from under it.
  const photoOpacity = full ? (prevFull ? 1 : mix) : prevFull && crossing ? 1 - mix : 0;
  const photoShot = full ? shot : prevFull && crossing ? prev! : null;

  const state = waiting(shot) ? "wait" : moving(shot) ? "walk" : null;
  const clockOn = full ? 1 - photoOpacity : 1;

  return (
    <AbsoluteFill style={{background: C.bg}}>
      {AUDIO ? <Audio src={staticFile(AUDIO)} /> : null}
      {/* No background music: the channel owner adds their own music when posting (03/11/2026). */}
      <Globe width={W} height={H} view={view} />
      <AbsoluteFill>
        <Route view={view} dist={fullDist} ghost={ghost} />
        <Tip view={view} dist={fullDist} waitingNow={state === "wait"} />
        {crossing ? (
          <AbsoluteFill style={{opacity: 1 - mix}}>
            <Overlay shot={prev!} frame={frame} view={view} />
          </AbsoluteFill>
        ) : null}
        <AbsoluteFill style={{opacity: mix}}>
          <Overlay shot={shot} frame={frame} view={view} />
        </AbsoluteFill>
      </AbsoluteFill>
      <Vignette />
      {photoShot && photoOpacity > 0 ? (
        <AbsoluteFill style={{opacity: photoOpacity}}>
          <FullPhoto photo={cfgOf(photoShot).photo!} t={frame - photoShot.start} dur={photoShot.duration} />
        </AbsoluteFill>
      ) : null}
      {cfg.quote ? <Quote text={cfg.quote} t={local} top={full ? 330 : 660} /> : null}
      {shot.n >= 3 && shot.n <= 24 ? <Clock year={year} state={state} opacity={clockOn * interpolate(local + (shot.n === 3 ? 0 : 99), [0, 12], [0, 1], clamp)} /> : null}
      {!full ? (
        <div style={{position: "absolute", left: 40, top: 1250, fontFamily: FONT.sans, fontSize: 18, color: "rgba(255,255,255,0.5)", textShadow: "0 1px 6px #000"}}>
          Nền: NASA Blue Marble. Đường đi phỏng theo các mốc.
        </div>
      ) : null}
      <Captions words={WORDS} palette={C} variant="map" maxWidth={PANEL_MAX_W} en={EN} />
      <Watermark top={SAFE_TOP + 8} />
      {safe ? <SafeZones /> : null}
    </AbsoluteFill>
  );
};
