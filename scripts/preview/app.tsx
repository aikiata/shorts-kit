/**
 * shorts-kit preview UI. Read-only: every status comes from /api/*, which
 * infers it from files on disk. Polls every 5 s; no websockets.
 */
import {useCallback, useEffect, useMemo, useRef, useState, type ReactNode} from "react";
import {createRoot} from "react-dom/client";
import {ArrowLeft, Check, Code02, Copy01, Globe01, PlayCircle, RefreshCw01, X} from "@untitledui/icons";
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
  | {id: string; kind: "video"; flow: string | null; steps: Step[]; next: Next}
  | {id: string; kind: "gallery"; label: string; command: string};
type StatusResponse = {root: string; at: number; lan: boolean; videos: VideoRow[]};
type Lint = {at: number; code: number; timedOut: boolean; errors: number | null; warnings: number | null; output: string; ms: number};
type VideoState = {
  id: string;
  flow: string | null;
  steps: Step[];
  next: Next;
  files: {render: FileInfo; loud: FileInfo; upload: FileInfo; cover: FileInfo; coverJpg: FileInfo; caption: FileInfo; pinned: FileInfo; stills: NonNullable<FileInfo>[]; voiceJson: FileInfo; narrationJson: FileInfo; brief: FileInfo};
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
const Home = () => {
  const {data, error, at} = usePoll<StatusResponse>("/api/status");
  return (
    <Shell at={at} error={error}>
      {!data && !error && <LoadingIndicator type="line-spinner" size="md" label="Reading the project…" />}
      {data && data.videos.length === 0 && (
        <Card>
          <p className="text-secondary">No videos yet. Start one with:</p>
          <div className="mt-2">
            <Command cmd="bun run new <id> --flow <X>" />
          </div>
        </Card>
      )}
      <div className="grid gap-4">
        {data?.videos.map((v) =>
          v.kind === "gallery" ? (
            <Card key={v.id} title={<span className="flex items-center gap-2">{v.id}<Badge size="sm" color="purple">component gallery</Badge></span>}>
              <p className="mb-2 text-sm text-tertiary">Every shared component on one timeline. Not a video: no pipeline steps.</p>
              <Command cmd={v.command} />
            </Card>
          ) : (
            <Card
              key={v.id}
              title={
                <a href={`#/v/${v.id}`} className="flex items-center gap-2 hover:underline">
                  {v.id}
                  {v.flow && <Badge size="sm" color="gray" type="color">flow {v.flow}</Badge>}
                </a>
              }
              actions={<Button size="sm" color="secondary" href={`#/v/${v.id}`}>Open</Button>}
            >
              <div className="grid gap-3">
                <Progress steps={v.steps} />
                <div className="flex flex-wrap gap-1.5">
                  {v.steps.map((s) => (
                    <StepChip key={s.key} step={s} />
                  ))}
                </div>
                <NextStep next={v.next} />
              </div>
            </Card>
          ),
        )}
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
            <TabList type="button-gray" size="sm" className="mb-4 overflow-x-auto" items={[{id: "media", label: "Media"}, {id: "steps", label: "Steps"}, {id: "handoff", label: "Hand-off"}, {id: "checks", label: "Checks"}]} />
            <TabPanel id="media"><MediaTab v={v} /></TabPanel>
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
        <div>
          <p className="text-md font-semibold text-primary">shorts-kit</p>
          <p className="mt-0.5 text-sm text-tertiary">Narrated vertical shorts with a coding agent and Remotion.</p>
          <p className="mt-2 text-sm text-tertiary">
            Made by{" "}
            <a href="https://howznguyen.dev" target="_blank" rel="noreferrer" className="font-semibold text-brand-secondary hover:text-brand-secondary_hover">
              howznguyen
            </a>
          </p>
        </div>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Links">
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
