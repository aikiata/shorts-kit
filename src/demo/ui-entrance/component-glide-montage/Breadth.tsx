import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Chart, Sparkline } from "@/registry/knowns/ui/knowns/chart/chart";
import { PLANE } from "./tvc";
import { FPS, clamp } from "./motion";

/** Real Chart and Sparkline blocks (static, deterministic React) on a plane, with a frame-driven reveal: the line draws in left to right. */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const SERIES = [
  { key: "runs", label: "Agent runs", color: "#a99bff" },
  { key: "approved", label: "Approved", color: "#34d399" },
];
const DATA = DAYS.map((d, i) => ({ day: `${d} ${i + 1}`, runs: Math.round(40 + i * 9 + Math.sin(i * 1.3) * 12), approved: Math.round(30 + i * 8 + Math.cos(i * 0.9) * 9) }));
const SPARKS: { label: string; values: number[]; color: string }[] = [
  { label: "Runs", values: [3, 5, 4, 7, 6, 9, 8, 12, 11, 15], color: "#a99bff" },
  { label: "Approvals", values: [2, 3, 3, 5, 4, 6, 7, 7, 9, 11], color: "#34d399" },
  { label: "Credits used", values: [9, 8, 9, 7, 8, 6, 6, 5, 5, 4], color: "#fb923c" },
];

export function ChartPanel({ accent = "#a99bff", second = "#34d399" }: { accent?: string; second?: string }) {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [4, 4 + FPS * 1.1], [0, 1], { ...clamp });
  return (
    <div className="dark text-foreground" style={{ width: PLANE.w, height: PLANE.h, background: "#0a0a10", borderRadius: 18, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 300px", gap: 28, padding: 32, ["--background" as string]: "#0a0a10" }}>
      <div style={{ clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)` }}>
        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Agent runs, last 12 days</div>
        <Chart type="area" smooth data={DATA} x="day" series={[{ ...SERIES[0], color: accent }, { ...SERIES[1], color: second }]} label="Agent runs and approvals" height={380} formatX={(s) => s.split(" ")[0]} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, justifyContent: "center" }}>
        {SPARKS.map((s, i) => (
          <div key={s.label} style={{ border: "1px solid #ffffff1a", borderRadius: 14, padding: 16, background: "#101018", opacity: interpolate(frame, [8 + i * 5, 16 + i * 5], [0, 1], clamp) }}>
            <div style={{ fontSize: 15, color: "#a1a1b5" }}>{s.label}</div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 6 }}>
              <div style={{ fontSize: 40, fontWeight: 650, letterSpacing: "-0.03em" }}>{Math.round(s.values[s.values.length - 1] * interpolate(frame, [8 + i * 5, 36 + i * 5], [0, 1], clamp))}</div>
              <Sparkline values={s.values} color={i === 0 ? accent : i === 1 ? second : s.color} area endDot smooth width={130} height={44} label={s.label} />
            </div>
          </div>
        ))}
      </div>
      <AbsoluteFill style={{ pointerEvents: "none" }} />
    </div>
  );
}

/* ------------------------------------------------------------------------------ captured sequences */
import { Img, staticFile } from "remotion";
import manifest from "./breadth.generated.json";

type SeqInfo = { name: string; frames: number; ext: string; digits: number; first: number; w: number; h: number; crop: { x: number; y: number; w: number; h: number } };
export const SEQS: Record<string, SeqInfo> = Object.fromEntries((manifest as unknown as SeqInfo[]).map((m) => [m.name, m]));
export const hasSeq = (n: string) => !!SEQS[n];

/** A frame sequence of a real component (captured at 30 fps with a virtual clock, transparent PNGs), cropped to the component and
 *  shown at `height` px with a violet glow; loops ping-pong if the clip is shorter than the shot. */
export function SeqPanel({ name, height = 600, maxW = 1700, offset = 0, grade = "", layers = 1 }: { name: string; height?: number; maxW?: number; offset?: number; grade?: string; layers?: number }) {
  const frame = useCurrentFrame() + offset;
  const s = SEQS[name];
  const span = s.frames - 1;
  const c = span > 0 ? frame % (2 * span) : 0;
  const j = Math.min(span, c <= span ? c : 2 * span - c);
  const file = String(s.first + j).padStart(s.digits, "0");
  const h = Math.min(height, (maxW * s.crop.h) / s.crop.w);
  const k = h / s.crop.h;
  return (
    <div style={{ width: s.crop.w * k, height: h, position: "relative", overflow: "hidden", filter: `${grade} drop-shadow(0 0 40px #a99bff88)`.trim() }}>
      {/* `layers` stacks the same frame, which multiplies its alpha: a way to lift a very faint capture */}
      {Array.from({ length: layers }, (_, i) => (
        <Img key={i} src={staticFile(`breadth-seq/${name}/${file}.${s.ext}`)} style={{ position: "absolute", left: -s.crop.x * k, top: -s.crop.y * k, width: s.w * k, height: s.h * k, maxWidth: "none", maxHeight: "none" }} />
      ))}
    </div>
  );
}

/** An opaque full-frame backdrop sequence (aurora, cube field, gradient floor), cover-fitted. */
export function SeqBackdrop({ name, dim = 0.3 }: { name: string; dim?: number }) {
  const frame = useCurrentFrame();
  const s = SEQS[name];
  const span = s.frames - 1;
  const c = frame % (2 * span);
  const j = Math.min(span, c <= span ? c : 2 * span - c);
  const file = String(s.first + j).padStart(s.digits, "0");
  return (
    <AbsoluteFill>
      <Img src={staticFile(`breadth-seq/${name}/${file}.${s.ext}`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", maxWidth: "none", maxHeight: "none", objectFit: "cover" }} />
      <AbsoluteFill style={{ background: `rgba(7,7,12,${dim})` }} />
    </AbsoluteFill>
  );
}
