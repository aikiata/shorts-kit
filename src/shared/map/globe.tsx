/**
 * A textured 3D globe (three.js via @remotion/three) plus the maths to put
 * screen-space markers exactly on it.
 *
 * The sphere is drawn by WebGL; everything you annotate it with (pins, lines,
 * polygons) is plain HTML/SVG on top, placed with `project()`, which mirrors the
 * camera and rotation of the canvas exactly. So markers land on the right spot
 * and fade out round the back of the sphere.
 *
 * Deterministic: the view is a pure function of the frame you pass in, the
 * texture is loaded once behind `delayRender`, nothing reads the clock.
 *
 * Coordinates are [lon, lat] in degrees, east and north positive.
 */
import React, {useEffect, useId, useState} from "react";
import {ThreeCanvas} from "@remotion/three";
import {AbsoluteFill, cancelRender, continueRender, delayRender, staticFile} from "remotion";
import * as THREE from "three";
import {ease} from "../motion/anim";
import {svgId} from "../random";
import {DEFAULT_PALETTE, FONT, H, W, type Palette} from "../theme";

export type GlobeLonLat = readonly [number, number];

/** What the camera looks at: the lon/lat at the centre of the disc, and the sphere's size. */
export type GlobeView = {lon: number; lat: number; scale: number};

const RADIUS = 2;
const CAM_Z = 7;
const FOV = 40;
const EARTH_KM = 6371;

/**
 * On a 9:16 frame the horizontal field of view is narrow, so the width decides
 * how big the whole disc can be. `FIT` shows the entire planet with a margin;
 * much above it the globe crops into an anonymous field of blue.
 */
export const FIT = 0.66;
/** Close enough to feel like standing on it, cropped top and bottom. */
export const CLOSE = 1.15;
/** Largest usable scale: beyond it the camera would sit inside the sphere. */
export const MAX_SCALE = (CAM_Z - 0.25) / RADIUS;

/** The default sphere: NASA Blue Marble Next Generation, public domain (see public/img/README.md). */
export const EARTH_TEXTURE = "img/earth-4k.jpg";

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Wrap a longitude difference into [-180, 180). */
export const wrapLon = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

/**
 * Apparent zoom of a scale: proportional to screen px per km of ground at the
 * centre of the disc. Close to the camera a small change of scale is a big
 * change of zoom (perspective), so moves are interpolated in log of this, not
 * log of the scale.
 */
export const zoomOf = (scale: number) => scale / Math.max(1e-6, CAM_Z - RADIUS * scale);
/** Inverse of `zoomOf`; never reaches the camera (tends to CAM_Z / RADIUS). */
export const scaleOfZoom = (zoom: number) => (zoom * CAM_Z) / (1 + zoom * RADIUS);

/**
 * Blend two views, k = 0..1. Longitude goes the short way round; the zoom is
 * interpolated in log space of the apparent size of the ground (`zoomOf`), so
 * a move from the whole planet down to a city feels even all the way.
 * k outside 0..1 extrapolates (useful for a coast after a move).
 */
export const mixView = (a: GlobeView, b: GlobeView, k: number): GlobeView => {
  const za = Math.log(zoomOf(Math.min(MAX_SCALE, a.scale)));
  const zb = Math.log(zoomOf(Math.min(MAX_SCALE, b.scale)));
  return {
    lon: a.lon + wrapLon(b.lon - a.lon) * k,
    lat: Math.max(-89, Math.min(89, a.lat + (b.lat - a.lat) * k)),
    scale: Math.min(MAX_SCALE, scaleOfZoom(Math.exp(za + (zb - za) * k))),
  };
};

/** A keyframe for `viewTrack`: be at `view` on frame `at`. */
export type ViewKey = {at: number; view: GlobeView};

/**
 * The view at `frame` along a list of keyframes (sorted by `at`), eased
 * between each pair with `mixView`. Before the first key it holds the first
 * view; after the last it keeps drifting by `drift` (scale ×(1 + drift) per
 * 100 frames, lon + `turn` degrees per 100 frames) so the picture never freezes.
 */
export const viewTrack = (
  frame: number,
  keys: readonly ViewKey[],
  {easing = ease, drift = 0.02, turn = 1.5}: {easing?: (t: number) => number; drift?: number; turn?: number} = {},
): GlobeView => {
  if (!keys.length) throw new Error("viewTrack needs at least one key");
  if (frame <= keys[0].at) return keys[0].view;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (frame <= b.at) return mixView(a.view, b.view, easing((frame - a.at) / Math.max(1, b.at - a.at)));
  }
  const last = keys[keys.length - 1];
  const past = (frame - last.at) / 100;
  return {lon: last.view.lon + turn * past, lat: last.view.lat, scale: Math.min(MAX_SCALE, last.view.scale * (1 + drift * past))};
};

/** A view centred between two points (on the great circle), for framing a line. */
export const midView = (a: GlobeLonLat, b: GlobeLonLat, scale = FIT): GlobeView => {
  const va = toVec(a[0], a[1]);
  const vb = toVec(b[0], b[1]);
  const [lon, lat] = toLonLat([va[0] + vb[0], va[1] + vb[1], va[2] + vb[2]]);
  return {lon, lat, scale};
};

// ---------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------

/**
 * Equirectangular texture on THREE.SphereGeometry puts longitude -90 at +Z, so a
 * longitude L faces the camera at rotation.y = -(L + 90). Latitude tilts on X.
 */
export const facing = (lon: number, lat: number): [number, number] => [rad(lat), rad(-(lon + 90))];

/** Where (lon, lat) sits on the unrotated sphere, in local coordinates. */
const onSphere = (lon: number, lat: number): [number, number, number] => {
  const a = rad(lon + 90);
  const b = rad(lat);
  return [RADIUS * Math.cos(b) * Math.sin(a), RADIUS * Math.sin(b), RADIUS * Math.cos(b) * Math.cos(a)];
};

export type Projected = {
  /** Screen position in canvas px. */
  x: number;
  y: number;
  /** 0 behind the limb, 1 well in front: use it to fade markers round the back. */
  front: number;
  /** Screen px per world unit at this point's depth, for sizing rings. */
  scale: number;
};

/**
 * Project a lon/lat onto the canvas for the camera the Globe uses. The globe
 * group is rotated Rx(rx)·Ry(ry) (three.js Euler XYZ, rz = 0); the maths here
 * mirrors that order exactly, or every marker drifts a few degrees.
 */
export const project = (lon: number, lat: number, view: GlobeView, width = W, height = H): Projected => {
  const [px, py, pz] = onSphere(lon, lat);
  const [rx, ry] = facing(view.lon, view.lat);
  // Ry first
  const x1 = px * Math.cos(ry) + pz * Math.sin(ry);
  const y1 = py;
  const z1 = -px * Math.sin(ry) + pz * Math.cos(ry);
  // then Rx
  const y2 = y1 * Math.cos(rx) - z1 * Math.sin(rx);
  const z2 = y1 * Math.sin(rx) + z1 * Math.cos(rx);

  const s = view.scale;
  const [X, Y, Z] = [x1 * s, y2 * s, z2 * s];
  const depth = CAM_Z - Z;
  const tan = Math.tan(rad(FOV) / 2);
  const aspect = width / height;
  const ndcX = X / depth / (tan * aspect);
  const ndcY = Y / depth / tan;
  // the limb of a sphere of radius R seen from distance D is at Z = R² / D
  const limb = (RADIUS * s) ** 2 / CAM_Z;
  const front = clamp01((Z - limb) / (RADIUS * s * 0.35));
  return {
    x: (ndcX * 0.5 + 0.5) * width,
    y: (0.5 - ndcY * 0.5) * height,
    front,
    scale: (height * 0.5) / (tan * depth),
  };
};

/** Screen px per km on the ground at a point (ignores foreshortening near the limb). */
export const pxPerKm = (at: GlobeLonLat, view: GlobeView, width = W, height = H) =>
  (project(at[0], at[1], view, width, height).scale * RADIUS * view.scale) / EARTH_KM;

/**
 * The view at `scale` that puts `at` on screen point `screen` (px), e.g. to
 * line a globe up under a flat map whose subject is off-centre. Solved by a few
 * Newton steps on `project`; exact to a fraction of a pixel when the point is
 * well in front.
 */
export const placeAt = (at: GlobeLonLat, screen: readonly [number, number], scale: number, width = W, height = H): GlobeView => {
  const view: GlobeView = {lon: at[0], lat: at[1], scale};
  for (let i = 0; i < 8; i++) {
    const q = project(at[0], at[1], view, width, height);
    const ex = screen[0] - q.x;
    const ey = screen[1] - q.y;
    if (Math.abs(ex) + Math.abs(ey) < 0.05) break;
    const k = pxPerKm(at, view, width, height) * 111.32; // px per degree of latitude
    view.lon -= ex / (k * Math.max(0.05, Math.cos(rad(view.lat))));
    view.lat = Math.max(-89, Math.min(89, view.lat + ey / k));
  }
  return view;
};

/**
 * Apparent radius of the sphere on screen, px. Not RADIUS × scale × px/unit:
 * in perspective the limb sits slightly inside the geometric radius
 * (angular radius = asin(R / D)).
 */
export const sphereRadiusPx = (scale: number, height = H): number => {
  const r = RADIUS * scale;
  if (r >= CAM_Z) return height;
  const theta = Math.asin(r / CAM_Z);
  return (Math.tan(theta) / Math.tan(rad(FOV) / 2)) * (height / 2);
};

/** Inverse of `sphereRadiusPx`: the scale that makes the disc `r` px in apparent radius. */
export const scaleForRadiusPx = (r: number, height = H): number => {
  const theta = Math.atan((r * 2 * Math.tan(rad(FOV) / 2)) / height);
  return (CAM_Z * Math.sin(theta)) / RADIUS;
};

/**
 * The scale at which the ground at the centre of the disc spans `spanKm`
 * across the frame width: match a flat map of known width to the globe.
 * Clamped to MAX_SCALE (about 250 km across a 1080 px frame).
 */
export const scaleForSpanKm = (spanKm: number, width = W, height = H): number => {
  const k = width / spanKm; // px per km wanted
  const a = ((height / 2) / Math.tan(rad(FOV) / 2)) * (RADIUS / EARTH_KM);
  return Math.min(MAX_SCALE, (k * CAM_Z) / (a + k * RADIUS));
};

// ---------------------------------------------------------------------------
// Sphere geometry helpers (geographic frame, unit vectors)
// ---------------------------------------------------------------------------

export const toVec = (lon: number, lat: number): [number, number, number] => {
  const a = rad(lon);
  const b = rad(lat);
  return [Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)];
};

export const toLonLat = ([x, y, z]: readonly [number, number, number]): [number, number] => {
  const n = Math.hypot(x, y, z) || 1;
  return [deg(Math.atan2(y, x)), deg(Math.asin(Math.max(-1, Math.min(1, z / n))))];
};

/** Great-circle distance between two points, km. */
export const globeDistanceKm = (a: GlobeLonLat, b: GlobeLonLat) => {
  const va = toVec(a[0], a[1]);
  const vb = toVec(b[0], b[1]);
  const dot = Math.max(-1, Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  return Math.acos(dot) * EARTH_KM;
};

/**
 * Rotate a lon/lat by `deg` along the meridian `alongLon` (Rodrigues about the
 * equatorial axis 90° away). A rigid rotation of the sphere: distances and
 * areas are preserved, unlike adding to the latitude, which stretches shapes
 * toward the pole the way Mercator does.
 */
export const slideOnSphere = (lon: number, lat: number, alongLon: number, degrees: number): [number, number] => {
  const t = rad(degrees);
  const k: [number, number, number] = [-Math.sin(rad(alongLon)), Math.cos(rad(alongLon)), 0];
  const v = toVec(lon, lat);
  const kv = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  const kxv: [number, number, number] = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
  const c = Math.cos(t);
  const s = Math.sin(t);
  return toLonLat([
    v[0] * c + kxv[0] * s + k[0] * kv * (1 - c),
    v[1] * c + kxv[1] * s + k[1] * kv * (1 - c),
    v[2] * c + kxv[2] * s + k[2] * kv * (1 - c),
  ]);
};

// ---------------------------------------------------------------------------
// The sphere
// ---------------------------------------------------------------------------

/**
 * Load an equirectangular texture under `public/` once, holding the render
 * until it is decoded. A missing file fails the render loudly instead of
 * drawing a blank sphere.
 */
const useSphereTexture = (src: string | null) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [handle] = useState(() => (src ? delayRender(`loading globe texture ${src}`, {timeoutInMilliseconds: 60_000}) : null));
  useEffect(() => {
    if (!src || handle === null) return;
    let cancelled = false;
    new THREE.TextureLoader().load(
      staticFile(src),
      (tex) => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        setTexture(tex);
        continueRender(handle);
      },
      undefined,
      () => cancelRender(new Error(`Globe: could not load texture public/${src}`)),
    );
    return () => {
      cancelled = true;
    };
  }, [handle, src]);
  return texture;
};

const Sphere: React.FC<{texture: THREE.Texture | null; solid?: string; view: GlobeView; palette: Palette; atmosphere: number}> = ({
  texture,
  solid,
  view,
  palette,
  atmosphere,
}) => {
  const [rx, ry] = facing(view.lon, view.lat);
  return (
    <group rotation={[rx, ry, 0]} scale={Math.min(MAX_SCALE, view.scale)}>
      <mesh>
        <sphereGeometry args={[RADIUS, 128, 96]} />
        {solid ? (
          // A flat colour has no detail to carry the shading: the terminator is
          // the only cue that it is a sphere, so keep it dim and rough.
          <meshStandardMaterial color={solid} roughness={0.95} metalness={0} emissive={solid} emissiveIntensity={0.02} />
        ) : (
          <meshStandardMaterial map={texture ?? undefined} roughness={0.85} metalness={0.02} emissive={palette.accent} emissiveIntensity={0.05} />
        )}
      </mesh>
      {atmosphere > 0 ? (
        // thin atmosphere: a slightly larger back-facing shell
        <mesh scale={1.035}>
          <sphereGeometry args={[RADIUS, 64, 48]} />
          <meshBasicMaterial color={palette.accentSoft} transparent opacity={atmosphere} side={THREE.BackSide} />
        </mesh>
      ) : null}
    </group>
  );
};

/**
 * The globe itself: a transparent WebGL canvas with the textured sphere. Put a
 * backdrop (gradient, Stars) behind it and markers (GlobePin, GlobeLine) on top,
 * all fed the same `view`.
 */
export const Globe: React.FC<{
  view: GlobeView;
  width?: number;
  height?: number;
  /** Equirectangular texture under `public/`. Default: Earth (Blue Marble). */
  texture?: string;
  /** Flat colour instead of a texture (skips the texture load). */
  solid?: string;
  palette?: Palette;
  /** Opacity of the atmosphere rim, 0 = off. */
  atmosphere?: number;
  style?: React.CSSProperties;
}> = ({view, width = W, height = H, texture: src = EARTH_TEXTURE, solid, palette = DEFAULT_PALETTE, atmosphere = 0.1, style}) => {
  const texture = useSphereTexture(solid ? null : src);
  // Mount the canvas only once the texture is decoded. While rendering, the
  // canvas repaints only when the frame changes, so a sphere that arrived
  // later on the same frame would be missing from that frame's screenshot.
  if (!solid && !texture) return null;
  return (
    <ThreeCanvas width={width} height={height} style={{position: "absolute", left: 0, top: 0, background: "transparent", ...style}} camera={{fov: FOV, position: [0, 0, CAM_Z]}}>
      <ambientLight intensity={1.35} />
      <directionalLight position={[4, 3, 6]} intensity={2.4} />
      <pointLight position={[-7, -3, 4]} intensity={70} color={palette.accent} />
      <Sphere texture={texture} solid={solid} view={view} palette={palette} atmosphere={atmosphere} />
    </ThreeCanvas>
  );
};

/** Globe plus a screen-space overlay locked to it, on a deep-space gradient. */
export const GlobeStage: React.FC<{
  view: GlobeView;
  width?: number;
  height?: number;
  texture?: string;
  palette?: Palette;
  /** Drawn behind the sphere (e.g. `<Stars horizon={H} />`). */
  backdrop?: React.ReactNode;
  children?: React.ReactNode;
}> = ({view, width = W, height = H, texture, palette = DEFAULT_PALETTE, backdrop, children}) => (
  <AbsoluteFill style={{background: spaceBackground(palette)}}>
    {backdrop}
    <Globe width={width} height={height} view={view} texture={texture} palette={palette} />
    <AbsoluteFill style={{pointerEvents: "none"}}>{children}</AbsoluteFill>
  </AbsoluteFill>
);

/** The default background behind a globe: a soft glow on the palette's bg. */
export const spaceBackground = (palette: Palette = DEFAULT_PALETTE) =>
  `radial-gradient(ellipse 90% 60% at 50% 45%, ${palette.surface} 0%, ${palette.bg} 70%)`;

// ---------------------------------------------------------------------------
// Markers
// ---------------------------------------------------------------------------

/**
 * A dot pinned to a lon/lat, fading out round the limb, with an optional label
 * beside it. The dot's centre is exactly on the coordinate; the label sits to
 * the right, or to the left when the dot is on the right half (so it is not
 * clipped or hidden under the platform's right rail).
 */
export const GlobePin: React.FC<{
  at: GlobeLonLat;
  view: GlobeView;
  width?: number;
  height?: number;
  label?: string;
  /** Smaller second line under the label. */
  sub?: string;
  tone?: string;
  /** Dot diameter, px. */
  size?: number;
  /** 0..1 reveal, so a list of pins can pop on one at a time. */
  on?: number;
  /** Ring of this radius on the ground, km (e.g. a 370 km zone). */
  haloKm?: number;
  /** Force the label side; default picks by screen half. */
  side?: "left" | "right";
  palette?: Palette;
  fontSize?: number;
}> = ({at, view, width = W, height = H, label, sub, tone, size = 15, on = 1, haloKm, side, palette = DEFAULT_PALETTE, fontSize = 32}) => {
  const color = tone ?? palette.accent;
  const p = project(at[0], at[1], view, width, height);
  const alpha = p.front * clamp01(on);
  if (alpha <= 0.01) return null;
  const pop = Math.min(1, on * 1.6);
  const d = size * pop;
  const left = (side ?? (p.x > width * 0.52 ? "left" : "right")) === "left";
  const kmPx = haloKm ? (haloKm / EARTH_KM) * RADIUS * view.scale * p.scale * pop : 0;
  const shadow = "0 0 3px #000, 0 0 3px #000, 0 2px 10px rgba(0,0,0,0.95)";
  return (
    <div style={{position: "absolute", left: p.x, top: p.y, width: 0, height: 0, opacity: alpha, pointerEvents: "none"}}>
      {haloKm ? (
        <span
          style={{
            position: "absolute",
            left: -kmPx,
            top: -kmPx,
            width: kmPx * 2,
            height: kmPx * 2,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color}88 0%, ${color}44 55%, ${color}00 100%)`,
            border: `3px solid ${color}AA`,
            boxSizing: "border-box",
          }}
        />
      ) : null}
      <span
        style={{
          position: "absolute",
          left: -d / 2,
          top: -d / 2,
          width: d,
          height: d,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 0 ${size * 0.35}px ${color}44, 0 0 ${size}px ${color}, 0 2px 8px rgba(0,0,0,0.9)`,
        }}
      />
      {label ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            [left ? "right" : "left"]: size / 2 + 14,
            transform: "translateY(-50%)",
            textAlign: left ? "right" : "left",
            whiteSpace: "nowrap",
            fontFamily: FONT.sans,
            textShadow: shadow,
            opacity: clamp01(on * 2 - 0.4),
          }}
        >
          <div style={{fontSize, fontWeight: 800, letterSpacing: 0.3, color: palette.text}}>{label}</div>
          {sub ? <div style={{fontSize: fontSize * 0.7, fontWeight: 600, color: palette.accentSoft, marginTop: 2}}>{sub}</div> : null}
        </div>
      ) : null}
    </div>
  );
};

export type Ring = readonly GlobeLonLat[];

/**
 * Closed lon/lat rings drawn on the globe (country outline, a zone), in screen
 * space. Points behind the limb are dropped; frame shots so a polygon is either
 * facing the camera or not. `slide` first moves the whole ring along a
 * meridian with `slideOnSphere`, so a size comparison stays honest.
 */
export const GlobePoly: React.FC<{
  rings: readonly Ring[];
  view: GlobeView;
  width?: number;
  height?: number;
  tone?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  opacity?: number;
  glow?: boolean;
  /** [alongLon, degrees]: a rigid rotation, so the area on screen is honest. */
  slide?: readonly [number, number];
  palette?: Palette;
}> = ({rings, view, width = W, height = H, tone, fillOpacity = 0.3, strokeWidth = 4, opacity = 1, glow = true, slide, palette = DEFAULT_PALETTE}) => {
  const id = svgId(useId(), "globe-poly");
  if (opacity <= 0.004) return null;
  const color = tone ?? palette.accent;
  const paths: string[] = [];
  for (const ring of rings) {
    let run: string[] = [];
    for (const [lon0, lat0] of ring) {
      const [lon, lat] = slide ? slideOnSphere(lon0, lat0, slide[0], slide[1]) : [lon0, lat0];
      const p = project(lon, lat, view, width, height);
      if (p.front <= 0) {
        if (run.length > 2) paths.push(`M${run.join("L")}Z`);
        run = [];
        continue;
      }
      run.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    if (run.length > 2) paths.push(`M${run.join("L")}Z`);
  }
  if (!paths.length) return null;
  const d = paths.join("");
  return (
    <svg width={width} height={height} style={{position: "absolute", inset: 0, opacity, pointerEvents: "none"}}>
      <defs>
        <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={strokeWidth * 1.6} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={d} fill={color} fillOpacity={fillOpacity} fillRule="evenodd" />
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" filter={glow ? `url(#${id})` : undefined} />
    </svg>
  );
};
