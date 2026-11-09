import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import type {SceneComponent} from "../../shared/frame/ShortsTemplate";
import {PANEL_LEFT, PANEL_MAX_W} from "../../shared/frame/SafeZones";
import {clamp, easeOut, glide, ramp} from "../../shared/motion/anim";
import {KnownsAnswer} from "./answer";
import {KnownsThinking} from "./thinking";
import {wordIn} from "./timing";
import {Head, K, Kit, MONO, Mark, SANS} from "./look";
import {OnboardingChecklist} from "./knowns-ui/ui/knowns/blocks/onboarding/onboarding-checklist";
import {SetupWizard} from "./knowns-ui/ui/knowns/blocks/setup/setup-wizard";
import {Card, CardDescription, CardHeader, CardTitle} from "./knowns-ui/ui/knowns/card";
import {CodeBlock} from "./knowns-ui/ui/knowns/code-block/code-block";
import {NumberTicker} from "./knowns-ui/ui/knowns/text-animation/number-ticker";
import {Tag} from "./knowns-ui/ui/knowns/tag";

/**
 * knowns-tvc-v4, route A "Scattered" (briefs/knowns-tvc-v4.md), in Knowns UI's own look (look.tsx). The pain is
 * not that the agent forgets: the decisions, specs and tasks live in different places, so the agent reads none
 * of them and builds the wrong thing. Knowns keeps them in the repo, connected, and the agent builds what was
 * decided, with sources. Pace and order are the approved animatic (animatic.tsx). Every spoken line is on screen (C1).
 *
 * Real Knowns UI pieces: SetupWizard (the wrong build) and OnboardingChecklist (the right build), Card, Tag,
 * ThinkingState, NumberTicker, CodeBlock, AiAnswer, and the Node Field background (look.tsx). Each is controlled
 * by props computed from the frame; the kit's CSS animations and transitions are off (theme.css).
 * Illustrative content (DEC-018, TASK-042, the onboarding decision) stands in for any repository.
 */

const L = PANEL_LEFT;
const W = PANEL_MAX_W;
const up = (f: number, at: number, len = 10) => ramp(f, at, len, easeOut);
const rise = (k: number, px = 24): React.CSSProperties => ({opacity: k, transform: `translateY(${(1 - k) * px}px)`});

/** A slow push so no frame is static. */
const Push: React.FC<{duration: number; children: React.ReactNode}> = ({duration, children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{transform: `scale(${glide(f, [0, duration], [1, 1.025])})`, transformOrigin: "50% 45%"}}>{children}</AbsoluteFill>;
};

const Caption: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({children, color = K.muted, style}) => (
  <div style={{fontFamily: SANS, fontSize: 30, fontWeight: 500, letterSpacing: -0.3, color, marginBottom: 14, ...style}}>{children}</div>
);

// ── 1. wrong: the pain in the first second; the decision, and the setup wizard the agent built instead ──
export const STAMP_AT = 78;
const WIZARD_STEPS = ["Workspace", "Team", "Integrations", "Billing", "Invite"].map((t, i) => ({
  id: t.toLowerCase(),
  title: t,
  description: i === 0 ? "Step 1 of 5" : undefined,
  children: (
    <div className="flex flex-col gap-2">
      <div className="text-[12px] text-muted-foreground">Workspace name</div>
      <div className="h-8 rounded-lg border bg-background px-2.5 text-[13px] leading-8">Acme</div>
    </div>
  ),
}));
/** `pace` < 1 plays the same beats faster, for the 6 s cut. */
const makeWrong = (pace: number): SceneComponent => {
  const Wrong: SceneComponent = ({duration}) => {
    const f = useCurrentFrame();
    const T = (x: number) => Math.round(x * pace);
    const stamp = up(f, T(STAMP_AT), 6);
    return (
      <Push duration={duration}>
        <Mark />
        <div style={{position: "absolute", left: L, width: W + 20, top: 310}}>
          <Head size={108} words={[{text: "That's", at: 2}, {text: "not", at: 6, color: K.danger}, {text: "what", at: 10}, {text: "we", at: 13}, {text: "decided.", at: 16}]} />
        </div>
        <div style={{position: "absolute", left: L, width: W, top: 690, ...rise(up(f, T(30)), 20)}}>
          <Kit z={2.6} width={W}>
            <Card>
              <CardHeader className="pb-4">
                <div><Tag tone="accent" dot size="sm">Decision · last week</Tag></div>
                <CardTitle>Onboarding starts with a checklist.</CardTitle>
              </CardHeader>
            </Card>
          </Kit>
        </div>
        <div style={{position: "absolute", left: L, width: W, top: 1000, ...rise(up(f, T(54)), 24)}}>
          <Caption>What the agent built</Caption>
          <div style={{height: 600, overflow: "hidden", borderRadius: 30, boxShadow: stamp > 0 ? `0 0 0 3px ${K.danger}` : "none", maskImage: "linear-gradient(#000 80%, transparent)", WebkitMaskImage: "linear-gradient(#000 80%, transparent)"}}>
            <Kit z={2} width={W}>
              <SetupWizard steps={WIZARD_STEPS} current={0} />
            </Kit>
          </div>
          <div style={{position: "absolute", right: 0, top: -12, opacity: stamp, transform: `rotate(-3deg) scale(${1.25 - 0.25 * stamp})`, transformOrigin: "100% 0"}}>
            <Kit z={3} width={450} style={{display: "flex", justifyContent: "flex-end"}}>
              <Tag tone="danger" dot size="md">Not a checklist</Tag>
            </Kit>
          </div>
        </div>
      </Push>
    );
  };
  return Wrong;
};

// ── 2. where: decisions, specs and tasks live in four places; the agent finds none of them ──────────
const Place: React.FC<{tag: string; children: React.ReactNode}> = ({tag, children}) => (
  <Kit z={2.4} width={350}>
    <Card>
      <CardHeader className="pb-4">
        <div><Tag size="sm">{tag}</Tag></div>
        {children}
      </CardHeader>
    </Card>
  </Kit>
);
const Where: SceneComponent = ({duration}) => {
  const f = useCurrentFrame();
  const w = (word: string, nth = 1) => wordIn("where", "v1", word, nth);
  const TZ = 2.3;
  const place = (at: number, x: number, y: number, rot: number, node: React.ReactNode) => {
    const k = up(f, at);
    return <div style={{position: "absolute", left: x, top: y, opacity: k, transform: `translateY(${(1 - k) * 30}px) rotate(${rot}deg)`}}>{node}</div>;
  };
  return (
    <Push duration={duration}>
      <Mark />
      <div style={{position: "absolute", left: L, width: W + 20, top: 300}}>
        <Head size={84} words={[{text: "Decisions.", at: w("decisions,")}, {text: "Specs.", at: w("specs")}, {text: "Tasks.", at: w("tasks")}, {text: "Scattered.", at: w("scattered."), color: K.danger}]} />
      </div>
      {place(w("decisions,"), L - 6, 540, -2.5, <Place tag="Chat"><CardTitle>“Checklist first.”</CardTitle><CardDescription>last week</CardDescription></Place>)}
      {place(w("specs"), L + 410, 580, 2, <Place tag="Doc"><CardTitle>Onboarding spec</CardTitle><CardDescription>spec.md</CardDescription></Place>)}
      {place(w("tasks"), L + 6, 860, 1.5, <Place tag="Board"><CardTitle>TASK-042</CardTitle><CardDescription>To do</CardDescription></Place>)}
      {place(w("scattered."), L + 416, 880, -2, <Place tag="Code"><CardTitle style={{fontFamily: MONO}}>onboarding/</CardTitle><CardDescription>src</CardDescription></Place>)}
      <div style={{position: "absolute", left: L, top: 1150, width: W, opacity: up(f, w("Your", 2) - 6, 8)}}>
        <Caption color={K.danger}>Your agent reads none of them</Caption>
        <Kit z={TZ} width={W}>
          <KnownsThinking
            frame={f}
            width={W / TZ}
            seconds={3}
            steps={[
              {id: "a", kind: "search", title: "Looked for the onboarding decision", detail: "Nothing found.", at: w("Your", 2), doneAt: w("none") + 4},
              {id: "b", kind: "think", title: "Guessing: a setup wizard", at: w("none") + 10, doneAt: w("none") + 34},
            ]}
          />
        </Kit>
      </div>
    </Push>
  );
};

// ── 3. cost: so you explain, review and redo, and the counts keep going up (C5, C6) ─────────────────
export const EXPLAINS = [22, 56, 82, 102, 118, 130];
export const REDOS = [70, 98, 120, 138];
const Count: React.FC<{label: string; hits: number[]; left: number; f: number}> = ({label, hits, left, f}) => {
  const n = hits.filter((s) => f >= s).length;
  const last = n ? hits[n - 1] : -99;
  const pulse = 1 + 0.08 * Math.exp(-(f - last) / 4);
  const full = n === hits.length;
  return (
    <div style={{position: "absolute", left, top: 930, width: W / 2 - 12, opacity: up(f, hits[0] - 8, 8)}}>
      <Kit z={2.4} width={W / 2 - 12}>
        <Card style={{boxShadow: full ? `0 0 0 1px ${K.danger}` : undefined}}>
          <CardHeader className="pb-5">
            <CardDescription>{label}</CardDescription>
            <div style={{fontSize: 56, fontWeight: 600, letterSpacing: -2, lineHeight: 1.1, color: full ? K.danger : K.fg, transform: `scale(${pulse})`, transformOrigin: "0 60%"}}>
              ×<NumberTicker key={n} value={n} />
            </div>
          </CardHeader>
        </Card>
      </Kit>
    </div>
  );
};
const Cost: SceneComponent = ({duration}) => {
  const f = useCurrentFrame();
  const w = (word: string) => wordIn("cost", "v2", word);
  const heat = interpolate(f, [40, duration], [0, 0.35], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 60% at 50% 55%, transparent 40%, rgba(248,113,113,${heat}) 100%)`}} />
      <Mark />
      <div style={{position: "absolute", left: L, width: W + 20, top: 300, display: "flex", flexDirection: "column"}}>
        <Head size={150} words={[{text: "Explain.", at: w("explain.")}]} />
        <Head size={150} words={[{text: "Review.", at: w("Review.")}]} />
        <Head size={150} words={[{text: "Redo.", at: w("Redo."), color: K.danger}]} />
      </div>
      <Count label="Times you explained it" hits={EXPLAINS} left={L} f={f} />
      <Count label="Reviews redone" hits={REDOS} left={L + W / 2 + 12} f={f} />
    </AbsoluteFill>
  );
};

// ── 4. reveal: the plain sentence first (C3), then `knowns init`, then the parts join one graph ──────
export const NODES = [
  {id: "decisions", label: "Decisions", at: 150},
  {id: "specs", label: "Specs", at: 164},
  {id: "tasks", label: "Tasks", at: 178},
  {id: "docs", label: "Docs", at: 192},
  {id: "code", label: "Code", at: 206},
];
export const INIT_AT = 100;

/** The parts of the project pulled around the repo: Knowns UI Tags on hairlines, as in the Node Field. */
const RepoGraph: React.FC<{f: number}> = ({f}) => {
  const cx = L + W / 2;
  const cy = 1320;
  const r = 235;
  const hub = up(f, NODES[0].at - 12);
  const pos = NODES.map((n, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / NODES.length;
    const k = up(f, n.at, 14);
    const far = 1.8 - 0.8 * k;
    return {...n, k, x: cx + Math.cos(a) * r * 1.2 * far, y: cy + Math.sin(a) * r * 0.86 * far};
  });
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: "absolute", left: 0, top: 0}}>
        {pos.map((n) => (
          <line key={n.id} x1={cx} y1={cy} x2={cx + (n.x - cx) * n.k} y2={cy + (n.y - cy) * n.k} stroke={K.fg} strokeOpacity={0.35 * n.k} strokeWidth={2} />
        ))}
      </svg>
      <div style={{position: "absolute", left: cx - 150, top: cy - 70, width: 300, opacity: hub, transform: `scale(${0.85 + 0.15 * hub})`}}>
        <Kit z={2.5} width={300}>
          <Card style={{boxShadow: `0 0 0 1px ${K.accent}, 0 0 24px color-mix(in srgb, ${K.accent} 35%, transparent)`}}>
            <CardHeader className="items-center pb-4 text-center">
              <CardTitle>your repo</CardTitle>
              <CardDescription style={{fontFamily: MONO}}>.knowns/</CardDescription>
            </CardHeader>
          </Card>
        </Kit>
      </div>
      {pos.map((n) => (
        <div key={n.id} style={{position: "absolute", left: n.x - 165, top: n.y - 34, width: 330, display: "flex", justifyContent: "center", opacity: Math.min(1, n.k * 2)}}>
          <Kit z={3} width={330} style={{display: "flex", justifyContent: "center"}}>
            <Tag tone="accent" dot size="md">{n.label}</Tag>
          </Kit>
        </div>
      ))}
    </AbsoluteFill>
  );
};

/** The reveal, for a given spoken line: its words land on the voice; accent words in `accent`. */
const makeReveal = (line: string, words: string[], accent: string[], size: number, termTop: number): SceneComponent => {
  const Reveal: SceneComponent = ({duration}) => {
    const f = useCurrentFrame();
    const seen: Record<string, number> = {};
    const w = (word: string) => wordIn("reveal", line, word, (seen[word] = (seen[word] ?? 0) + 1));
    const typed = "$ knowns init".slice(0, Math.max(0, Math.floor((f - INIT_AT - 6) * 0.5)));
    const code = f >= INIT_AT + 36 ? `${typed}\n✓ .knowns/ ready in your repo` : typed || "$";
    return (
      <Push duration={duration}>
        <Mark />
        <div style={{position: "absolute", left: L, width: W + 20, top: 300}}>
          <Head size={size} words={words.map((x) => ({text: x, at: w(x), color: accent.includes(x) ? K.accent : undefined}))} />
        </div>
        <div style={{position: "absolute", left: L, width: W, top: termTop, ...rise(up(f, INIT_AT), 16)}}>
          <Kit z={2.4} width={W}>
            <CodeBlock code={code} language="bash" filename="terminal" copy={false} wrapToggle={false} trim={false} />
          </Kit>
        </div>
        <RepoGraph f={f} />
      </Push>
    );
  };
  return Reveal;
};

// ── 5. right: the agent builds the checklist (the real block), then shows where it came from ────────
const SOURCES = [
  {title: "Onboarding starts with a checklist", site: "DEC-018", excerpt: "Accepted."},
  {title: "Build onboarding", site: "TASK-042", excerpt: "3 acceptance criteria."},
];
const CHECKLIST = [
  {id: "repo", title: "Connect your repo", done: true},
  {id: "team", title: "Invite your team", done: true},
  {id: "agent", title: "Set up your agent", description: "Pick a model and give it the project.", cta: {label: "Set up"}},
  {id: "first", title: "Run your first task"},
];
export const ANSWER_AT = 100;
const Right: SceneComponent = ({duration}) => {
  const f = useCurrentFrame();
  const w = (word: string) => wordIn("right", "v4", word);
  const SC = 2.4;
  const built = up(f, 26) * (1 - up(f, ANSWER_AT - 6, 10));
  const glow = up(f, w("from.") - 4, 14);
  return (
    <Push duration={duration}>
      <Mark />
      <div style={{position: "absolute", left: L, width: W + 20, top: 300}}>
        <Head size={80} words={[{text: "Builds", at: w("builds")}, {text: "what", at: w("what")}, {text: "you", at: w("you")}, {text: "decided.", at: w("decided."), color: K.accent}]} />
        <div style={{height: 10}} />
        <Head size={80} words={[{text: "Shows", at: w("shows")}, {text: "where", at: w("where")}, {text: "it", at: w("it")}, {text: "came", at: w("came")}, {text: "from.", at: w("from."), color: K.accent}]} />
      </div>
      {built > 0.01 ? (
        <div style={{position: "absolute", left: L, width: W, top: 680, ...rise(built, 20)}}>
          <Caption>What the agent built</Caption>
          <Kit z={2.1} width={W}>
            <OnboardingChecklist title="Get started" description="Checklist first, as decided in DEC-018." steps={CHECKLIST} />
          </Kit>
        </div>
      ) : null}
      {f >= ANSWER_AT - 4 ? (
        <div style={{position: "absolute", left: L, top: 680, ...rise(up(f, ANSWER_AT, 8), 16)}}>
          <div style={{width: (W - 24) / SC, transform: `scale(${SC})`, transformOrigin: "0 0"}}>
            <div style={{borderRadius: 16, boxShadow: `0 0 ${50 * glow}px color-mix(in srgb, ${K.accent} 55%, transparent), 0 0 0 ${2 * glow}px ${K.accent}`}}>
              <KnownsAnswer frame={f - ANSWER_AT} width={(W - 24) / SC} question="Why a checklist?" steps={["Read DEC-018", "Read TASK-042"]} sources={SOURCES} text="Because you decided it [1]. All 3 checks pass [2]." stepFrames={12} cps={1.4} />
            </div>
          </div>
        </div>
      ) : null}
    </Push>
  );
};

// ── 6. lockup: the tagline on the spoken words, the install command, then one still second ─────────
/** `installAt` (scene frame) brings the install command in early for a short cut; `sub` adds a plain line. */
const makeLockup = (installAt?: number, sub?: string, installTop = 1110): SceneComponent => {
  const Lockup: SceneComponent = () => {
    const f = useCurrentFrame();
    const w = (word: string) => wordIn("lockup", "v5", word);
    const install = installAt ?? w("line.") + 14;
    return (
      <AbsoluteFill>
        <div style={{...rise(up(f, 0), 12)}}>
          <Mark size={60} top={300} />
        </div>
        <div style={{position: "absolute", left: L - 10, width: W + 30, top: 440}}>
          <Head size={160} words={[{text: "Project", at: w("Project")}, {text: "memory,", at: w("memory,"), color: K.accent}]} />
          <div style={{height: 24}} />
          <Head size={76} words={[{text: "from", at: w("from")}, {text: "the", at: w("the")}, {text: "command", at: w("command")}, {text: "line.", at: w("line.")}]} />
          {sub ? <div style={{marginTop: 28, paddingLeft: 10, fontFamily: SANS, fontSize: 44, fontWeight: 500, letterSpacing: -1, lineHeight: 1.2, color: K.muted, ...rise(up(f, 6), 12)}}>{sub}</div> : null}
        </div>
        <div style={{position: "absolute", left: L, width: W, top: installTop, ...rise(up(f, install, 12))}}>
          <Kit z={2.3} width={W}>
            <CodeBlock code={"$ brew install knowns-dev/tap/knowns\n$ knowns init"} language="bash" copy={false} wrapToggle={false} />
          </Kit>
          <div style={{marginTop: 24, textAlign: "center", fontFamily: SANS, fontSize: 38, fontWeight: 500, color: K.muted}}>knowns.sh</div>
        </div>
      </AbsoluteFill>
    );
  };
  return Lockup;
};

const Wrong = makeWrong(1);
const Reveal = makeReveal("v3", ["Knowns", "keeps", "them", "in", "your", "repo.", "Connected."], ["Knowns", "Connected."], 88, 760);
const Lockup = makeLockup();

/** Cutdowns (rule 15): the same scenes re-timed, never chopped from the master. */
export const WrongFast = makeWrong(0.6);
/** The 16 s cut has no `where` scene, so its line names the parts itself (c3). */
export const RevealCut = makeReveal("c3", ["Knowns", "keeps", "your", "decisions,", "specs", "and", "tasks", "in", "your", "repo.", "Connected."], ["Knowns", "Connected."], 80, 810);
export const LockupCut = makeLockup(16);
export const Lockup6 = makeLockup(12, "Decisions, specs and tasks, connected in your repo.", 1240);

/** Scene id (from promo.json) → component. */
export const scenes: Record<string, SceneComponent> = {wrong: Wrong, where: Where, cost: Cost, reveal: Reveal, right: Right, lockup: Lockup};
