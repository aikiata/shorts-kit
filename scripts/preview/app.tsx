/**
 * shorts-kit preview UI. Read-only: every status comes from /api/*, which
 * infers it from files on disk. Polls every 5 s; no websockets.
 */
import {useCallback, useEffect, useMemo, useRef, useState, type ReactNode} from "react";
import {createRoot} from "react-dom/client";
import {ArrowLeft, Check, Code02, Copy01, Globe01, MessageChatCircle, PlayCircle, RefreshCw01, Users01, X} from "@untitledui/icons";
import {Badge, BadgeWithDot} from "./ui/badges";
import {Button} from "./ui/button";
import {ButtonUtility} from "./ui/button-utility";
import {LoadingIndicator} from "./ui/loading-indicator";
import {Tab, TabList, TabPanel, Tabs} from "./ui/tabs";
import {Tooltip, TooltipTrigger} from "./ui/tooltip";
import {useClipboard} from "./ui/use-clipboard";
import {cx} from "./ui/cx";

// ── types (mirror scripts/preview.ts) ──────────────────────────────────────
type Status = "done" | "todo" | "warn" | "fail" | "unknown";
type Step = {key: string; n: number; label: string; status: Status; detail: string; command: string; skill: string};
type Next = {key: string; label: string; command: string; skill: string; detail: string};
type FileInfo = {path: string; size: number; mtime: number} | null;
type VideoRow =
  | {id: string; kind: "video"; flow: string | null; steps: Step[]; next: Next; created?: number}
  | {id: string; kind: "gallery"; label: string; command: string};
type StatusResponse = {root: string; at: number; lan: boolean; videos: VideoRow[]};
type Lint = {at: number; code: number; timedOut: boolean; errors: number | null; warnings: number | null; output: string; ms: number};
type VideoState = {
  id: string;
  flow: string | null;
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
const secs = (n: number | null | undefined) => (typeof n === "number" ? `${n.toFixed(1)} s` : "n/a");

const STATUS_COLOR: Record<Status, "success" | "gray" | "warning" | "error" | "blue"> = {done: "success", todo: "gray", warn: "warning", fail: "error", unknown: "blue"};
const STATUS_WORD: Record<Status, string> = {done: "done", todo: "to do", warn: "check", fail: "failed", unknown: "unknown"};

// ── small pieces ──────────────────────────────────────────────────────────
const CopyButton = ({text, label = "Copy"}: {text: string; label?: string}) => {
  const {copied, copy} = useClipboard();
  return (
    <Button size="sm" color="secondary" iconLeading={copied ? Check : Copy01} onClick={() => copy(text)}>
      {copied ? "Copied" : label}
    </Button>
  );
};

const Command = ({cmd}: {cmd: string}) => {
  const {copied, copy} = useClipboard();
  return (
    <div className="flex min-w-0 items-center gap-1 rounded-lg bg-secondary py-1 pr-1 pl-3 ring-1 ring-secondary ring-inset">
      <code className="min-w-0 flex-1 py-1 font-mono text-sm break-words whitespace-pre-wrap text-secondary">{cmd}</code>
      <ButtonUtility size="xs" color="tertiary" tooltip={copied ? "Copied" : "Copy command"} icon={copied ? Check : Copy01} onClick={() => copy(cmd.replace(/\s+#.*$/, ""))} />
    </div>
  );
};

const Card = ({title, actions, children, className}: {title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string}) => (
  <section className={cx("rounded-xl bg-primary_alt p-4 shadow-xs ring-1 ring-secondary ring-inset sm:p-5", className)}>
    {(title || actions) && (
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {title && <h2 className="text-md font-semibold text-primary">{title}</h2>}
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    )}
    {children}
  </section>
);

const StepChip = ({step}: {step: Step}) => (
  <Tooltip title={`${step.n}. ${step.label}: ${STATUS_WORD[step.status]}`} description={step.detail} placement="top">
    <TooltipTrigger className="cursor-default rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
      <BadgeWithDot type="pill-color" size="sm" color={STATUS_COLOR[step.status]}>
        {step.label}
      </BadgeWithDot>
    </TooltipTrigger>
  </Tooltip>
);

const NextStep = ({next}: {next: Next}) => (
  <div className="rounded-lg bg-secondary_alt p-3 ring-1 ring-secondary ring-inset">
    <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
      <span className="font-semibold text-brand-secondary">Next: {next.label}</span>
      <span className="text-tertiary">· {next.skill}</span>
    </div>
    {next.detail && <p className="mb-2 text-sm text-tertiary">{next.detail}</p>}
    <Command cmd={next.command} />
  </div>
);

const Progress = ({steps}: {steps: Step[]}) => {
  const done = steps.filter((s) => s.status === "done" || s.status === "warn").length;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-quaternary">
        <div className="h-full rounded-full bg-fg-brand-primary transition-all" style={{width: `${(100 * done) / steps.length}%`}} />
      </div>
      <span className="text-sm font-medium text-secondary tabular-nums">
        {done}/{steps.length}
      </span>
    </div>
  );
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
  const pill = (on: boolean) => cx("rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ring-inset transition", on ? "bg-brand-primary_alt text-primary ring-brand-500" : "text-tertiary ring-secondary hover:bg-primary_hover hover:text-secondary");
  return (
    <Shell at={at} error={error}>
      {!data && !error && <LoadingIndicator type="line-spinner" size="md" label="Reading the project…" />}
      {data && videos.length === 0 && (
        <Card>
          <p className="text-secondary">No videos yet. Start one with:</p>
          <div className="mt-2">
            <Command cmd="bun run new <id> --flow <X>" />
          </div>
        </Card>
      )}
      {videos.length > 0 && (
        <div className="mb-4 grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={q}
              onChange={(e) => set("q", e.target.value, "")}
              placeholder={`Search ${videos.length} videos by id or flow`}
              className="min-w-0 flex-1 basis-64 rounded-lg bg-primary px-3 py-2 text-sm text-primary ring-1 ring-secondary ring-inset placeholder:text-placeholder focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <label className="flex items-center gap-2 text-sm text-tertiary">
              Sort
              <select value={s} onChange={(e) => set("s", e.target.value, "newest")} className="rounded-lg bg-primary px-2 py-2 text-sm text-primary ring-1 ring-secondary ring-inset focus:ring-2 focus:ring-brand-500 focus:outline-none">
                {SORTS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter videos">
            {FILTERS.map((x) => (
              <button key={x.id} type="button" onClick={() => set("f", x.id, "all")} className={pill(f === x.id)} aria-pressed={f === x.id}>
                {x.label} <span className="ml-1 tabular-nums text-quaternary">{count(x.id)}</span>
              </button>
            ))}
            <span className="ml-auto flex gap-1" role="group" aria-label="Layout">
              <button type="button" onClick={() => set("v", "cards", "cards")} className={pill(view === "cards")} aria-pressed={view === "cards"}>Cards</button>
              <button type="button" onClick={() => set("v", "compact", "cards")} className={pill(view === "compact")} aria-pressed={view === "compact"}>Compact</button>
            </span>
          </div>
        </div>
      )}
      {videos.length > 0 && shown.length === 0 && <p className="mb-4 text-sm text-tertiary">No video matches. Clear the search or pick another filter.</p>}
      {view === "compact" && shown.length > 0 && (
        <Card>
          <ul className="grid grid-cols-[minmax(0,1fr)]">
            {shown.map((v) => {
              const done = v.steps.filter((x) => x.status === "done").length;
              const g = groupOf(v);
              return (
                <li key={v.id} className="border-b border-secondary last:border-0">
                  <a href={`#/v/${v.id}`} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-3 rounded-md px-2 py-2.5 hover:bg-primary_hover">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-semibold text-primary">{v.id}</span>
                      <Badge size="sm" color={g === "ready" ? "success" : g === "attention" ? "warning" : "gray"}>{g === "ready" ? "ready" : g === "attention" ? "check" : "in progress"}</Badge>
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-quaternary"><span className="block h-full rounded-full bg-brand-solid" style={{width: `${(done / Math.max(1, v.steps.length)) * 100}%`}} /></span>
                      <span className="text-xs tabular-nums text-tertiary">{done}/{v.steps.length}</span>
                    </span>
                    <span className="flex min-w-0 items-center justify-end gap-2 text-xs text-tertiary">
                      <span className="truncate">next: {v.next.label}</span>
                      {v.created ? <span className="shrink-0 tabular-nums text-quaternary">{new Date(v.created).toLocaleDateString()}</span> : null}
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
                {v.flow && <Badge size="sm" color="gray" type="color">flow {v.flow}</Badge>}
                {v.created ? <span className="text-xs font-normal text-quaternary">{new Date(v.created).toLocaleDateString()}</span> : null}
              </a>
            }
            actions={<Button size="sm" color="secondary" href={`#/v/${v.id}`}>Open</Button>}
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
          <Card key={v.id} title={<span className="flex items-center gap-2">{v.id}<Badge size="sm" color="purple">component gallery</Badge></span>}>
            <p className="mb-2 text-sm text-tertiary">Every shared component on one timeline. Not a video: no pipeline steps.</p>
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
        <ButtonUtility color="secondary" tooltip="Close" icon={X} onClick={onClose} />
      </div>
    </div>
  );
};

const Stat = ({label, value}: {label: string; value: ReactNode}) => (
  <div className="rounded-lg bg-secondary px-3 py-2 ring-1 ring-secondary ring-inset">
    <div className="text-xs text-tertiary">{label}</div>
    <div className="text-lg font-semibold text-primary tabular-nums">{value}</div>
  </div>
);

const MediaTab = ({v}: {v: VideoState}) => {
  const [zoom, setZoom] = useState<string | null>(null);
  const best = v.files.upload ?? v.files.loud ?? v.files.render;
  const bestName = best === v.files.upload ? "upload" : best === v.files.loud ? "loudness-normalized" : "raw render";
  const voice = v.voice;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
      <Card title="Video" actions={best && <Badge size="sm" color={best === v.files.upload ? "success" : "warning"}>{bestName}</Badge>}>
        {best ? (
          <>
            <video key={`${best.path}:${best.mtime}`} src={fileUrl(best)} controls playsInline preload="metadata" className="aspect-[9/16] w-full rounded-lg bg-black" />
            <p className="mt-2 text-xs break-all text-tertiary">
              {best.path} · {mb(best.size)} · {ago(best.mtime)}
            </p>
          </>
        ) : (
          <p className="text-sm text-tertiary">No mp4 yet. Render with <code className="font-mono">bun run render {v.id}</code>.</p>
        )}
      </Card>

      <div className="grid content-start gap-4">
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
                <Badge size="sm" color="gray">engine: {voice.engine ?? "?"}</Badge>
                {voice.estimated && <Badge size="sm" color="warning">estimated timing, no audio</Badge>}
              </div>
              {voice.audio ? (
                <audio key={`${voice.audio.path}:${voice.audio.mtime}`} src={fileUrl(voice.audio)} controls preload="metadata" className="w-full" />
              ) : (
                <p className="text-sm text-tertiary">No voice audio yet (bun run tts {v.id}).</p>
              )}
              {voice.scenes.length > 0 && (
                <ul className="mt-3 grid gap-1 text-sm">
                  {voice.scenes.map((s) => (
                    <li key={s.id} className="flex justify-between gap-3 border-b border-secondary py-1 last:border-0">
                      <span className="truncate text-secondary">{s.id}</span>
                      <span className="text-tertiary tabular-nums">
                        {s.start.toFixed(1)}–{s.end.toFixed(1)} s
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-tertiary">No voice.json yet.</p>
          )}
        </Card>

        <Card title={`Stills (${v.files.stills.length})`}>
          {v.files.stills.length ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
              {v.files.stills.map((s) => (
                <button key={s.path} type="button" onClick={() => setZoom(fileUrl(s))} className="group overflow-hidden rounded-lg ring-1 ring-secondary outline-focus-ring focus-visible:outline-2">
                  <img src={fileUrl(s)} alt={s.path} loading="lazy" className="aspect-[9/16] w-full object-cover transition group-hover:opacity-80" />
                  <span className="block truncate px-1 py-0.5 text-xs text-tertiary">{s.path.split("/").pop()}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-tertiary">No stills yet (bun run still {v.id} --frame=&lt;n&gt;).</p>
          )}
        </Card>

        <Card title="Cover">
          {v.files.cover ? (
            <div className="flex flex-wrap items-start gap-4">
              <button type="button" onClick={() => setZoom(fileUrl(v.files.cover!))} className="w-full max-w-[270px] overflow-hidden rounded-lg ring-1 ring-secondary">
                <img src={fileUrl(v.files.cover)} alt="cover, full size" className="w-full" />
                <span className="block px-1 py-0.5 text-xs text-tertiary">full size (click to enlarge)</span>
              </button>
              <div>
                {/* the profile grid crops 1080×1920 to ~1:1.29 (263 px off top and bottom) and shows it ~200 px wide */}
                <div className="w-[200px] overflow-hidden rounded-md ring-1 ring-secondary" style={{aspectRatio: "1 / 1.29"}}>
                  <img src={fileUrl(v.files.cover)} alt="cover at profile-grid size" className="h-full w-full object-cover object-center" />
                </div>
                <p className="mt-1 max-w-[200px] text-xs text-tertiary">200 px, 1:1.29 profile-grid crop. Is the number readable here?</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-tertiary">No cover yet (bun run cover {v.id}).</p>
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
        <pre className="max-h-96 overflow-auto rounded-lg bg-secondary p-3 font-mono text-sm whitespace-pre-wrap text-secondary ring-1 ring-secondary ring-inset">{body}</pre>
      ) : (
        <p className="text-sm text-tertiary">No out/{v.id}/{name} yet. {hint}</p>
      )}
      {body && <p className="mt-2 text-xs text-tertiary">{body.length} characters</p>}
    </Card>
  );
  return (
    <div className="grid gap-4">
      <div className="rounded-lg bg-warning-primary p-3 text-sm text-warning-primary ring-1 ring-warning_subtle ring-inset">
        You upload by hand. The kit never publishes: copy the caption into the upload form, set the cover explicitly, and paste the pinned comment right after posting (that is where the credits live).
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {block("Caption", "caption.txt", texts?.caption, "Written from the §11a template (sk-handoff).")}
        {block("Pinned comment", "pinned-comment.txt", texts?.pinned, "Extra fact + credits from the ledger (sk-handoff).")}
      </div>
      {v.files.upload && (
        <Card title="Upload file">
          <p className="text-sm break-all text-secondary">
            {v.files.upload.path} · {mb(v.files.upload.size)}
          </p>
          <div className="mt-2">
            <Button size="sm" color="secondary" href={fileUrl(v.files.upload)} target="_blank">Open the mp4</Button>
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
  const up = v.files.upload;
  useEffect(() => {
    if (!up) {
      setProbe(null);
      return;
    }
    setProbing(true);
    api<{probe: Probe | null; message?: string}>(`/api/probe/${v.id}`)
      .then(setProbe)
      .catch((e) => setProbe({probe: null, message: (e as Error).message}))
      .finally(() => setProbing(false));
  }, [v.id, up?.mtime, up?.size]);
  const lint = v.lint;
  const lintStep = v.steps.find((s) => s.key === "lint");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card
        title="Lint"
        actions={
          <Button size="sm" color="primary" iconLeading={RefreshCw01} isLoading={running || v.lintRunning} onClick={run}>
            Run lint
          </Button>
        }
      >
        <p className="mb-2 text-sm text-tertiary">
          Runs <code className="font-mono">bun run lint {v.id}</code> on demand (60 s timeout). Never runs on page load.
        </p>
        {err && <p className="mb-2 text-sm text-error-primary">{err}</p>}
        {lint ? (
          <>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {lintStep && <BadgeWithDot size="sm" color={STATUS_COLOR[lintStep.status]}>{lintStep.detail}</BadgeWithDot>}
              <span className="text-xs text-tertiary">
                {ago(lint.at)} · {(lint.ms / 1000).toFixed(1)} s · exit {lint.code}
              </span>
            </div>
            <pre className="max-h-[28rem] overflow-auto rounded-lg bg-secondary p-3 font-mono text-xs whitespace-pre-wrap text-secondary ring-1 ring-secondary ring-inset">
              {lint.output.split("\n").map((l, i) => (
                <div key={i} className={cx(l.startsWith("error") || l.startsWith("✖") ? "text-error-primary" : l.startsWith("warn") ? "text-warning-primary" : undefined)}>
                  {l || " "}
                </div>
              ))}
            </pre>
          </>
        ) : (
          <p className="text-sm text-tertiary">Not run yet.</p>
        )}
      </Card>

      <Card title="Upload file (ffprobe)">
        {!up && <p className="text-sm text-tertiary">No out/{v.id}/{v.id}-upload.mp4 yet (bun run encode {v.id}).</p>}
        {up && probing && !probe && <LoadingIndicator type="line-spinner" size="sm" label="ffprobe…" />}
        {probe?.message && <p className="text-sm text-tertiary">{probe.message}</p>}
        {probe?.probe?.error && <p className="text-sm text-error-primary">{probe.probe.error}</p>}
        {probe?.probe && !probe.probe.error && (
          <>
            <p className="mb-2 text-xs break-all text-tertiary">
              {probe.probe.file} · {mb(probe.probe.size)} · {secs(probe.probe.duration)}
              {probe.probe.video?.frames ? ` · ${probe.probe.video.frames} frames` : ""}
            </p>
            <table className="w-full text-sm">
              <tbody>
                {probe.probe.checks.map((c) => (
                  <tr key={c.name} className="border-b border-secondary last:border-0">
                    <td className="py-1.5 pr-2 text-tertiary">{c.name}</td>
                    <td className="py-1.5 pr-2 font-mono text-secondary">{c.value}</td>
                    <td className="py-1.5 text-right">
                      {c.ok ? <Badge size="sm" color="success">ok</Badge> : <Tooltip title={`want ${c.want}`}><TooltipTrigger><Badge size="sm" color="error">want {c.want}</Badge></TooltipTrigger></Tooltip>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-tertiary">Loudness is not measured here: check the `bun run normalize` output.</p>
          </>
        )}
      </Card>
    </div>
  );
};

const StepsTab = ({v}: {v: VideoState}) => (
  <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,420px)]">
    <Card title="Pipeline (from disk)">
      <ol className="grid gap-1">
        {v.steps.map((s) => (
          <li key={s.key} className={cx("flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-2", s.key === v.next.key && "bg-secondary ring-1 ring-brand ring-inset")}>
            <span className="w-6 text-right text-sm text-quaternary tabular-nums">{s.n}</span>
            <span className="w-24 font-medium text-primary">{s.label}</span>
            <BadgeWithDot size="sm" color={STATUS_COLOR[s.status]}>{STATUS_WORD[s.status]}</BadgeWithDot>
            <span className="min-w-0 flex-1 basis-48 text-sm text-tertiary">{s.detail}</span>
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
              <span className="text-tertiary">{k}</span>
              {f ? (
                <a className="truncate text-secondary hover:underline" href={fileUrl(f)} target="_blank" rel="noreferrer">
                  {mb(f.size)} · {ago(f.mtime)}
                </a>
              ) : (
                <span className="text-quaternary">n/a</span>
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
  if (!nar) return <Card title="Script"><p className="text-sm text-tertiary">No narration.json yet.</p></Card>;
  const lines = voice?.lines ?? [];
  const words = voice?.words ?? [];
  const factOf = (id?: string | null) => (id ? facts?.find((f) => f.id === id) : undefined);
  const play = (start: number) => { const a = audio.current; if (!a) return; a.currentTime = Math.max(0, start - 0.05); void a.play(); };
  const real = !!v.voice?.audio && !voice?.estimated;
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
        <Badge size="sm" color="gray">{narLines.length} lines · {totalWords} words</Badge>
        <Badge size="sm" color={real ? "success" : "warning"}>{real ? `voice ${(v.voice?.duration ?? 0).toFixed(1)} s` : `≈ ${(totalWords / wps).toFixed(0)} s estimated (${wps} words/s)`}</Badge>
        {todo > 0 && <Badge size="sm" color="warning">{todo} TODO</Badge>}
        {missing > 0 && <Badge size="sm" color="error">{missing} missing fact{missing > 1 ? "s" : ""}</Badge>}
        {!real && <span className="text-tertiary">No voice yet: timings below are estimates from the text. Run <code className="font-mono">bun run tts {v.id}</code> to hear it.</span>}
      </div>
        {v.voice?.audio ? (
          <div className="sticky top-16 z-10 mb-4 rounded-xl bg-primary/90 py-2 backdrop-blur">
            <audio ref={audio} key={`${v.voice.audio.path}:${v.voice.audio.mtime}`} src={fileUrl(v.voice.audio)} controls preload="metadata" className="w-full" />
            <p className="mt-1 text-xs text-tertiary">Click a line to play from it. The word being spoken is highlighted, so you can check the voice against the text.</p>
          </div>
        ) : null}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
          {(nar.scenes ?? []).map((s) => (
            <section key={s.id}>
              <h3 className="mb-2 font-mono text-xs tracking-wider text-tertiary uppercase">{s.id}</h3>
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
                      <button type="button" onClick={() => real && vl && play(vl.start)} className={cx("w-full min-w-0 overflow-hidden rounded-lg p-3 text-left ring-1 ring-inset transition", active ? "bg-brand-primary_alt ring-brand-500" : /TODO/.test(l.text) ? "ring-[color:var(--color-fg-warning-secondary)]" : "ring-secondary hover:bg-primary_hover")}>
                        <p className="text-md leading-relaxed text-primary">
                          {(() => {
                            // Show the script as written (with punctuation); borrow each word's timing
                            // when the token count matches the timed words, which it does for plain text.
                            const toks = l.text.split(/\s+/).filter(Boolean);
                            if (!lw.length || toks.length !== lw.length) return l.text;
                            return toks.map((tok, k) => {
                              const w = lw[k];
                              const on = t >= w.start && t < w.end;
                              return (
                                <span key={k}>
                                  <span className={cx("rounded-sm", on && "bg-brand-solid text-white shadow-[0_0_0_2px_var(--color-bg-brand-solid)]")}>{tok}</span>{k < toks.length - 1 ? " " : ""}
                                </span>
                              );
                            });
                          })()}
                        </p>
                        {l.caption && <p className="mt-1 text-sm text-tertiary">{l.caption}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-tertiary">
                          {real && vl ? <span className="tabular-nums">{vl.start.toFixed(1)}–{vl.end.toFixed(1)} s</span> : <span className="tabular-nums">≈ {(countWords(l.text) / wps).toFixed(1)} s</span>}
                          <span>{l.text.split(/\s+/).filter(Boolean).length} words</span>
                          {l.fact ? (
                            <Badge size="sm" color={fact?.status === "verified" ? "success" : fact ? "warning" : "error"}>{l.fact}{fact ? ` · ${fact.status}` : " · missing"}</Badge>
                          ) : (
                            <Badge size="sm" color="gray">no fact</Badge>
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
type SbShot = {id: string; line: number; anchor?: string | null; camera: string; onScreen: string; text?: string | null; visual?: string; transition?: string; sfx?: string | null; notes?: string; status: "planned" | "approved" | "built"};
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
        <p className="mb-3 text-sm text-secondary">No storyboard yet. After the voice exists, plan every shot (camera, what is on screen, on-frame text, transition, sfx) and get it approved before building scenes.</p>
        <Command cmd={`bun run storyboard ${v.id} --init`} />
        <p className="mt-3 text-xs text-tertiary">Schema and rules: docs/storyboard.md</p>
      </Card>
    );
  }
  if (!sb) return <Card title="Storyboard"><LoadingIndicator type="line-spinner" size="sm" label="Reading storyboard.json…" /></Card>;
  const lineTexts = (nar?.scenes ?? []).flatMap((s) => (s.lines ?? []).map((l) => ({scene: s.id, text: l.text})));
  const vlines = voice?.lines ?? [];
  const words = voice?.words ?? [];
  const real = !!voice && !voice.estimated;
  const shots = sb.shots ?? [];
  const startOf = (s: SbShot): number | null => {
    const l = vlines[s.line];
    if (!l) return null;
    if (!s.anchor) return l.start;
    const want = s.anchor.split(/\s+/).map(norm).filter(Boolean);
    const lw = words.filter((w) => w.line === s.line);
    for (let i = 0; i + want.length <= lw.length; i++) if (want.every((x, k) => norm(lw[i + k].text) === x)) return lw[i].start;
    return l.start;
  };
  const starts = shots.map(startOf);
  const total = (v.voice?.duration ?? 0) + 3;
  const endOf = (i: number) => starts.slice(i + 1).find((x) => x !== null) ?? total;
  const stillAt = (a: number, b: number) => {
    const all = v.files.stills.map((f) => ({f, frame: Number(/(\d+)\.(png|jpe?g)$/i.exec(f.path)?.[1] ?? NaN)})).filter((x) => !Number.isNaN(x.frame));
    const inside = all.filter((x) => x.frame / FPS_UI >= a && x.frame / FPS_UI < b);
    return inside.sort((x, y) => Math.abs(x.frame / FPS_UI - (a + b) / 2) - Math.abs(y.frame / FPS_UI - (a + b) / 2))[0]?.f ?? null;
  };
  const counts = {planned: shots.filter((x) => x.status === "planned").length, approved: shots.filter((x) => x.status === "approved").length, built: shots.filter((x) => x.status === "built").length};
  const play = (at: number | null) => { const a = media.current; if (!a || at === null) return; a.currentTime = Math.max(0, at - 0.05); void a.play(); };
  const statusColor = {planned: "warning", approved: "brand", built: "success"} as const;
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-16 lg:self-start">
        <Card title="Playback">
          {mp4 ? (
            <video ref={(el) => { media.current = el; }} key={`${mp4.path}:${mp4.mtime}`} src={fileUrl(mp4)} controls preload="metadata" className="aspect-[9/16] w-full rounded-lg bg-black" />
          ) : v.voice?.audio ? (
            <audio ref={(el) => { media.current = el; }} key={`${v.voice.audio.path}:${v.voice.audio.mtime}`} src={fileUrl(v.voice.audio)} controls preload="metadata" className="w-full" />
          ) : (
            <p className="text-sm text-tertiary">No render or voice yet.</p>
          )}
          <p className="mt-2 text-xs text-tertiary">Click a shot to play it. {mp4 ? "The render shows what each shot looks like now." : "No render yet: you hear the voice the shot sits on."}</p>
        </Card>
      </div>
      <Card title="Storyboard">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <Badge size="sm" color="gray">{shots.length} shots</Badge>
          {counts.planned > 0 && <Badge size="sm" color="warning">{counts.planned} planned</Badge>}
          {counts.approved > 0 && <Badge size="sm" color="brand">{counts.approved} approved</Badge>}
          {counts.built > 0 && <Badge size="sm" color="success">{counts.built} built</Badge>}
          {!real && <span className="text-tertiary">Timings are estimates until <code className="font-mono">bun run tts {v.id}</code>.</span>}
          <span className="text-tertiary">Check it in the terminal: <code className="font-mono">bun run storyboard {v.id}</code></span>
        </div>
        {counts.planned > 0 && (
          <p className="mb-4 rounded-lg bg-warning-primary p-3 text-sm text-warning-primary ring-1 ring-inset ring-[color:var(--color-fg-warning-secondary)]">
            {counts.planned} shot{counts.planned > 1 ? "s" : ""} waiting for your approval. The preview is read-only: tell your agent "approve s01 to s{String(shots.length).padStart(2, "0")}" (or name the shots to change), or set <code className="font-mono">status</code> to <code className="font-mono">approved</code> in <code className="font-mono">src/videos/{v.id}/storyboard.json</code>. Scenes are built only from approved shots.
          </p>
        )}
        {!mp4 && shots.some((x) => x.status !== "planned") && (
          <p className="mb-4 text-xs text-tertiary">A shot shows its still once one exists: <code className="font-mono">bun run still {v.id} --frame=N</code> (N is shown on each shot).</p>
        )}
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {shots.map((s, i) => {
            const a = starts[i];
            const b = endOf(i);
            const active = a !== null && t >= a && t < b;
            const still = a !== null ? stillAt(a, b) : null;
            const line = lineTexts[s.line];
            const todo = /TODO/.test(`${s.camera} ${s.onScreen}`);
            return (
              <li key={s.id} className="min-w-0">
                <button type="button" onClick={() => play(a)} className={cx("grid w-full min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-3 overflow-hidden rounded-lg p-3 text-left ring-1 ring-inset transition sm:grid-cols-[96px_minmax(0,1fr)]", active ? "bg-brand-primary_alt ring-brand-500" : todo ? "ring-[color:var(--color-fg-warning-secondary)]" : "ring-secondary hover:bg-primary_hover")}>
                  <div className="aspect-[9/16] w-full overflow-hidden rounded-md bg-secondary ring-1 ring-secondary">
                    {mp4 && a !== null ? <img src={frameUrl(v.id, (a + b) / 2, mp4.mtime)} alt="" loading="lazy" className="h-full w-full object-cover" /> : still ? <img src={fileUrl(still)} alt="" className="h-full w-full object-cover" /> : (
                      <div className="flex h-full flex-col items-center justify-center gap-1 p-1 text-center text-[10px] leading-tight text-quaternary">
                        <span className="font-semibold text-tertiary">not built</span>
                        {a !== null && <span className="break-all font-mono">--frame={Math.round(((a + b) / 2) * FPS_UI)}</span>}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-primary">{s.id}</span>
                      <Badge size="sm" color={statusColor[s.status] ?? "gray"}>{s.status}</Badge>
                      {a !== null && <span className="text-tertiary tabular-nums">{a.toFixed(1)}–{b.toFixed(1)} s</span>}
                      {s.transition && <Badge size="sm" color="gray">{s.transition}</Badge>}
                      {s.visual && <Badge size="sm" color="gray">{s.visual}</Badge>}
                      {s.sfx && <Badge size="sm" color="gray">sfx: {s.sfx}</Badge>}
                    </div>
                    <p className="mb-2 text-sm text-secondary italic">“{line?.text ?? "(no such line)"}”{s.anchor && <span className="not-italic text-tertiary"> · from “{s.anchor}”</span>}</p>
                    <dl className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-2 gap-y-1 text-sm">
                      <dt className="text-tertiary">Camera</dt><dd className="text-primary">{s.camera}</dd>
                      <dt className="text-tertiary">Screen</dt><dd className="text-primary">{s.onScreen}</dd>
                      {s.text && <><dt className="text-tertiary">Text</dt><dd className="font-mono text-xs text-primary">{s.text}</dd></>}
                      {s.notes && <><dt className="text-tertiary">Notes</dt><dd className="text-secondary">{s.notes}</dd></>}
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

const VideoPage = ({id}: {id: string}) => {
  const {data: v, error, at, reload} = usePoll<VideoState>(`/api/video/${id}`);
  return (
    <Shell at={at} error={error}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button size="sm" color="tertiary" iconLeading={ArrowLeft} href="#/">
          All videos
        </Button>
        <h1 className="text-xl font-semibold text-primary">{id}</h1>
        {v?.flow && <Badge size="sm" type="color">flow {v.flow}</Badge>}
      </div>
      {!v && !error && <LoadingIndicator type="line-spinner" size="md" label="Reading the project…" />}
      {v && (
        <>
          <div className="mb-4 grid gap-3">
            <Progress steps={v.steps} />
          </div>
          <Tabs defaultSelectedKey="media">
            <TabList type="button-gray" size="sm" className="mb-4 overflow-x-auto" items={[{id: "media", label: "Media"}, {id: "script", label: "Script"}, {id: "storyboard", label: "Storyboard"}, {id: "steps", label: "Steps"}, {id: "handoff", label: "Hand-off"}, {id: "checks", label: "Checks"}]} />
            <TabPanel id="media"><MediaTab v={v} /></TabPanel>
            <TabPanel id="script"><ScriptTab v={v} /></TabPanel>
            <TabPanel id="storyboard"><StoryboardTab v={v} /></TabPanel>
            <TabPanel id="steps"><StepsTab v={v} /></TabPanel>
            <TabPanel id="handoff"><HandoffTab v={v} /></TabPanel>
            <TabPanel id="checks"><ChecksTab v={v} reload={reload} /></TabPanel>
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
    <div className="flex min-h-screen flex-col bg-primary text-primary">
      <header className="sticky top-0 z-40 border-b border-secondary bg-primary/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <a href="#/" className="flex items-center gap-2 font-semibold text-primary">
            <PlayCircle className="size-5 text-fg-brand-primary" />
            shorts-kit preview
          </a>
          <div className="flex items-center gap-2 text-xs text-tertiary">
            <Badge size="sm" color="gray">read-only</Badge>
            {error ? <Badge size="sm" color="error">offline</Badge> : at ? <span>updated {ago(at)}</span> : null}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">
        {error && <p className="mb-4 rounded-lg bg-error-primary p-3 text-sm text-error-primary ring-1 ring-error_subtle ring-inset">Cannot reach the preview server: {error}</p>}
        {children}
      </main>
      <Footer />
    </div>
  );
};

// ── footer ────────────────────────────────────────────────────────────────
const GitHubMark = ({className}: {className?: string}) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const FooterLink = ({href, icon, children}: {href: string; icon: ReactNode; children: ReactNode}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-tertiary ring-1 ring-secondary ring-inset transition hover:bg-primary_hover hover:text-secondary"
  >
    {icon}
    {children}
  </a>
);

const Footer = () => (
  <footer className="mt-10 border-t border-secondary bg-secondary_alt">
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-solid text-white shadow-xs">
          <PlayCircle className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-md font-semibold text-primary">shorts-kit</p>
          <p className="mt-0.5 text-sm text-tertiary">Narrated vertical shorts with a coding agent and Remotion.</p>
          <p className="mt-2 text-sm text-tertiary">
            Made by{" "}
            <a href="https://howznguyen.dev" target="_blank" rel="noreferrer" className="font-semibold text-brand-secondary hover:text-brand-secondary_hover">
              howznguyen
            </a>
          </p>
          <p className="mt-1 text-sm text-tertiary">Made a video? Show it, or get feedback before you post, in the community.</p>
        </div>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Links">
        <FooterLink href="https://discord.knowns.dev" icon={<MessageChatCircle className="size-4" />}>Discord</FooterLink>
        <FooterLink href="https://www.facebook.com/groups/agentic.coding.vietnam" icon={<Users01 className="size-4" />}>Facebook group</FooterLink>
        <FooterLink href="https://github.com/howznguyen/shorts-kit" icon={<Code02 className="size-4" />}>Source</FooterLink>
        <FooterLink href="https://howznguyen.dev" icon={<Globe01 className="size-4" />}>howznguyen.dev</FooterLink>
        <FooterLink href="https://github.com/howznguyen" icon={<GitHubMark className="size-4" />}>@howznguyen</FooterLink>
      </nav>
    </div>
    <div className="border-t border-secondary">
      <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-quaternary">
        MIT licensed. Runs on your machine. You upload by hand.
      </p>
    </div>
  </footer>
);

const App = () => {
  const r = useHashRoute();
  return useMemo(() => (r.page === "video" ? <VideoPage key={r.id} id={r.id!} /> : <Home />), [r.page, r.id]);
};

createRoot(document.getElementById("root")!).render(<App />);
