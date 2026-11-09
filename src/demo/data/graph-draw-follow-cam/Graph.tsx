import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {enter} from "../../shared/motion/anim";
import {ramp} from "../../shared/map/bits";
import {FONT} from "../../shared/theme";
import {INK} from "./ink";
import {shotById, type ShotId} from "./timing";

/**
 * Mori's 1970 graph, drawn as a diagram, not a measurement.
 * It climbs slowly, peaks where things look very human, drops below 0, then rises again
 * to the real human at the right-hand peak, the highest point of the line.
 * Coordinates are px of a 1000x1000 box; the camera in `scenes.tsx` places this box on screen.
 */

export const BOX = 1000;
const X0 = 120;
const X1 = 940;
export const ZERO_Y = 600;
const UNIT = 330;

const PEAK_X = 0.7;
const BOTTOM_X = 0.83;
const PEAK_Y = 0.56;
const BOTTOM_Y = -0.62;
const END_Y = 1;

const ss = (u: number) => u * u * (3 - 2 * u);

/** Affinity as a function of human likeness, both in 0..1 (vertical can go negative). */
const curve = (peak: number, bottom: number, end: number) => (x: number) => {
  if (x <= PEAK_X) {
    const u = x / PEAK_X;
    return peak * (0.4 * u + 0.6 * ss(u));
  }
  if (x <= BOTTOM_X) return peak + (bottom - peak) * ss((x - PEAK_X) / (BOTTOM_X - PEAK_X));
  return bottom + (end - bottom) * ss((x - BOTTOM_X) / (1 - BOTTOM_X));
};
const affinity = curve(PEAK_Y, BOTTOM_Y, END_Y);
/** Line for things that move: Mori drew a higher peak and a deeper valley. Still a sketch. */
const moving = curve(0.8, -0.92, 1.12);

type Pt = [number, number];
const toPx = (x: number, y: number): Pt => [X0 + x * (X1 - X0), ZERO_Y - y * UNIT];

const N = 320;
const PTS: Pt[] = Array.from({length: N + 1}, (_, i) => toPx(i / N, affinity(i / N)));
const MOVE_PTS: Pt[] = Array.from({length: N + 1}, (_, i) => toPx(i / N, moving(i / N)));
const MOVE_PATH_LEN = MOVE_PTS.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - MOVE_PTS[i][0], p[1] - MOVE_PTS[i][1]), 0);
const CUM: number[] = [0];
for (let i = 1; i < PTS.length; i++) {
  CUM.push(CUM[i - 1] + Math.hypot(PTS[i][0] - PTS[i - 1][0], PTS[i][1] - PTS[i - 1][1]));
}
const indexAt = (x: number) => Math.round(x * N);
export const TOTAL = CUM[N];
const CLIMB = CUM[indexAt(PEAK_X)];
const DIP_AT = CUM[indexAt(BOTTOM_X)];

export const PEAK = PTS[indexAt(PEAK_X)];
export const BOTTOM = PTS[indexAt(BOTTOM_X)];
export const END = PTS[N];

const pathOf = (pts: Pt[]) => pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
const FULL_PATH = pathOf(PTS);
const MOVE_PATH = pathOf(MOVE_PTS);
const MOVE_BOTTOM = MOVE_PTS[Math.round(BOTTOM_X * N)];
/** Three Mori points placed on the still line. */
const SPOTS = {
  robot: PTS[Math.round(0.08 * N)],
  hand: PTS[Math.round(BOTTOM_X * N)],
  puppet: PTS[Math.round(0.62 * N)],
};
const VALLEY_PTS = PTS.slice(indexAt(PEAK_X), indexAt(BOTTOM_X) + 1);
const VALLEY_PATH = pathOf(VALLEY_PTS);
/** The part of the line below the horizontal axis: the negative-affinity region. */
const BELOW = PTS.filter((p) => p[1] > ZERO_Y);
const BELOW_PATH = `${pathOf(BELOW)} L ${BELOW[BELOW.length - 1][0]} ${ZERO_Y} L ${BELOW[0][0]} ${ZERO_Y} Z`;

/** Point on the line at arc length `len`. */
export const pointAt = (len: number): Pt => {
  const target = Math.max(0, Math.min(TOTAL, len));
  let lo = 0;
  let hi = N;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (CUM[mid] < target) lo = mid;
    else hi = mid;
  }
  const seg = CUM[hi] - CUM[lo] || 1;
  const k = (target - CUM[lo]) / seg;
  return [PTS[lo][0] + (PTS[hi][0] - PTS[lo][0]) * k, PTS[lo][1] + (PTS[hi][1] - PTS[lo][1]) * k];
};

const during = (frame: number, id: ShotId, a: number, b: number, tail = 1) => {
  const shot = shotById(id);
  return interpolate(ramp(frame, shot.start, shot.start + shot.duration * tail), [0, 1], [a, b]);
};

/** Length of line drawn at frame `frame`. */
export const drawnAt = (frame: number) => {
  const len = shotById("len");
  const xuong = shotById("xuong");
  const named = shotById("do");
  const lai = shotById("lai");
  if (frame < len.start) return 0;
  if (frame < xuong.start) return during(frame, "len", 0, CLIMB, 0.92);
  if (frame < named.start) return during(frame, "xuong", CLIMB, DIP_AT, 0.85);
  if (frame < lai.start) return DIP_AT;
  return during(frame, "lai", DIP_AT, TOTAL, 0.95);
};

const label = {fontFamily: FONT.sans, fontWeight: 800} as const;

const Badge = ({x, y, text, color, opacity, dashed = false}: {x: number; y: number; text: string; color: string; opacity: number; dashed?: boolean}) => {
  const w = text.length * 21 + 44;
  return (
    <g opacity={opacity} transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-34} width={w} height={64} rx={32} fill="rgba(4,18,26,0.85)" stroke={color} strokeWidth={3} strokeDasharray={dashed ? "10 8" : undefined} />
      <text x={0} y={10} textAnchor="middle" fill={color} fontSize={34} {...label}>
        {text}
      </text>
    </g>
  );
};

/** One Mori point placed on the line, with its name. */
const Spot = ({at, label: text, dx, dy, anchor, t}: {at: Pt; label: string; dx: number; dy: number; anchor: "start" | "middle"; t: number}) => (
  <g opacity={t}>
    <line x1={at[0]} y1={at[1]} x2={at[0] + dx} y2={at[1] + dy - 12 * Math.sign(dy)} stroke={INK.warn} strokeWidth={3} strokeDasharray="5 5" />
    <circle cx={at[0]} cy={at[1]} r={interpolate(t, [0, 1], [4, 13])} fill={INK.warn} />
    <text x={at[0] + dx} y={at[1] + dy} textAnchor={anchor} fill={INK.warn} fontSize={36} fontFamily={FONT.sans} fontWeight={800}>
      {text}
    </text>
  </g>
);

/** Small round inset pinned to the line: a real picture placed exactly at its spot on the graph. */
const Inset = ({
  at,
  r,
  ring,
  opacity,
  scale,
  children,
}: {
  at: Pt;
  r: number;
  ring: string;
  opacity: number;
  scale: number;
  children: React.ReactNode;
}) => (
  <div
    style={{
      position: "absolute",
      left: at[0] - r,
      top: at[1] - r,
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      overflow: "hidden",
      border: `5px solid ${ring}`,
      boxShadow: `0 0 34px ${ring}66, 0 10px 30px rgba(0,0,0,0.6)`,
      opacity,
      transform: `scale(${scale})`,
    }}
  >
    {children}
  </div>
);

export const Graph = () => {
  const frame = useCurrentFrame();
  const len = shotById("len");
  const xuong = shotById("xuong");
  const named = shotById("do");
  const that = shotById("that");
  const phac = shotById("phac");
  const co = shotById("co");
  const rb = shotById("rb");
  const tg = shotById("tg");
  const bk = shotById("bk");
  const dongShot = shotById("dong");
  const sau = shotById("sau");
  const xac = shotById("xac");
  const khong = shotById("khong");

  const drawn = drawnAt(frame);
  const tip = pointAt(drawn);
  const drawing = frame >= len.start && frame < that.start && drawn < TOTAL - 1;
  const axes = enter(frame, len.start);

  // The falling segment: turns red when it is named, glows again on "some people see it", goes dashed on "some people do not".
  const named0 = frame >= named.start ? enter(frame, named.start).opacity : 0;
  const coGlow = frame >= co.start && frame < khong.start ? 0.5 + 0.5 * Math.sin((frame - co.start) / 3.2) : 0;
  const doubt = frame >= khong.start ? ramp(frame, khong.start, khong.start + 24) : 0;
  const flicker = frame >= khong.start ? 0.55 + 0.45 * Math.abs(Math.sin((frame - khong.start) * 0.9) * Math.sin((frame - khong.start) * 0.37)) : 1;

  // The sketch: hand-drawn wobbly stroke from the phac scene onward.
  const sketch = frame >= phac.start ? ramp(frame, phac.start, phac.start + 20) : 0;
  const seed = Math.floor(frame / 4) % 50;

  const dip = enter(frame, xuong.start + Math.round(xuong.duration * 0.85));
  const real = enter(frame, that.start);
  const stamp1 = enter(frame, phac.start + 6, 14);
  const badge1 = enter(frame, co.start + 4);
  const badge2 = enter(frame, khong.start + 4);

  return (
    <div style={{position: "relative", width: BOX, height: BOX}}>
      <svg viewBox={`0 0 ${BOX} ${BOX}`} width={BOX} height={BOX} style={{position: "absolute", inset: 0, overflow: "visible"}}>
        <defs>
          <filter id="pencil" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={seed} />
            <feDisplacementMap in="SourceGraphic" scale={7 * sketch} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={9} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrow" viewBox="0 0 10 10" refX={5} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={INK.axis} />
          </marker>
        </defs>

        <g opacity={axes.opacity}>
          <line x1={X0} y1={940} x2={X0} y2={200} stroke={INK.axis} strokeWidth={3} markerEnd="url(#arrow)" />
          <line x1={X0} y1={ZERO_Y} x2={X1 + 30} y2={ZERO_Y} stroke={INK.axis} strokeWidth={3} markerEnd="url(#arrow)" />
          <text x={X0 + 22} y={222} fill={INK.text} fontSize={42} {...label}>
            gần gũi
          </text>
          <text x={680} y={ZERO_Y + 56} textAnchor="end" fill={INK.text} fontSize={42} {...label}>
            giống người →
          </text>
          <text x={X0 - 18} y={ZERO_Y + 12} textAnchor="end" fill={INK.axis} fontSize={30} {...label}>
            0
          </text>
        </g>

        <g filter={sketch > 0 ? "url(#pencil)" : undefined}>
          {frame >= named.start ? (
            <path d={BELOW_PATH} fill={INK.dip} opacity={0.16 * named0 * (1 - doubt * 0.7)} />
          ) : null}
          <path
            d={FULL_PATH}
            stroke={INK.text}
            strokeWidth={7}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={TOTAL}
            strokeDashoffset={TOTAL - drawn}
          />
          {frame >= named.start ? (
            <g opacity={named0 * flicker}>
              <path
                d={VALLEY_PATH}
                stroke={doubt > 0.5 ? INK.axis : INK.dip}
                strokeWidth={12 + coGlow * 6}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={doubt > 0.5 ? "22 18" : undefined}
                filter="url(#glow)"
              />
              <text
                x={PEAK[0]}
                y={PEAK[1] - 52}
                textAnchor="middle"
                fill={INK.dip}
                fontSize={46}
                {...label}
                opacity={1 - doubt * 0.5}
              >
                thung lũng kỳ lạ
              </text>
            </g>
          ) : null}
        </g>

        {frame >= xuong.start ? (
          <line x1={DIP_AT_PX[0] + 80} y1={DIP_AT_PX[1] - 10} x2={BOTTOM[0] - 10} y2={BOTTOM[1] - 4} stroke={INK.dip} strokeWidth={3} strokeDasharray="6 6" opacity={dip.opacity * (1 - doubt * 0.4)} />
        ) : null}
        {frame >= rb.start ? (
          <g opacity={1 - ramp(frame, dongShot.start, dongShot.start + 12)}>
            <Spot at={SPOTS.robot} label="robot công nghiệp" dx={10} dy={110} anchor="start" t={enter(frame, rb.start + 4).opacity} />
            {frame >= tg.start ? <Spot at={SPOTS.hand} label="tay giả" dx={34} dy={66} anchor="start" t={enter(frame, tg.start + 2).opacity} /> : null}
            {frame >= bk.start ? <Spot at={SPOTS.puppet} label="rối bunraku" dx={-10} dy={92} anchor="middle" t={enter(frame, bk.start + 2).opacity} /> : null}
          </g>
        ) : null}
        {frame >= dongShot.start ? (
          <g opacity={1 - ramp(frame, co.start, co.start + 12)}>
            <path
              d={MOVE_PATH}
              stroke={INK.accent}
              strokeWidth={6}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${MOVE_PATH_LEN}`}
              strokeDashoffset={MOVE_PATH_LEN * (1 - ramp(frame, dongShot.start, dongShot.start + dongShot.duration * 0.95))}
              opacity={0.95}
            />
            <g opacity={enter(frame, dongShot.start + 6).opacity} fontSize={32} {...label}>
              <line x1={X0 + 40} y1={272} x2={X0 + 90} y2={272} stroke={INK.text} strokeWidth={6} />
              <text x={X0 + 104} y={283} fill={INK.text}>đứng yên</text>
              <line x1={X0 + 300} y1={272} x2={X0 + 350} y2={272} stroke={INK.accent} strokeWidth={6} />
              <text x={X0 + 364} y={283} fill={INK.accent}>có cử động</text>
            </g>
            {frame >= sau.start ? (
              <g opacity={0.5 + 0.5 * Math.sin((frame - sau.start) / 3.5)}>
                <circle cx={MOVE_BOTTOM[0]} cy={MOVE_BOTTOM[1]} r={14} fill={INK.accent} />
              </g>
            ) : null}
            {frame >= xac.start ? (
              <g opacity={enter(frame, xac.start + 2).opacity}>
                <circle cx={MOVE_BOTTOM[0]} cy={MOVE_BOTTOM[1]} r={12} fill={INK.accent} />
                <text x={MOVE_BOTTOM[0] - 20} y={MOVE_BOTTOM[1] + 64} textAnchor="middle" fill={INK.accent} fontSize={36} {...label}>
                  người chết cử động
                </text>
              </g>
            ) : null}
          </g>
        ) : null}

        {drawing ? (
          <g>
            <circle cx={tip[0]} cy={tip[1]} r={22} fill={INK.text} opacity={0.18} />
            <circle cx={tip[0]} cy={tip[1]} r={11} fill={INK.text} />
          </g>
        ) : null}

        {frame >= that.start ? (
          <g opacity={real.opacity}>
            <line x1={REAL_AT[0] + 60} y1={REAL_AT[1] + 30} x2={END[0] - 8} y2={END[1] - 4} stroke={MAP_GOOD} strokeWidth={3} strokeDasharray="6 6" />
            <text x={REAL_AT[0]} y={REAL_AT[1] + 112} textAnchor="middle" fill={MAP_GOOD} fontSize={36} {...label}>
              người thật
            </text>
          </g>
        ) : null}

        {frame >= phac.start ? (
          <g opacity={stamp1.opacity * (1 - ramp(frame, rb.start, rb.start + 10))} transform={`translate(${X0 + 40} ${128}) rotate(-3) scale(${interpolate(stamp1.opacity, [0, 1], [1.25, 1])})`}>
            <text x={0} y={0} fill={INK.text} fontSize={40} {...label} fontStyle="italic">
              bản phác tay, Mori 1970
            </text>
            <line x1={0} y1={16} x2={interpolate(stamp1.opacity, [0, 1], [0, 470])} y2={20} stroke={INK.text} strokeWidth={3} strokeLinecap="round" />
          </g>
        ) : null}

        {frame >= co.start ? <Badge x={300} y={700} text="có người thấy" color={MAP_GOOD} opacity={badge1.opacity * (frame >= khong.start ? 0.55 : 1)} /> : null}
        {frame >= khong.start ? <Badge x={300} y={800} text="có người không thấy" color={INK.axis} opacity={badge2.opacity} dashed /> : null}
      </svg>

      {frame >= xuong.start ? (
        <Inset at={DIP_AT_PX} r={78} ring={INK.dip} opacity={dip.opacity * (1 - doubt * 0.4)} scale={interpolate(dip.opacity, [0, 1], [0.6, 1])}>
          <AbsoluteFill style={{filter: "blur(7px) brightness(1.1)", transform: "scale(1.35)"}}>
            <Img
              src={staticFile("stills/nikki-tall.jpg")}
              style={{position: "absolute", width: 360, height: 640, left: -20, top: -320, objectFit: "cover"}}
            />
          </AbsoluteFill>
        </Inset>
      ) : null}
      {frame >= that.start ? (
        <Inset at={REAL_AT} r={64} ring={MAP_GOOD} opacity={real.opacity} scale={interpolate(real.opacity, [0, 1], [0.6, 1])}>
          <Img
            src={staticFile("stills/smile.jpg")}
            style={{position: "absolute", width: 190, height: 338, left: -31, top: -64, objectFit: "cover"}}
          />
        </Inset>
      ) : null}
    </div>
  );
};

const MAP_GOOD = INK.good;
/** The real-human inset sits left of the right-hand peak, clear of the steep stroke and the valley label. */
const REAL_AT: Pt = [790, 190];
/** Her face inset sits left of the valley floor, so it does not slip under the caption band when the camera zooms. */
const DIP_AT_PX: Pt = [630, 810];
