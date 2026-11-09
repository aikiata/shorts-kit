/**
 * shorts-kit preview UI, built from Knowns UI (./kn/, https://ui.knowns.dev, MIT). Read-only: every status
 * comes from /api/*, which infers it from files on disk. Polls every 5 s; no websockets.
 */
import {useCallback, useEffect, useMemo, useRef, useState, type ReactNode} from "react";
import {createRoot} from "react-dom/client";
import logoUrl from "../../docs/assets/logo.svg";
import {Markdown} from "./markdown";
import {ArrowLeft, Chat, Check, Close, Code, Copy, GitHub, Globe, Refresh, Users} from "./icons";
import {Alert} from "./kn/ui/knowns/alert";
import {Badge, type BadgeTone} from "./kn/ui/knowns/badge";
import {GridPattern} from "./kn/ui/knowns/blocks/backgrounds/grid-pattern";
import {Button, buttonClass} from "./kn/ui/knowns/button";
import {Card as KCard, CardContent, CardHeader, CardTitle} from "./kn/ui/knowns/card";
import {Input} from "./kn/ui/knowns/input";
import {Progress as KProgress} from "./kn/ui/knowns/progress";
import {SegmentedControl} from "./kn/ui/knowns/segmented-control";
import {Select} from "./kn/ui/knowns/select";
import {Spinner} from "./kn/ui/knowns/spinner";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "./kn/ui/knowns/tabs";
import {Tooltip} from "./kn/ui/knowns/tooltip";
import {TraceWaterfall} from "./kn/ui/knowns/trace-waterfall/trace-waterfall";
import type {Actor, Span} from "./kn/lib/knowns/types";
import {cn as cx} from "./kn/lib/knowns/utils";

/** Copy to the clipboard; `copied` stays true for 1.5 s. */
const useClipboard = () => {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, []);
  return {copied, copy};
};

// ── types (mirror scripts/preview.ts) ──────────────────────────────────────
type Status = "done" | "todo" | "warn" | "fail" | "unknown";
type Format = "portrait" | "landscape";
type Mode = "short" | "promo";
type Deliverable = {name: string; file: NonNullable<FileInfo>; master: boolean; seconds: number | null; format: Format; label: string};
type PromoInfo = {
  bpm: number | null;
  seconds: number;
  scenes: {id: string; start: number; end: number; beats: number | null}[];
  music: {src: string; file: FileInfo} | null;
  lines: {id: string; text: string; scene: string; at: number; seconds: number | null; stale: boolean; audio: FileInfo; only: string[] | null}[];
};
type Step = {key: string; n: number; label: string; status: Status; detail: string; command: string; skill: string};
type Next = {key: string; label: string; command: string; skill: string; detail: string};
type FileInfo = {path: string; size: number; mtime: number} | null;
type VideoRow =
  | {id: string; kind: "video"; flow: string | null; format?: Format; mode?: Mode; cuts?: number; steps: Step[]; next: Next; created?: number}
  | {id: string; kind: "gallery"; label: string; command: string};
type StatusResponse = {root: string; at: number; lan: boolean; videos: VideoRow[]};
type Lint = {at: number; code: number; timedOut: boolean; errors: number | null; warnings: number | null; output: string; ms: number};
type VideoState = {
  id: string;
  flow: string | null;
  format: Format;
  mode: Mode;
  promo: PromoInfo | null;
  deliverables: Deliverable[];
  steps: Step[];
  next: Next;
  files: {render: FileInfo; loud: FileInfo; upload: FileInfo; cover: FileInfo; coverJpg: FileInfo; caption: FileInfo; pinned: FileInfo; stills: NonNullable<FileInfo>[]; voiceJson: FileInfo; narrationJson: FileInfo; storyboard?: FileInfo; brief: FileInfo};
  voice: null | {engine: string | null; estimated: boolean; duration: number | null; words: number | null; lines: number | null; scenes: {id: string; start: number; end: number}[]; audio: FileInfo};
  lint: Lint | null;
  lintRunning: boolean;
};
type Probe = {file: string; size: number; error?: string; video?: Record<string, unknown>; audio?: Record<string, unknown>; faststart: boolean | null; duration: number | null; checks: {name: string; ok: boolean; value: string; want: string}[]};

// ── token: ?t= once, kept for this tab; the server also sets a cookie ─────
const TOKEN = (() => {
  const t = new URLSearchParams(location.search).get("t");
  if (t) sessionStorage.setItem("sk-preview-token", t);
  return t ?? sessionStorage.getItem("sk-preview-token");
})();
const api = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers: Record<string, string> = {...(init.headers as Record<string, string>)};
  if (TOKEN) headers["x-preview-token"] = TOKEN;
  const r = await fetch(path, {...init, headers, cache: "no-store"});
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json() as Promise<T>;
};
/** URL of a project file, cache-busted by mtime so a re-render shows up. */
const fileUrl = (f: NonNullable<FileInfo>) => {
  const q = new URLSearchParams({v: String(Math.round(f.mtime))});
  if (TOKEN) q.set("t", TOKEN);
  return `/file/${f.path.split("/").map(encodeURIComponent).join("/")}?${q}`;
};

// ── hooks ─────────────────────────────────────────────────────────────────
const usePoll = <T,>(path: string | null, ms = 5000) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [at, setAt] = useState<number | null>(null);
  const last = useRef("");
  const load = useCallback(async () => {
    if (!path) return;
    try {
      const d = await api<T>(path);
      const s = JSON.stringify(d);
      // only re-render when something changed: keeps players and scroll steady
      if (s !== last.current) {
        last.current = s;
        setData(d);
      }
      setError(null);
      setAt(Date.now());
    } catch (e) {
      setError((e as Error).message);
    }
  }, [path]);
  useEffect(() => {
    last.current = "";
    setData(null);
    load();
    const t = setInterval(load, ms);
    return () => clearInterval(t);
  }, [load, ms]);
  return {data, error, at, reload: load};
};

const useHashRoute = () => {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const f = () => setHash(location.hash);
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  const m = /^#\/v\/([a-z0-9-]+)/.exec(hash);
  return m ? {page: "video" as const, id: m[1]} : {page: "home" as const, id: null};
};

// ── formatting ────────────────────────────────────────────────────────────
const mb = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} kB`);
const ago = (t: number) => {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(t).toLocaleString();
};
/** Tailwind aspect class for a video's canvas (video.json "format"). */
const aspectOf = (f: Format | undefined) => (f === "landscape" ? "aspect-video" : "aspect-[9/16]");
const secs = (n: number | null | undefined) => (typeof n === "number" ? `${n.toFixed(1)} s` : "n/a");

const STATUS_TONE: Record<Status, BadgeTone> = {done: "success", todo: "neutral", warn: "warning", fail: "danger", unknown: "info"};
const STATUS_WORD: Record<Status, string> = {done: "done", todo: "to do", warn: "check", fail: "failed", unknown: "unknown"};

// ── small pieces ──────────────────────────────────────────────────────────
const CopyButton = ({text, label = "Copy"}: {text: string; label?: string}) => {
  const {copied, copy} = useClipboard();
  return (
    <Button size="sm" variant="secondary" icon={copied ? <Check /> : <Copy />} onClick={() => copy(text)}>
      {copied ? "Copied" : label}
    </Button>
  );
};

const Command = ({cmd}: {cmd: string}) => {
  const {copied, copy} = useClipboard();
  return (
    <div className="flex min-w-0 items-center gap-1 rounded-lg border bg-muted/40 py-1 pr-1 pl-3">
      <span className="font-mono text-[13px] text-muted-foreground select-none">$</span>
      <code className="min-w-0 flex-1 py-1 font-mono text-[13px] break-words whitespace-pre-wrap text-foreground">{cmd}</code>
      <Tooltip content={copied ? "Copied" : "Copy command"}>
        <Button size="xs" variant="ghost" aria-label="Copy command" icon={copied ? <Check /> : <Copy />} onClick={() => copy(cmd.replace(/\s+#.*$/, ""))} />
      </Tooltip>
    </div>
  );
};

const Card = ({title, actions, children, className}: {title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string}) => (
  <KCard className={cx("min-w-0 text-sm", className)}>
    {(title || actions) && (
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 pb-2">
        {title && <CardTitle className="flex items-center gap-2">{title}</CardTitle>}
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </CardHeader>
    )}
    <CardContent className={cx(!(title || actions) && "pt-5")}>{children}</CardContent>
  </KCard>
);

const Loading = ({label}: {label: string}) => (
  <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
    <Spinner className="size-4" label={label} />
    {label}
  </div>
);

const StepChip = ({step}: {step: Step}) => (
  <Tooltip content={`${step.n}. ${step.label}: ${STATUS_WORD[step.status]}`} description={step.detail}>
    <Badge size="sm" tone={STATUS_TONE[step.status]} dot>
      {step.label}
    </Badge>
  </Tooltip>
);

const NextStep = ({next}: {next: Next}) => (
  <div className="rounded-xl border bg-muted/30 p-3">
    <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
      <span className="font-semibold text-indigo-300">Next: {next.label}</span>
      <span className="text-muted-foreground">· {next.skill}</span>
    </div>
    {next.detail && <p className="mb-2 text-sm text-muted-foreground">{next.detail}</p>}
    <Command cmd={next.command} />
  </div>
);

const Progress = ({steps}: {steps: Step[]}) => {
  const done = steps.filter((s) => s.status === "done" || s.status === "warn").length;
  return <KProgress aria-label="Pipeline progress" value={done} max={Math.max(1, steps.length)} tone="accent" format={() => `${done}/${steps.length}`} />;
};

// ── home ──────────────────────────────────────────────────────────────────
type Filter = "all" | "active" | "attention" | "ready";
type Sort = "newest" | "oldest" | "name" | "progress";
const FILTERS: {id: Filter; label: string}[] = [
  {id: "all", label: "All"},
  {id: "active", label: "In progress"},
  {id: "attention", label: "Needs attention"},
  {id: "ready", label: "Ready to upload"},
];
const SORTS: {id: Sort; label: string}[] = [
  {id: "newest", label: "Newest"},
  {id: "oldest", label: "Oldest"},
  {id: "name", label: "Name"},
  {id: "progress", label: "Progress"},
];
type VideoOnly = Extract<VideoRow, {kind: "video"}>;
const doneShare = (v: VideoOnly) => (v.steps.length ? v.steps.filter((x) => x.status === "done").length / v.steps.length : 0);
/** Three groups that never overlap: something wrong first, then all done, then the rest. */
const groupOf = (v: VideoOnly): Exclude<Filter, "all"> =>
  v.steps.some((x) => x.status === "fail" || x.status === "warn") ? "attention" : v.steps.length && v.steps.every((x) => x.status === "done") ? "ready" : "active";
const matches = (v: VideoOnly, f: Filter) => f === "all" || groupOf(v) === f;

/** Home filters live in the URL hash (#/?q=…&f=…&s=…), so a reload or a shared link keeps them. */
const useHomeParams = () => {
  const read = () => new URLSearchParams(location.hash.split("?")[1] ?? "");
  const [p, setP] = useState(read);
  useEffect(() => {
    const f = () => setP(read());
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  const set = (k: string, val: string, dflt: string) => {
    const next = read();
    if (val === dflt) next.delete(k); else next.set(k, val);
    const qs = next.toString();
    history.replaceState(null, "", `#/${qs ? `?${qs}` : ""}`);
    setP(next);
  };
  return {q: p.get("q") ?? "", f: (p.get("f") as Filter) ?? "all", s: (p.get("s") as Sort) ?? "newest", view: p.get("v") === "compact" ? "compact" : "cards", set};
};

const Home = () => {
  const {data, error, at} = usePoll<StatusResponse>("/api/status");
  const {q, f, s, view, set} = useHomeParams();
  const all = data?.videos ?? [];
  const videos = all.filter((v): v is VideoOnly => v.kind === "video");
  const gallery = all.filter((v) => v.kind === "gallery");
  const needle = q.trim().toLowerCase();
  const shown = videos
    .filter((v) => matches(v, f))
    .filter((v) => !needle || v.id.includes(needle) || (v.flow ?? "").toLowerCase().includes(needle))
    .sort((a, b) =>
      s === "name" ? a.id.localeCompare(b.id)
      : s === "oldest" ? (a.created ?? 0) - (b.created ?? 0)
      : s === "progress" ? doneShare(b) - doneShare(a) || (b.created ?? 0) - (a.created ?? 0)
      : (b.created ?? 0) - (a.created ?? 0));
  const count = (x: Filter) => videos.filter((v) => matches(v, x)).length;
  return (
    <Shell at={at} error={error}>
      {!data && !error && <Loading label="Reading the project…" />}
      {data && videos.length === 0 && (
        <Card>
          <p className="text-muted-foreground">No videos yet. Start one with:</p>
          <div className="mt-2">
            <Command cmd="bun run new <id> --flow <X>" />
          </div>
        </Card>
      )}
      {videos.length > 0 && (
        <div className="mb-4 grid grid-cols-[minmax(0,1fr)] gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input type="search" value={q} onChange={(e) => set("q", e.target.value, "")} placeholder={`Search ${videos.length} videos by id or flow`} className="min-w-0 flex-1 basis-64" />
            <Select aria-label="Sort" value={s} onChange={(e) => set("s", e.target.value, "newest")} options={SORTS.map((x) => ({value: x.id, label: `Sort: ${x.label}`}))} className="w-44" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* scrolls sideways on a phone instead of squeezing the labels */}
            <div className="w-full min-w-0 overflow-x-auto sm:w-auto">
            <SegmentedControl
              className="w-max"
              aria-label="Filter videos"
              value={f}
              onValueChange={(x) => set("f", x, "all")}
              options={FILTERS.map((x) => ({value: x.id, label: <span>{x.label} <span className="ml-1 tabular-nums text-muted-foreground">{count(x.id)}</span></span>}))}
            />
            </div>
            <span className="ml-auto">
              <SegmentedControl aria-label="Layout" value={view} onValueChange={(x) => set("v", x, "cards")} options={[{value: "cards", label: "Cards"}, {value: "compact", label: "Compact"}]} />
            </span>
          </div>
        </div>
      )}
      {videos.length > 0 && shown.length === 0 && <p className="mb-4 text-sm text-muted-foreground">No video matches. Clear the search or pick another filter.</p>}
      {view === "compact" && shown.length > 0 && (
        <Card>
          <ul className="grid grid-cols-[minmax(0,1fr)]">
            {shown.map((v) => {
              const done = v.steps.filter((x) => x.status === "done").length;
              const g = groupOf(v);
              return (
                <li key={v.id} className="border-b last:border-0">
                  <a href={`#/v/${v.id}`} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-3 rounded-md px-2 py-2.5 hover:bg-muted/50">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-semibold">{v.id}</span>
                      {v.mode === "promo" && <Badge size="sm" tone="accent">promo</Badge>}
                      <Badge size="sm" tone={g === "ready" ? "success" : g === "attention" ? "warning" : "neutral"}>{g === "ready" ? "ready" : g === "attention" ? "check" : "in progress"}</Badge>
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <KProgress className="flex-1" size="sm" tone="accent" aria-label={`${v.id} progress`} value={done} max={Math.max(1, v.steps.length)} format={() => `${done}/${v.steps.length}`} />
                    </span>
                    <span className="flex min-w-0 items-center justify-end gap-2 text-xs text-muted-foreground">
                      <span className="truncate">next: {v.next.label}</span>
                      {v.created ? <span className="shrink-0 tabular-nums text-muted-foreground/70">{new Date(v.created).toLocaleDateString()}</span> : null}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <div className="grid gap-4">
        {view === "cards" && shown.map((v) => (
          <Card
            key={v.id}
            title={
              <a href={`#/v/${v.id}`} className="flex items-center gap-2 hover:underline">
                {v.id}
                {v.flow && <Badge size="sm" variant="outline">flow {v.flow}</Badge>}
                {v.mode === "promo" && <Badge size="sm" tone="accent">promo</Badge>}
                {v.format === "landscape" && <Badge size="sm" variant="outline">16:9</Badge>}
                {!!v.cuts && <Badge size="sm" variant="outline">{v.cuts} cut{v.cuts > 1 ? "s" : ""}</Badge>}
                {v.created ? <span className="text-xs font-normal text-muted-foreground">{new Date(v.created).toLocaleDateString()}</span> : null}
              </a>
            }
            actions={<a className={buttonClass("secondary", "sm")} href={`#/v/${v.id}`}>Open</a>}
          >
            <div className="grid gap-3">
              <Progress steps={v.steps} />
              <div className="flex flex-wrap gap-1.5">
                {v.steps.map((st) => (
                  <StepChip key={st.key} step={st} />
                ))}
              </div>
              <NextStep next={v.next} />
            </div>
          </Card>
        ))}
        {f === "all" && !needle && gallery.map((v) => v.kind === "gallery" && (
          <Card key={v.id} title={<span className="flex items-center gap-2">{v.id}<Badge size="sm" tone="accent">component gallery</Badge></span>}>
            <p className="mb-2 text-sm text-muted-foreground">Every shared component on one timeline. Not a video: no pipeline steps.</p>
            <Command cmd={v.command} />
          </Card>
        ))}
      </div>
    </Shell>
  );
};

// ── video page ────────────────────────────────────────────────────────────
const Lightbox = ({src, onClose}: {src: string; onClose: () => void}) => {
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", f);
    return () => removeEventListener("keydown", f);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <img src={src} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
      <div className="absolute top-3 right-3">
        <Button variant="secondary" aria-label="Close" icon={<Close />} onClick={onClose} />
      </div>
    </div>
  );
};

const Stat = ({label, value}: {label: string; value: ReactNode}) => (
  <div className="rounded-xl border bg-muted/30 px-3 py-2">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold tracking-tight tabular-nums">{value}</div>
  </div>
);

/** The deliverables of a video (master + cuts) as a picker; returns the chosen one. */
const useDeliverable = (v: VideoState) => {
  const [pick, setPick] = useState<string | null>(null);
  const chosen = v.deliverables.find((d) => d.name === pick) ?? v.deliverables[0] ?? null;
  return {chosen, setPick};
};

const DeliverablePicker = ({v, chosen, onPick}: {v: VideoState; chosen: Deliverable | null; onPick: (name: string) => void}) =>
  v.deliverables.length > 1 ? (
    <div className="-mx-1 overflow-x-auto px-1">
    <SegmentedControl
      size="sm"
      aria-label="Deliverable"
      value={chosen?.name ?? ""}
      onValueChange={onPick}
      options={v.deliverables.map((d) => ({value: d.name, label: d.format !== v.format ? `${d.label} · ${d.format === "landscape" ? "16:9" : "9:16"}` : d.label}))}
    />
    </div>
  ) : null;

/** A promo's clock: scenes on a bar to scale, BPM, music; and its spoken lines (docs/promo/). */
const PromoCards = ({v}: {v: VideoState}) => {
  const p = v.promo!;
  const total = Math.max(p.seconds, 0.001);
  return (
    <>
      <Card title="Clock" actions={<Badge size="sm" variant="outline">promo.json</Badge>}>
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Length" value={secs(p.seconds)} />
          <Stat label="Scenes" value={p.scenes.length} />
          <Stat label="BPM" value={p.bpm ?? "n/a"} />
          <Stat label="Voice lines" value={p.lines.length} />
        </div>
        <div className="mb-3 flex h-7 w-full overflow-hidden rounded-lg border" aria-label="Scenes to scale">
          {p.scenes.map((s, i) => (
            <div
              key={s.id}
              title={`${s.id}: ${s.start.toFixed(1)}–${s.end.toFixed(1)} s${s.beats ? `, ${s.beats} beats` : ""}`}
              className={cx("flex min-w-0 shrink-0 items-center justify-center overflow-hidden border-r px-1 text-[11px] whitespace-nowrap text-muted-foreground last:border-r-0", i % 2 ? "bg-muted/30" : "bg-muted/60")}
              style={{width: `${((s.end - s.start) / total) * 100}%`}}
            >
              <span className="truncate">{s.id}</span>
            </div>
          ))}
        </div>
        <ul className="grid gap-1 text-sm">
          {p.scenes.map((s) => (
            <li key={s.id} className="flex justify-between gap-3 border-b py-1 last:border-0">
              <span className="truncate">{s.id}</span>
              <span className="text-muted-foreground tabular-nums">
                {s.beats ? `${s.beats} beats · ` : ""}
                {s.start.toFixed(1)}–{s.end.toFixed(1)} s
              </span>
            </li>
          ))}
        </ul>
        {p.music && (
          <div className="mt-3">
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              Music <code className="font-mono">public/{p.music.src}</code>
              {!p.music.file && <Badge size="sm" tone="warning">missing</Badge>}
            </div>
            {p.music.file && <audio src={fileUrl(p.music.file)} controls preload="metadata" className="w-full" />}
          </div>
        )}
      </Card>
      {p.lines.length > 0 && (
        <Card title="Voice lines" actions={<Badge size="sm" variant="outline">bun run voice {v.id}</Badge>}>
          <ol className="grid gap-2">
            {p.lines.map((l) => (
              <li key={l.id} className="rounded-xl border p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono font-semibold text-foreground">{l.id}</span>
                  <Badge size="sm" variant="outline">{l.scene}</Badge>
                  <span className="tabular-nums">at {l.at.toFixed(1)} s{l.seconds ? ` · ${l.seconds.toFixed(1)} s long` : ""}</span>
                  {l.only && <Badge size="sm" tone="accent">only in {l.only.join(", ")}</Badge>}
                  {!l.audio && <Badge size="sm" tone="warning">no audio</Badge>}
                  {l.stale && <Badge size="sm" tone="danger">text changed · re-run</Badge>}
                </div>
                <p className="mb-2 text-[15px]">{l.text}</p>
                {l.audio && <audio src={fileUrl(l.audio)} controls preload="none" className="h-9 w-full" />}
              </li>
            ))}
          </ol>
        </Card>
      )}
    </>
  );
};

const MediaTab = ({v}: {v: VideoState}) => {
  const [zoom, setZoom] = useState<string | null>(null);
  const {chosen, setPick} = useDeliverable(v);
  const best = chosen?.file ?? v.files.loud ?? v.files.render;
  const bestName = chosen ? (chosen.master ? "upload" : chosen.label) : best === v.files.loud ? "loudness-normalized" : "raw render";
  const shownFormat = chosen?.format ?? v.format;
  const voice = v.voice;
  const wide = v.format === "landscape";
  return (
    <div className={cx("grid gap-4", wide ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]" : "lg:grid-cols-[minmax(0,360px)_1fr]")}>
      <div className="grid min-w-0 content-start gap-4">
        <Card title="Video" actions={best && <Badge size="sm" tone={chosen ? "success" : "warning"}>{bestName}</Badge>}>
          <div className="mb-3">
            <DeliverablePicker v={v} chosen={chosen} onPick={setPick} />
          </div>
          {best ? (
            <>
              <video key={`${best.path}:${best.mtime}`} src={fileUrl(best)} controls playsInline preload="metadata" className={cx("w-full rounded-xl bg-black", aspectOf(shownFormat))} />
              <p className="mt-2 text-xs break-all text-muted-foreground">
                {best.path} · {mb(best.size)} · {ago(best.mtime)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No mp4 yet. Render with <code className="font-mono">bun run render {v.id}</code>.</p>
          )}
        </Card>
        {v.deliverables.length > 0 && (
          <Card title={`Deliverables (${v.deliverables.length})`}>
            <ul className="grid gap-1 text-sm">
              {v.deliverables.map((d) => (
                <li key={d.name} className="flex flex-wrap items-center justify-between gap-2 border-b py-1.5 last:border-0">
                  <span className="flex min-w-0 items-center gap-2">
                    <Badge size="sm" tone={d.master ? "accent" : "neutral"}>{d.label}</Badge>
                    <Badge size="sm" variant="outline">{d.format === "landscape" ? "16:9" : "9:16"}</Badge>
                    <span className="truncate font-mono text-xs text-muted-foreground">{d.name}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                    {mb(d.file.size)}
                    <a className={buttonClass("ghost", "xs")} href={fileUrl(d.file)} target="_blank" rel="noreferrer">Open</a>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Every <code className="font-mono">out/{v.id}/*-upload.mp4</code>. Cuts are named <code className="font-mono">{v.id}-&lt;len&gt;s-&lt;format&gt;-upload.mp4</code> (promo rule 15).</p>
          </Card>
        )}
      </div>

      <div className="grid min-w-0 content-start gap-4">
        {v.promo && <PromoCards v={v} />}
        {(!v.promo || voice) && (
        <Card title="Voice">
          {voice ? (
            <>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Duration" value={secs(voice.duration)} />
                <Stat label="Words" value={voice.words ?? "n/a"} />
                <Stat label="Lines" value={voice.lines ?? "n/a"} />
                <Stat label="Scenes" value={voice.scenes.length} />
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge size="sm" tone="neutral">engine: {voice.engine ?? "?"}</Badge>
                {voice.estimated && <Badge size="sm" tone="warning">estimated timing, no audio</Badge>}
              </div>
              {voice.audio ? (
                <audio key={`${voice.audio.path}:${voice.audio.mtime}`} src={fileUrl(voice.audio)} controls preload="metadata" className="w-full" />
              ) : (
                <p className="text-sm text-muted-foreground">No voice audio yet (bun run tts {v.id}).</p>
              )}
              {voice.scenes.length > 0 && (
                <ul className="mt-3 grid gap-1 text-sm">
                  {voice.scenes.map((s) => (
                    <li key={s.id} className="flex justify-between gap-3 border-b py-1 last:border-0">
                      <span className="truncate">{s.id}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {s.start.toFixed(1)}–{s.end.toFixed(1)} s
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No voice.json yet.</p>
          )}
        </Card>
        )}

        <Card title={`Stills (${v.files.stills.length})`}>
          {v.files.stills.length ? (
            <div className={cx("grid gap-2", wide ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-3 sm:grid-cols-4 xl:grid-cols-6")}>
              {v.files.stills.map((s) => (
                <button key={s.path} type="button" onClick={() => setZoom(fileUrl(s))} className="group overflow-hidden rounded-lg border outline-ring focus-visible:outline-2">
                  <img src={fileUrl(s)} alt={s.path} loading="lazy" className={cx("w-full object-cover transition group-hover:opacity-80", aspectOf(v.format))} />
                  <span className="block truncate px-1 py-0.5 text-xs text-muted-foreground">{s.path.split("/").pop()}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No stills yet (bun run still {v.id} --frame=&lt;n&gt;).</p>
          )}
        </Card>

        <Card title="Cover">
          {v.files.cover ? (
            <div className="flex flex-wrap items-start gap-4">
              <button type="button" onClick={() => setZoom(fileUrl(v.files.cover!))} className={cx("w-full overflow-hidden rounded-lg border", wide ? "max-w-[420px]" : "max-w-[270px]")}>
                <img src={fileUrl(v.files.cover)} alt="cover, full size" className="w-full" />
                <span className="block px-1 py-0.5 text-xs text-muted-foreground">full size (click to enlarge)</span>
              </button>
              {wide ? (
                <div>
                  {/* a 16:9 cover is shown whole in a feed or search list, about 240 px wide */}
                  <div className="aspect-video w-[240px] overflow-hidden rounded-md border">
                    <img src={fileUrl(v.files.cover)} alt="cover at list size" className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">240 px, as in a feed or search list. Is the title readable here?</p>
                </div>
              ) : (
                <div>
                  {/* the profile grid crops 1080×1920 to ~1:1.29 (263 px off top and bottom) and shows it ~200 px wide */}
                  <div className="w-[200px] overflow-hidden rounded-md border" style={{aspectRatio: "1 / 1.29"}}>
                    <img src={fileUrl(v.files.cover)} alt="cover at profile-grid size" className="h-full w-full object-cover object-center" />
                  </div>
                  <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">200 px, 1:1.29 profile-grid crop. Is the number readable here?</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No cover yet (bun run cover {v.id}).</p>
          )}
        </Card>
      </div>
      {zoom && <Lightbox src={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
};

const HandoffTab = ({v}: {v: VideoState}) => {
  const key = `${v.files.caption?.mtime}:${v.files.pinned?.mtime}`;
  const [texts, setTexts] = useState<{caption: string | null; pinned: string | null} | null>(null);
  useEffect(() => {
    api<{caption: string | null; pinned: string | null}>(`/api/text/${v.id}`).then(setTexts).catch(() => setTexts(null));
  }, [v.id, key]);
  const block = (title: string, name: string, body: string | null | undefined, hint: string) => (
    <Card title={title} actions={body ? <CopyButton text={body} /> : null}>
      {body ? (
        <pre className="max-h-96 overflow-auto rounded-lg bg-muted/40 p-3 font-mono text-sm whitespace-pre-wrap text-foreground/85 border">{body}</pre>
      ) : (
        <p className="text-sm text-muted-foreground">No out/{v.id}/{name} yet. {hint}</p>
      )}
      {body && <p className="mt-2 text-xs text-muted-foreground">{body.length} characters</p>}
    </Card>
  );
  return (
    <div className="grid gap-4">
      <Alert tone="warning" title="You upload by hand">
        The kit never publishes: copy the caption into the upload form, set the cover explicitly, and paste the pinned comment right after posting (that is where the credits live).
      </Alert>
      <div className="grid gap-4 lg:grid-cols-2">
        {block("Caption", "caption.txt", texts?.caption, "Written from the §11a template (sk-handoff).")}
        {block("Pinned comment", "pinned-comment.txt", texts?.pinned, "Extra fact + credits from the ledger (sk-handoff).")}
      </div>
      {v.files.upload && (
        <Card title="Upload file">
          <p className="text-sm break-all text-foreground/85">
            {v.files.upload.path} · {mb(v.files.upload.size)}
          </p>
          <div className="mt-2">
            <a className={buttonClass("secondary", "sm")} href={fileUrl(v.files.upload)} target="_blank" rel="noreferrer">Open the mp4</a>
          </div>
        </Card>
      )}
    </div>
  );
};

const ChecksTab = ({v, reload}: {v: VideoState; reload: () => void}) => {
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async () => {
    setRunning(true);
    setErr(null);
    try {
      await api(`/api/lint/${v.id}`, {method: "POST", headers: {"x-sk-preview": "1"}});
    } catch (e) {
      setErr((e as Error).message);
    }
    setRunning(false);
    reload();
  };
  const [probe, setProbe] = useState<{probe: Probe | null; message?: string} | null>(null);
  const [probing, setProbing] = useState(false);
  const {chosen, setPick} = useDeliverable(v);
  const up = chosen?.file ?? null;
  useEffect(() => {
    if (!up || !chosen) {
      setProbe(null);
      return;
    }
    setProbing(true);
    api<{probe: Probe | null; message?: string}>(`/api/probe/${v.id}?file=${encodeURIComponent(chosen.name)}`)
      .then(setProbe)
      .catch((e) => setProbe({probe: null, message: (e as Error).message}))
      .finally(() => setProbing(false));
  }, [v.id, chosen?.name, up?.mtime, up?.size]);
  const lint = v.lint;
  const lintStep = v.steps.find((s) => s.key === "lint");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card
        title="Lint"
        actions={
          <Button size="sm" variant="primary" icon={<Refresh />} loading={running || v.lintRunning} onClick={run}>
            Run lint
          </Button>
        }
      >
        <p className="mb-2 text-sm text-muted-foreground">
          Runs <code className="font-mono">bun run lint {v.id}</code> on demand (60 s timeout). Never runs on page load.
        </p>
        {err && <p className="mb-2 text-sm text-red-400">{err}</p>}
        {lint ? (
          <>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {lintStep && <Badge size="sm" dot tone={STATUS_TONE[lintStep.status]}>{lintStep.detail}</Badge>}
              <span className="text-xs text-muted-foreground">
                {ago(lint.at)} · {(lint.ms / 1000).toFixed(1)} s · exit {lint.code}
              </span>
            </div>
            <pre className="max-h-[28rem] overflow-auto rounded-lg bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap text-foreground/85 border">
              {lint.output.split("\n").map((l, i) => (
                <div key={i} className={cx(l.startsWith("error") || l.startsWith("✖") ? "text-red-400" : l.startsWith("warn") ? "text-amber-300" : undefined)}>
                  {l || " "}
                </div>
              ))}
            </pre>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Not run yet.</p>
        )}
      </Card>

      <Card title="Upload file (ffprobe)">
        <div className="mb-3">
          <DeliverablePicker v={v} chosen={chosen} onPick={setPick} />
        </div>
        {!up && <p className="text-sm text-muted-foreground">No out/{v.id}/{v.id}-upload.mp4 yet (bun run encode {v.id}).</p>}
        {up && probing && !probe && <Loading label="ffprobe…" />}
        {probe?.message && <p className="text-sm text-muted-foreground">{probe.message}</p>}
        {probe?.probe?.error && <p className="text-sm text-red-400">{probe.probe.error}</p>}
        {probe?.probe && !probe.probe.error && (
          <>
            <p className="mb-2 text-xs break-all text-muted-foreground">
              {probe.probe.file} · {mb(probe.probe.size)} · {secs(probe.probe.duration)}
              {probe.probe.video?.frames ? ` · ${probe.probe.video.frames} frames` : ""}
            </p>
            <table className="w-full text-sm">
              <tbody>
                {probe.probe.checks.map((c) => (
                  <tr key={c.name} className="border-b border-border last:border-0">
                    <td className="py-1.5 pr-2 text-muted-foreground">{c.name}</td>
                    <td className="py-1.5 pr-2 font-mono text-foreground/85">{c.value}</td>
                    <td className="py-1.5 text-right">
                      {c.ok ? <Badge size="sm" tone="success">ok</Badge> : <Tooltip content={`want ${c.want}`}><Badge size="sm" tone="danger">want {c.want}</Badge></Tooltip>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">Loudness is not measured here: check the `bun run normalize` output.</p>
          </>
        )}
      </Card>
    </div>
  );
};

// ── brief tab: the brief as written, read from briefs/<id>.md ─────────────
const BriefTab = ({v}: {v: VideoState}) => {
  const f = v.files.brief;
  const key = f ? `${f.path}:${f.mtime}` : "";
  const [body, setBody] = useState<string | null>(null);
  useEffect(() => {
    if (!f) { setBody(null); return; }
    fetch(fileUrl(f), {cache: "no-store"}).then((r) => (r.ok ? r.text() : null)).then(setBody).catch(() => setBody(null));
  }, [key]);
  if (!f) {
    const promo = v.mode === "promo";
    return (
      <Card title="Brief">
        <p className="mb-3 text-sm text-muted-foreground">No briefs/{v.id}.md yet. {promo ? "A promo brief holds the objective, the pain point, the concept routes, the treatment, the animatic and the deliverables (docs/promo/README.md rules 11–15)." : "The brief holds the idea in one sentence, the flow, the visuals per scene, the facts and the licences (sk-brief)."}</p>
        <Command cmd={`cp briefs/${promo ? "_template-promo" : "_template"}.md briefs/${v.id}.md`} />
      </Card>
    );
  }
  return (
    <Card title={<span className="font-mono text-sm">{f.path}</span>} actions={<span className="text-xs text-muted-foreground">edited {ago(f.mtime)}</span>}>
      {body === null ? <Loading label="Reading the brief…" /> : <div className="max-w-3xl"><Markdown text={body} /></div>}
    </Card>
  );
};

const StepsTab = ({v}: {v: VideoState}) => (
  <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,420px)]">
    <Card title="Pipeline (from disk)">
      <ol className="grid gap-1">
        {v.steps.map((s) => (
          <li key={s.key} className={cx("flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-2", s.key === v.next.key && "bg-indigo-400/10 ring-1 ring-indigo-400/50 ring-inset")}>
            <span className="w-6 text-right text-sm text-muted-foreground/70 tabular-nums">{s.n}</span>
            <span className="w-24 font-medium text-foreground">{s.label}</span>
            <Badge size="sm" dot tone={STATUS_TONE[s.status]}>{STATUS_WORD[s.status]}</Badge>
            <span className="min-w-0 flex-1 basis-48 text-sm text-muted-foreground">{s.detail}</span>
          </li>
        ))}
      </ol>
    </Card>
    <div className="grid content-start gap-4">
      <Card title="Next step">
        <NextStep next={v.next} />
      </Card>
      <Card title="Files">
        <ul className="grid gap-1 text-sm">
          {(
            [
              ["brief", v.files.brief],
              ["narration.json", v.files.narrationJson],
              ["voice.json", v.files.voiceJson],
              ["render", v.files.render],
              ["loud", v.files.loud],
              ["upload", v.files.upload],
              ["cover", v.files.cover],
            ] as [string, FileInfo][]
          ).map(([k, f]) => (
            <li key={k} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{k}</span>
              {f ? (
                <a className="truncate text-foreground/85 hover:underline" href={fileUrl(f)} target="_blank" rel="noreferrer">
                  {mb(f.size)} · {ago(f.mtime)}
                </a>
              ) : (
                <span className="text-muted-foreground/70">n/a</span>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  </div>
);

// ── script tab: narration text, timed against the voice ─────────────────
type VWord = {text: string; start: number; end: number; line: number};
type VLine = {scene: string; index: number; text: string; start: number; end: number};
type VoiceJson = {words?: VWord[]; lines?: VLine[]; audio?: string | null; estimated?: boolean};
type NarLine = {text: string; fact?: string | null; caption?: string};
type NarJson = {scenes?: {id: string; lines?: NarLine[]}[]};
type Fact = {id: string; claim: string; status: string};

const useJson = <T,>(f: FileInfo) => {
  const [data, setData] = useState<T | null>(null);
  const key = f ? `${f.path}:${f.mtime}` : "";
  useEffect(() => {
    if (!f) { setData(null); return; }
    fetch(fileUrl(f), {cache: "no-store"}).then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => setData(null));
  }, [key]);
  return data;
};

const FACTS_FILE = {path: "docs/facts/facts.json", size: 0, mtime: 0};

const ScriptTab = ({v}: {v: VideoState}) => {
  const voice = useJson<VoiceJson>(v.files.voiceJson);
  const nar = useJson<NarJson>(v.files.narrationJson);
  const facts = useJson<Fact[]>(FACTS_FILE);
  const audio = useRef<HTMLAudioElement>(null);
  const [t, setT] = useState(-1);
  useEffect(() => {
    let raf = 0;
    const loop = () => { const a = audio.current; if (a) setT(a.paused && a.currentTime === 0 ? -1 : a.currentTime); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  if (!nar && v.promo) return <div className="grid gap-4"><PromoCards v={v} /></div>;
  if (!nar) return <Card title="Script"><p className="text-sm text-muted-foreground">No narration.json yet.</p></Card>;
  const lines = voice?.lines ?? [];
  const words = voice?.words ?? [];
  const factOf = (id?: string | null) => (id ? facts?.find((f) => f.id === id) : undefined);
  const play = (start: number) => { const a = audio.current; if (!a) return; a.currentTime = Math.max(0, start - 0.05); void a.play(); };
  const real = !!v.voice?.audio && !voice?.estimated;
  const recorded = (v.voice as {engine?: string} | null)?.engine === "recorded";
  const lang = (nar as {language?: string}).language ?? "en";
  const wps = lang.startsWith("vi") ? 3.7 : 3.1;
  const narLines = (nar.scenes ?? []).flatMap((s) => s.lines ?? []);
  const countWords = (t: string) => t.split(/\s+/).filter(Boolean).length;
  const totalWords = narLines.reduce((n, l) => n + countWords(l.text), 0);
  const todo = narLines.filter((l) => /TODO/.test(l.text)).length;
  const missing = narLines.filter((l) => l.fact && !factOf(l.fact)).length;
  let g = -1;
  return (
    <div className="grid gap-4">
      <Card title="Script">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Badge size="sm" tone="neutral">{narLines.length} lines · {totalWords} words</Badge>
        <Badge size="sm" tone={real ? "success" : "warning"}>{real ? `voice ${(v.voice?.duration ?? 0).toFixed(1)} s` : `≈ ${(totalWords / wps).toFixed(0)} s estimated (${wps} words/s)`}</Badge>
        {todo > 0 && <Badge size="sm" tone="warning">{todo} TODO</Badge>}
        {missing > 0 && <Badge size="sm" tone="danger">{missing} missing fact{missing > 1 ? "s" : ""}</Badge>}
        {!real && <span className="text-muted-foreground">No voice yet: timings below are estimates from the text. Run <code className="font-mono">bun run tts {v.id}</code> to hear it.</span>}
      </div>
        {v.voice?.audio ? (
          <div className="sticky top-16 z-10 mb-4 rounded-xl bg-card/90 py-2 backdrop-blur">
            <audio ref={audio} key={`${v.voice.audio.path}:${v.voice.audio.mtime}`} src={fileUrl(v.voice.audio)} controls preload="metadata" className="w-full" />
            <p className="mt-1 text-xs text-muted-foreground">Click a line to play from it. The word being spoken is highlighted, so you can check the voice against the text.</p>
          </div>
        ) : null}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
          {(nar.scenes ?? []).map((s) => (
            <section key={s.id}>
              <h3 className="mb-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">{s.id}</h3>
              <ol className="grid grid-cols-[minmax(0,1fr)] gap-2">
                {(s.lines ?? []).map((l, i) => {
                  g += 1;
                  const gi = g;
                  const vl = lines[gi];
                  const lw = words.filter((w) => w.line === gi);
                  const active = !!vl && t >= vl.start && t < vl.end;
                  const fact = factOf(l.fact);
                  return (
                    <li key={i} className="min-w-0">
                      <button type="button" onClick={() => real && vl && play(vl.start)} className={cx("w-full min-w-0 overflow-hidden rounded-xl p-3 text-left ring-1 ring-inset transition", active ? "bg-indigo-400/10 ring-indigo-400/60" : /TODO/.test(l.text) ? "ring-amber-400/50" : "ring-border hover:bg-muted/50")}>
                        <p className="text-[15px] leading-relaxed text-foreground">
                          {(() => {
                            // Show the script as written (with punctuation); borrow each word's timing
                            // when the token count matches the timed words, which it does for plain text.
                            // A recorded voice has no script: show what was said (spelling applied).
                            const shown = recorded && vl ? vl.text : l.text;
                            const toks = shown.split(/\s+/).filter(Boolean);
                            if (!lw.length || toks.length !== lw.length) return shown;
                            return toks.map((tok, k) => {
                              const w = lw[k];
                              const on = t >= w.start && t < w.end;
                              return (
                                <span key={k}>
                                  <span className={cx("rounded-sm", on && "bg-indigo-500 text-white shadow-[0_0_0_2px_var(--color-indigo-500)]")}>{tok}</span>{k < toks.length - 1 ? " " : ""}
                                </span>
                              );
                            });
                          })()}
                        </p>
                        {recorded && vl && vl.text !== l.text && <p className="mt-1 text-xs text-muted-foreground/70">Whisper heard: {l.text}</p>}
                        {l.caption && <p className="mt-1 text-sm text-muted-foreground">{l.caption}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {real && vl ? <span className="tabular-nums">{vl.start.toFixed(1)}–{vl.end.toFixed(1)} s</span> : <span className="tabular-nums">≈ {(countWords(l.text) / wps).toFixed(1)} s</span>}
                          <span>{l.text.split(/\s+/).filter(Boolean).length} words</span>
                          {l.fact ? (
                            <Badge size="sm" tone={fact?.status === "verified" ? "success" : fact ? "warning" : "danger"}>{l.fact}{fact ? ` · ${fact.status}` : " · missing"}</Badge>
                          ) : (
                            <Badge size="sm" tone="neutral">no fact</Badge>
                          )}
                          {fact && <span className="min-w-0 flex-1 basis-60 truncate" title={fact.claim}>{fact.claim}</span>}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ── storyboard tab: the shot list, reviewed before scene code ──────────────
type SbShot = {id: string; line: number; scene?: string; beat?: number; seconds?: number; lineText?: string; anchor?: string | null; size?: string; angle?: string; card?: string; camera: string; onScreen: string; text?: string | null; visual?: string; transition?: string; sfx?: string | null; notes?: string; status: "planned" | "approved" | "built"};
type SbJson = {shots?: SbShot[]};
const FPS_UI = 30;
const norm = (x: string) => x.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}%]+/gu, "");

/** A frame cut from the current render at time `at` (seconds), cache-busted by the mp4's mtime. */
const frameUrl = (id: string, at: number, mtime: number) => {
  const q = new URLSearchParams({at: at.toFixed(1), v: String(Math.round(mtime))});
  if (TOKEN) q.set("t", TOKEN);
  return `/api/frame/${id}?${q}`;
};

const StoryboardTab = ({v}: {v: VideoState}) => {
  const sb = useJson<SbJson>(v.files.storyboard ?? null);
  const voice = useJson<VoiceJson>(v.files.voiceJson);
  const nar = useJson<NarJson>(v.files.narrationJson);
  const mp4 = v.files.upload ?? v.files.loud ?? v.files.render;
  const media = useRef<HTMLMediaElement | null>(null);
  const [t, setT] = useState(-1);
  useEffect(() => {
    let raf = 0;
    const loop = () => { const a = media.current; if (a) setT(a.paused && a.currentTime === 0 ? -1 : a.currentTime); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  if (!v.files.storyboard) {
    return (
      <Card title="Storyboard">
        <p className="mb-3 text-sm text-foreground/85">No storyboard yet. {v.promo && !v.files.narrationJson ? "Plan every shot per scene and beat of promo.json" : "After the voice exists, plan every shot"} (camera, what is on screen, on-frame text, transition, sfx) and get it approved before building scenes.</p>
        <Command cmd={`bun run storyboard ${v.id} --init`} />
        <p className="mt-3 text-xs text-muted-foreground">Schema and rules: docs/storyboard.md</p>
      </Card>
    );
  }
  if (!sb) return <Card title="Storyboard"><Loading label="Reading storyboard.json…" /></Card>;
  const vlines = voice?.lines ?? [];
  // What the viewer sees: the caption text from voice.json (spelling applied), not the raw
  // script or Whisper's transcript. Before a real voice exists, the script as written.
  const narFlat = (nar?.scenes ?? []).flatMap((s) => (s.lines ?? []).map((l) => ({scene: s.id, text: l.text})));
  const lineTexts = narFlat.map((l, i) => ({...l, text: vlines[i]?.text ?? l.text}));
  const words = voice?.words ?? [];
  const real = !!voice && !voice.estimated;
  const shots = sb.shots ?? [];
  const promoShots = !!v.promo && !v.files.narrationJson;
  const startOf = (s: SbShot): number | null => {
    if (promoShots) {
      const sc = v.promo!.scenes.find((x) => x.id === s.scene);
      if (!sc) return null;
      return sc.start + (s.beat !== undefined && v.promo!.bpm ? (s.beat * 60) / v.promo!.bpm : (s.seconds ?? 0));
    }
    const l = vlines[s.line];
    if (!l) return null;
    if (!s.anchor) return l.start;
    const want = s.anchor.split(/\s+/).map(norm).filter(Boolean);
    const lw = words.filter((w) => w.line === s.line);
    for (let i = 0; i + want.length <= lw.length; i++) if (want.every((x, k) => norm(lw[i + k].text) === x)) return lw[i].start;
    return l.start;
  };
  const starts = shots.map(startOf);
  const total = promoShots ? v.promo!.seconds : (v.voice?.duration ?? 0) + ((nar as {outroHold?: number} | null)?.outroHold ?? 3);
  const endOf = (i: number) => starts.slice(i + 1).find((x) => x !== null) ?? total;
  const stillAt = (a: number, b: number) => {
    const all = v.files.stills.map((f) => ({f, frame: Number(/(\d+)\.(png|jpe?g)$/i.exec(f.path)?.[1] ?? NaN)})).filter((x) => !Number.isNaN(x.frame));
    const inside = all.filter((x) => x.frame / FPS_UI >= a && x.frame / FPS_UI < b);
    return inside.sort((x, y) => Math.abs(x.frame / FPS_UI - (a + b) / 2) - Math.abs(y.frame / FPS_UI - (a + b) / 2))[0]?.f ?? null;
  };
  const counts = {planned: shots.filter((x) => x.status === "planned").length, approved: shots.filter((x) => x.status === "approved").length, built: shots.filter((x) => x.status === "built").length};
  // three shots in a row at one size (docs/shots/sizes.md): mark each shot of such a run
  const inRun = new Set<string>();
  for (let i = 2; i < shots.length; i++) {
    const [a1, b1, c1] = [shots[i - 2], shots[i - 1], shots[i]];
    if (a1.size && a1.size !== "TODO" && a1.size === b1.size && b1.size === c1.size) [a1, b1, c1].forEach((x) => inRun.add(x.id));
  }
  const sizeless = shots.filter((x) => !x.size).length;
  const play = (at: number | null) => { const a = media.current; if (!a || at === null) return; a.currentTime = Math.max(0, at - 0.05); void a.play(); };
  const statusColor = {planned: "warning", approved: "accent", built: "success"} as const;
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-16 lg:self-start">
        <Card title="Playback">
          {mp4 ? (
            <video ref={(el) => { media.current = el; }} key={`${mp4.path}:${mp4.mtime}`} src={fileUrl(mp4)} controls preload="metadata" className="aspect-[9/16] w-full rounded-lg bg-black" />
          ) : v.voice?.audio ? (
            <audio ref={(el) => { media.current = el; }} key={`${v.voice.audio.path}:${v.voice.audio.mtime}`} src={fileUrl(v.voice.audio)} controls preload="metadata" className="w-full" />
          ) : (
            <p className="text-sm text-muted-foreground">No render or voice yet.</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Click a shot to play it. {mp4 ? "The render shows what each shot looks like now." : v.promo && !v.files.narrationJson ? "No render yet: render it to see each shot here." : "No render yet: you hear the voice the shot sits on."}</p>
        </Card>
      </div>
      <Card title="Storyboard">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <Badge size="sm" tone="neutral">{shots.length} shots</Badge>
          {counts.planned > 0 && <Badge size="sm" tone="warning">{counts.planned} planned</Badge>}
          {counts.approved > 0 && <Badge size="sm" tone="accent">{counts.approved} approved</Badge>}
          {counts.built > 0 && <Badge size="sm" tone="success">{counts.built} built</Badge>}
          {!real && !promoShots && <span className="text-muted-foreground">Timings are estimates until <code className="font-mono">bun run tts {v.id}</code>.</span>}
          <span className="text-muted-foreground">Check it in the terminal: <code className="font-mono">bun run storyboard {v.id}</code></span>
        </div>
        {(sizeless > 0 || inRun.size > 0) && (
          <Alert tone="info" className="mb-4" title="Size rhythm">
            {sizeless > 0 && <>{sizeless === shots.length ? "No shot has" : `${sizeless} shot${sizeless > 1 ? "s have" : " has"}`} a size (WS, MS, CU, ECU), so the rhythm cannot be checked. </>}
            {inRun.size > 0 && <>Shots marked <Badge size="sm" tone="warning">same size ×3</Badge> sit in a run of three at one size: change size at a beat. </>}
            See docs/shots/sizes.md.
          </Alert>
        )}
        {counts.planned > 0 && (
          <Alert tone="warning" className="mb-4" title="Waiting for your approval">
            {counts.planned} shot{counts.planned > 1 ? "s" : ""} waiting for your approval. The preview is read-only: tell your agent "approve s01 to s{String(shots.length).padStart(2, "0")}" (or name the shots to change), or set <code className="font-mono">status</code> to <code className="font-mono">approved</code> in <code className="font-mono">src/videos/{v.id}/storyboard.json</code>. Scenes are built only from approved shots.
          </Alert>
        )}
        {!mp4 && shots.some((x) => x.status !== "planned") && (
          <p className="mb-4 text-xs text-muted-foreground">A shot shows its still once one exists: <code className="font-mono">bun run still {v.id} --frame=N</code> (N is shown on each shot).</p>
        )}
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {shots.map((s, i) => {
            const a = starts[i];
            const b = endOf(i);
            const active = a !== null && t >= a && t < b;
            const still = a !== null ? stillAt(a, b) : null;
            const line = lineTexts[s.line];
            const todo = /TODO/.test(`${s.camera} ${s.onScreen}`);
            // The shot was planned against `lineText`; a different line now means the plan is stale.
            const changed = !!s.lineText && !!line && norm(s.lineText) !== norm(line.text);
            return (
              <li key={s.id} className="min-w-0">
                <button type="button" onClick={() => play(a)} className={cx("grid w-full min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-3 overflow-hidden rounded-xl p-3 text-left ring-1 ring-inset transition sm:grid-cols-[96px_minmax(0,1fr)]", active ? "bg-indigo-400/10 ring-indigo-400/60" : todo ? "ring-amber-400/50" : "ring-border hover:bg-muted/50")}>
                  <div className="aspect-[9/16] w-full overflow-hidden rounded-md bg-muted/40 border">
                    {mp4 && a !== null ? <img src={frameUrl(v.id, (a + b) / 2, mp4.mtime)} alt="" loading="lazy" className="h-full w-full object-cover" /> : still ? <img src={fileUrl(still)} alt="" className="h-full w-full object-cover" /> : (
                      <div className="flex h-full flex-col items-center justify-center gap-1 p-1 text-center text-[10px] leading-tight text-muted-foreground/70">
                        <span className="font-semibold text-muted-foreground">not built</span>
                        {a !== null && <span className="break-all font-mono">--frame={Math.round(((a + b) / 2) * FPS_UI)}</span>}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-foreground">{s.id}</span>
                      <Badge size="sm" tone={statusColor[s.status] ?? "neutral"}>{s.status}</Badge>
                      {s.size ? <Badge size="sm" variant="outline" tone={s.size === "TODO" ? "warning" : "neutral"}>{s.size}{s.angle && s.angle !== "eye" ? ` · ${s.angle}` : ""}</Badge> : <Badge size="sm" tone="warning">no size</Badge>}
                      {inRun.has(s.id) && <Badge size="sm" tone="warning">same size ×3</Badge>}
                      {s.card && <Badge size="sm" tone="accent">card: {s.card}</Badge>}
                      {changed && <Badge size="sm" tone="danger">line changed · bun run storyboard {v.id} --sync</Badge>}
                      {a !== null && <span className="text-muted-foreground tabular-nums">{a.toFixed(1)}–{b.toFixed(1)} s</span>}
                      {s.transition && <Badge size="sm" tone="neutral">{s.transition}</Badge>}
                      {s.visual && <Badge size="sm" tone="neutral">{s.visual}</Badge>}
                      {s.sfx && <Badge size="sm" tone="neutral">sfx: {s.sfx}</Badge>}
                    </div>
                    {promoShots ? (
                      <p className="mb-2 text-sm text-muted-foreground">scene <span className="font-mono text-foreground/85">{s.scene ?? "?"}</span>{s.beat !== undefined ? ` + ${s.beat} beats` : s.seconds ? ` + ${s.seconds} s` : ""}</p>
                    ) : (
                      <p className="mb-2 text-sm text-foreground/85 italic">“{line?.text ?? "(no such line)"}”{s.anchor && <span className="not-italic text-muted-foreground"> · from “{s.anchor}”</span>}</p>
                    )}
                    <dl className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-2 gap-y-1 text-sm">
                      <dt className="text-muted-foreground">Camera</dt><dd className="text-foreground">{s.camera}</dd>
                      <dt className="text-muted-foreground">Screen</dt><dd className="text-foreground">{s.onScreen}</dd>
                      {s.text && <><dt className="text-muted-foreground">Text</dt><dd className="font-mono text-xs text-foreground">{s.text}</dd></>}
                      {s.notes && <><dt className="text-muted-foreground">Notes</dt><dd className="text-foreground/85">{s.notes}</dd></>}
                    </dl>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
};

// ── timeline tab: scenes, lines, shots and music on one time axis (Knowns UI Trace Waterfall) ──
const ms = (s: number) => Math.round(s * 1000);
/** A row nests under the scene that is open when it starts, so a child starting with its scene is moved 1 ms in. */
const inside = (s: number) => Math.round(s * 1000) + 1;
const TimelineTab = ({v}: {v: VideoState}) => {
  const voice = useJson<VoiceJson>(v.files.voiceJson);
  const nar = useJson<NarJson>(v.files.narrationJson);
  const sb = useJson<SbJson>(v.files.storyboard ?? null);
  const facts = useJson<Fact[]>(FACTS_FILE);
  const data = useMemo(() => {
    const actors: Actor[] = [{id: "film", type: "human", label: v.id}];
    const spans: Span[] = [];
    const scene = (id: string, start: number, end: number, summary: string) => {
      actors.push({id: `scene:${id}`, type: "agent", label: id});
      spans.push({id: `sc-${id}`, from: "film", to: `scene:${id}`, startedAt: ms(start), endedAt: ms(Math.max(end, start + 0.05)), outcome: "success", summary});
    };
    if (v.promo) {
      // a promo: promo.json scenes, then each spoken line inside its scene, and the music under the whole film
      const p = v.promo;
      for (const s of p.scenes) scene(s.id, s.start, s.end, `${(s.end - s.start).toFixed(1)} s${s.beats ? ` · ${s.beats} beats` : ""}`);
      if (p.music) {
        actors.push({id: "music", type: "tool", label: "music"});
        spans.push({id: "music", from: "film", to: "music", startedAt: 0, endedAt: ms(p.seconds), outcome: p.music.file ? "success" : "failure", summary: `public/${p.music.src}`, ...(p.music.file ? {} : {error: "music file missing"})});
      }
      for (const l of p.lines) {
        const sc = p.scenes.find((s) => s.id === l.scene);
        // a line marked `only` for a cutdown is not in the master's timeline
        if (!sc || l.only) continue;
        const end = l.at + (l.seconds ?? 2);
        const problem = !l.audio ? `no audio: bun run voice ${v.id}` : l.stale ? `text changed since the audio was made: bun run voice ${v.id}` : null;
        actors.push({id: `line:${l.id}`, type: "tool", label: `line ${l.id}`});
        spans.push({id: `ln-${l.id}`, from: `scene:${l.scene}`, to: `line:${l.id}`, startedAt: inside(l.at), endedAt: ms(Math.min(end, sc.end)), outcome: problem ? "failure" : "success", summary: l.text, input: {text: l.text, scene: l.scene, at: `${l.at.toFixed(2)} s`}, ...(problem ? {error: problem} : {output: {seconds: l.seconds}})});
      }
      for (const [i, s] of (sb?.shots ?? []).entries()) {
        const sc = p.scenes.find((x) => x.id === s.scene);
        if (!sc) continue;
        const at = sc.start + (s.beat !== undefined && p.bpm ? (s.beat * 60) / p.bpm : (s.seconds ?? 0));
        const nxt = (sb?.shots ?? []).slice(i + 1).map((n) => {
          const nsc = p.scenes.find((x) => x.id === n.scene);
          return nsc ? nsc.start + (n.beat !== undefined && p.bpm ? (n.beat * 60) / p.bpm : (n.seconds ?? 0)) : null;
        }).find((x) => x !== null) ?? p.seconds;
        const problem = /TODO/.test(`${s.camera} ${s.onScreen} ${s.size ?? ""}`) ? "size, camera or screen still TODO" : s.status === "planned" ? "waiting for approval" : null;
        actors.push({id: `shot:${s.id}`, type: "tool", label: `shot ${s.id}`});
        spans.push({id: `sh-${s.id}`, from: `scene:${s.scene}`, to: `shot:${s.id}`, startedAt: inside(at), endedAt: ms(Math.max(nxt, at + 0.1)), outcome: problem ? "failure" : "success", summary: `${s.size ? `[${s.size}] ` : ""}${s.camera}`, input: {size: s.size ?? null, card: s.card ?? null, camera: s.camera, onScreen: s.onScreen, transition: s.transition ?? null}, ...(problem ? {error: problem} : {output: {status: s.status}})});
      }
      return {actors, spans};
    }
    // a short: voice.json scenes and lines (spelling applied), the fact each line cites, and the storyboard shots
    const vlines = voice?.lines ?? [];
    const narLines = (nar?.scenes ?? []).flatMap((s) => (s.lines ?? []).map((l) => ({scene: s.id, ...l})));
    const scenes = v.voice?.scenes ?? [];
    for (const s of scenes) scene(s.id, s.start, s.end, `${(s.end - s.start).toFixed(1)} s · ${((n) => `${n} line${n === 1 ? "" : "s"}`)(vlines.filter((l) => l.scene === s.id).length)}`);
    vlines.forEach((l, i) => {
      const n = narLines[i];
      const fact = n?.fact ? facts?.find((f) => f.id === n.fact) : undefined;
      const problem = /TODO/.test(l.text) ? "line still has TODO" : n?.fact && !fact ? `fact ${n.fact} is not in the ledger` : fact && fact.status !== "verified" && fact.status !== "contested" ? `fact ${fact.id} is ${fact.status}` : null;
      actors.push({id: `line:${i}`, type: "tool", label: `line ${i + 1}`});
      spans.push({id: `ln-${i}`, from: `scene:${l.scene}`, to: `line:${i}`, startedAt: inside(l.start), endedAt: ms(l.end), outcome: problem ? "failure" : "success", summary: l.text, input: {text: l.text, fact: n?.fact ?? null}, ...(problem ? {error: problem} : {output: fact ? {fact: fact.id, status: fact.status, claim: fact.claim} : {fact: "none"}})});
    });
    const words = voice?.words ?? [];
    const shots = sb?.shots ?? [];
    const startOf = (s: SbShot): number | null => {
      const l = vlines[s.line];
      if (!l) return null;
      if (!s.anchor) return l.start;
      const want = s.anchor.split(/\s+/).map(norm).filter(Boolean);
      const lw = words.filter((w) => w.line === s.line);
      for (let i = 0; i + want.length <= lw.length; i++) if (want.every((x, k) => norm(lw[i + k].text) === x)) return lw[i].start;
      return l.start;
    };
    const total = v.voice?.duration ?? 0;
    const starts = shots.map(startOf);
    shots.forEach((s, i) => {
      const a = starts[i];
      const l = vlines[s.line];
      if (a === null || !l) return;
      const b = starts.slice(i + 1).find((x) => x !== null) ?? total;
      const problem = /TODO/.test(`${s.camera} ${s.onScreen}`) ? "camera or screen still TODO" : s.status === "planned" ? "waiting for approval" : null;
      actors.push({id: `shot:${s.id}`, type: "tool", label: `shot ${s.id}`});
      spans.push({id: `sh-${s.id}`, from: `scene:${l.scene}`, to: `shot:${s.id}`, startedAt: inside(a), endedAt: ms(Math.max(b, a + 0.1)), outcome: problem ? "failure" : "success", summary: `${s.size ? `[${s.size}] ` : ""}${s.camera}`, input: {size: s.size ?? null, card: s.card ?? null, camera: s.camera, onScreen: s.onScreen, text: s.text ?? null, transition: s.transition ?? null, sfx: s.sfx ?? null}, ...(problem ? {error: problem} : {output: {status: s.status}})});
    });
    return {actors, spans};
  }, [v, voice, nar, sb, facts]);
  if (!data.spans.length) {
    return (
      <Card title="Timeline">
        <p className="text-sm text-muted-foreground">Nothing timed yet. {v.promo ? `Fill src/videos/${v.id}/promo.json.` : `Run bun run tts ${v.id} so the lines have times.`}</p>
      </Card>
    );
  }
  return (
    <div className="grid gap-3">
      <TraceWaterfall
        title="Timeline"
        spans={data.spans}
        actors={data.actors}
        noun={["item", "items"]}
        errorWords={["Issues", "to fix"]}
        maxHeight={620}
        now={Math.max(...data.spans.map((s) => s.endedAt ?? 0))}
      />
      <p className="text-xs text-muted-foreground">
        {v.promo ? "Scenes from promo.json, each spoken line inside its scene, the music under the film." : "Scenes and lines from voice.json, the fact each line cites, and the storyboard shots."} Click a row for its details; drag across the axis to zoom. Issues: a missing or unverified fact, a TODO, a shot waiting for approval, a line with no or stale audio.
      </p>
    </div>
  );
};

const VideoPage = ({id}: {id: string}) => {
  const {data: v, error, at, reload} = usePoll<VideoState>(`/api/video/${id}`);
  return (
    <Shell at={at} error={error}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <a className={buttonClass("ghost", "sm")} href="#/">
          <ArrowLeft /> All videos
        </a>
        <h1 className="text-2xl font-semibold tracking-tight">{id}</h1>
        {v?.flow && <Badge size="sm" variant="outline">flow {v.flow}</Badge>}
      </div>
      {!v && !error && <Loading label="Reading the project…" />}
      {v && (
        <>
          <div className="mb-4 grid grid-cols-[minmax(0,1fr)] gap-3">
            <Progress steps={v.steps} />
          </div>
          <Tabs defaultValue="media">
            <TabsList aria-label="Video sections" className="mb-4">
              {[["media", "Media"], ["brief", "Brief"], ["timeline", "Timeline"], ["script", "Script"], ["storyboard", "Storyboard"], ["steps", "Steps"], ["handoff", "Hand-off"], ["checks", "Checks"]].map(([k, l]) => (
                <TabsTrigger key={k} value={k}>{l}</TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="media"><MediaTab v={v} /></TabsContent>
            <TabsContent value="brief"><BriefTab v={v} /></TabsContent>
            <TabsContent value="timeline"><TimelineTab v={v} /></TabsContent>
            <TabsContent value="script"><ScriptTab v={v} /></TabsContent>
            <TabsContent value="storyboard"><StoryboardTab v={v} /></TabsContent>
            <TabsContent value="steps"><StepsTab v={v} /></TabsContent>
            <TabsContent value="handoff"><HandoffTab v={v} /></TabsContent>
            <TabsContent value="checks"><ChecksTab v={v} reload={reload} /></TabsContent>
          </Tabs>
        </>
      )}
    </Shell>
  );
};

// ── shell ─────────────────────────────────────────────────────────────────
const Shell = ({children, at, error}: {children: ReactNode; at: number | null; error: string | null}) => {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      {/* Knowns UI Grid Pattern behind the top of the page */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] overflow-hidden" aria-hidden="true">
        <GridPattern mask="top" squares={7} intensity={0.8} className="absolute inset-0" />
      </div>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <a href="#/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <img src={logoUrl} alt="" className="size-6 rounded-md" />
            shorts-kit <span className="font-normal text-muted-foreground">preview</span>
          </a>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge size="sm" variant="outline">read-only</Badge>
            {error ? <Badge size="sm" tone="danger" dot>offline</Badge> : at ? <Badge size="sm" tone="success" dot>updated {ago(at)}</Badge> : null}
          </div>
        </div>
      </header>
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {error && <Alert tone="danger" className="mb-4" title="Cannot reach the preview server">{error}</Alert>}
        {children}
      </main>
      <Footer />
    </div>
  );
};

// ── footer ────────────────────────────────────────────────────────────────
const FooterLink = ({href, icon, children}: {href: string; icon: ReactNode; children: ReactNode}) => (
  <a href={href} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
    {icon}
    {children}
  </a>
);

const Footer = () => (
  <footer className="relative mt-10 border-t bg-card/40">
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <img src={logoUrl} alt="shorts-kit" className="size-10 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="font-semibold tracking-tight">shorts-kit</p>
          <p className="mt-0.5 text-sm text-muted-foreground">Narrated vertical shorts with a coding agent and Remotion.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Made by{" "}
            <a href="https://howznguyen.dev" target="_blank" rel="noreferrer" className="font-semibold text-foreground hover:underline">
              howznguyen
            </a>
            {" "}· UI by{" "}
            <a href="https://ui.knowns.dev" target="_blank" rel="noreferrer" className="font-semibold text-foreground hover:underline">
              Knowns UI
            </a>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Made a video? Show it, or get feedback before you post, in the community.</p>
        </div>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Links">
        <FooterLink href="https://discord.knowns.dev" icon={<Chat />}>Discord</FooterLink>
        <FooterLink href="https://www.facebook.com/groups/agentic.coding.vietnam" icon={<Users />}>Facebook group</FooterLink>
        <FooterLink href="https://github.com/howznguyen/shorts-kit" icon={<Code />}>Source</FooterLink>
        <FooterLink href="https://howznguyen.dev" icon={<Globe />}>howznguyen.dev</FooterLink>
        <FooterLink href="https://github.com/howznguyen" icon={<GitHub />}>@howznguyen</FooterLink>
      </nav>
    </div>
    <div className="border-t">
      <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">MIT licensed. Runs on your machine. You upload by hand.</p>
    </div>
  </footer>
);

const App = () => {
  const r = useHashRoute();
  return useMemo(() => (r.page === "video" ? <VideoPage key={r.id} id={r.id!} /> : <Home />), [r.page, r.id]);
};

createRoot(document.getElementById("root")!).render(<App />);
