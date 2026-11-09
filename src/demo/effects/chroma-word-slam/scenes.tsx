import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import type {SceneComponent} from "../../shared/frame/ShortsTemplate";
import {PANEL_LEFT, PANEL_MAX_W} from "../../shared/frame/SafeZones";
import {clamp, glide} from "../../shared/motion/anim";
import {DEFAULT_PALETTE as P, FONT} from "../../shared/theme";
import {KnownsAnswer} from "./answer";
import {BEAT, ChromaText, Kinetic, Vignette, Wash} from "./fx";
import {KnownsComposer} from "./composer";
import {KnownsGraph} from "./graph";
import {KnownsThinking} from "./thinking";
import {wordIn} from "./timing";
import {Bubble, CARD, Label, rise, typed, up} from "./ui";

/**
 * One idea per scene, said twice: by the voice and by large type on the frame, so a viewer who does not
 * know the product still follows (docs/promo/aesthetics.md R3: slower than you think; every scene at least
 * 4 s). The story: Monday you decide; Friday the agent has forgotten; you explain again and again; AGAIN;
 * Knowns gives the repository a memory; next Friday the agent remembers, with sources.
 * The cuts fall on the beat grid in promo.json. The decision text is illustrative.
 */
const DECISION = "Onboarding starts with the checklist. Then the demo.";
const QUESTION = "What did we decide about onboarding?";

/** A slow push so no frame is static. */
const Push: React.FC<{duration: number; children: React.ReactNode}> = ({duration, children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{transform: `scale(${glide(f, [0, duration], [1, 1.03])})`, transformOrigin: "50% 45%"}}>{children}</AbsoluteFill>;
};

/** A column drawn at 774 px and enlarged, so type reads on a phone. */
const Col: React.FC<{top: number; height: number; scale: number; gap?: number; children: React.ReactNode}> = ({top, height, scale, gap = 26, children}) => (
  <div style={{position: "absolute", left: PANEL_LEFT, top, width: PANEL_MAX_W, height}}>
    <div style={{width: PANEL_MAX_W / scale, height: height / scale, transform: `scale(${scale})`, transformOrigin: "0 0", display: "flex", flexDirection: "column", justifyContent: "flex-start", gap}}>{children}</div>
  </div>
);

const Day: React.FC<{text: string; sub?: string; k: number}> = ({text, sub, k}) => (
  <div style={{position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", ...rise(k, 20)}}>
    <div style={{fontFamily: FONT.sans, fontWeight: 900, fontSize: 88, letterSpacing: 8, color: P.accentSoft}}>{text}</div>
    {sub ? <div style={{fontFamily: FONT.sans, fontWeight: 600, fontSize: 42, color: P.muted, marginTop: 6}}>{sub}</div> : null}
  </div>
);

const Counter: React.FC<{n: number; top: number; color?: string; size?: number}> = ({n, top, color = P.text, size = 200}) => (
  <div style={{position: "absolute", left: PANEL_LEFT, width: PANEL_MAX_W, top, textAlign: "center"}}>
    <Label style={{fontSize: 30, letterSpacing: 4}}>Times you explained this</Label>
    <div style={{fontFamily: FONT.sans, fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: -6, marginTop: 8, color}}>×{n}</div>
  </div>
);

// ── 1. monday: the good state; you type the decision into the real composer, send it, the agent has it ──
const Monday: SceneComponent = ({duration}) => {
  const f = useCurrentFrame();
  const SEND = 108;
  const CZ = 2.4;
  const inComposer = f < SEND ? typed(DECISION, f, 24, 0.7) : "";
  return (
    <Push duration={duration}>
      <Day text="MONDAY" k={up(f, 4, 10)} />
      <Col top={540} height={560} scale={1.45}>
        {f >= SEND ? <Bubble who="you" text={DECISION} k={up(f, SEND, 6)} /> : null}
        {f >= SEND + 22 ? <Bubble who="agent" text="Got it." k={up(f, SEND + 22, 8)} /> : null}
      </Col>
      <div style={{position: "absolute", left: PANEL_LEFT, top: 1140, width: PANEL_MAX_W, opacity: up(f, 10, 8)}}>
        <div style={{zoom: CZ, width: PANEL_MAX_W / CZ}}>
          <KnownsComposer value={inComposer} width={PANEL_MAX_W / CZ} />
        </div>
      </div>
    </Push>
  );
};

// ── 2. friday: a new session; the agent looked for what you decided and found nothing ──────────
const Friday: SceneComponent = ({duration}) => {
  const f = useCurrentFrame();
  const w = (word: string, nth = 1) => wordIn("friday", "v1", word, nth);
  const TZ = 2.4;
  return (
    <Push duration={duration}>
      <Day text="FRIDAY" sub="A new session" k={up(f, 4, 10)} />
      <div style={{position: "absolute", left: PANEL_LEFT, top: 560, width: PANEL_MAX_W}}>
        <div style={{zoom: TZ, width: PANEL_MAX_W / TZ}}>
          <KnownsThinking frame={f} width={PANEL_MAX_W / TZ} steps={[{id: "a", kind: "search", title: "Looked for earlier decisions", detail: "Nothing found.", at: 70, doneAt: 92}, {id: "b", kind: "think", title: "No memory of this project", at: 96, doneAt: 116}]} />
        </div>
      </div>
      <Col top={1010} height={300} scale={1.45}>
        {f >= 122 ? <Bubble who="agent" text={typed(QUESTION, f, 124, 0.9)} cursor k={up(f, 122, 8)} /> : null}
      </Col>
      <div style={{position: "absolute", left: 50, right: 50, top: 1400, textAlign: "center"}}>
        <Kinetic align="center" size={104} words={[{text: "Your", at: w("Your")}, {text: "agent", at: w("agent")}, {text: "forgot", at: w("forgot"), color: P.bad}, {text: "what you decided.", at: w("what")}]} />
      </div>
    </Push>
  );
};

// ── 3. again: the same explanation, again and again, a little faster each time (R2) ────────────
export const HITS = [14, 62, 102, 136, 164, 188, 208, 224];
const ROW = 172; // design px: a two-line bubble with its label
const Again: SceneComponent = ({duration}) => {
  const f = useCurrentFrame();
  const SC = 1.3;
  const H = 760 / SC;
  const cont = HITS.reduce((a, s) => a + up(f, s, 10), 0);
  const n = HITS.filter((s) => f >= s).length;
  const last = n ? HITS[n - 1] : -99;
  const pulse = 1 + 0.1 * Math.exp(-(f - last) / 4);
  return (
    <AbsoluteFill>
      <div style={{transform: `scale(${pulse})`, transformOrigin: "50% 40%"}}>
        <Counter n={n} top={300} color={n >= 6 ? P.bad : P.text} />
      </div>
      <div style={{position: "absolute", left: PANEL_LEFT, top: 700, width: PANEL_MAX_W, height: 760, overflow: "hidden"}}>
        <div style={{position: "relative", width: PANEL_MAX_W / SC, height: H, transform: `scale(${SC})`, transformOrigin: "0 0"}}>
          {HITS.map((s, i) => {
            const slot = cont - 1 - i;
            if (slot < -1 || slot > 3.6) return null;
            const fade = interpolate(slot, [0, 3.2], [1, 0], clamp);
            return (
              <div key={s} style={{position: "absolute", left: 0, right: 0, top: H - ROW - slot * ROW, opacity: fade * up(f, s, 8)}}>
                <Bubble who="you" text={DECISION} />
              </div>
            );
          })}
        </div>
      </div>
      <Vignette from={110} to={duration} peak={0.5} color="rgba(255,45,45,0.55)" />
    </AbsoluteFill>
  );
};

// ── 4. slam: "AGAIN." lands, the music is cut, one held breath ──────────────────────────────────
const Slam: SceneComponent = ({duration}) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, 5], [3.4, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const split = f < 5 ? 26 : 16 * Math.exp(-(f - 5) / 6);
  const shake = f < 5 ? 0 : 12 * Math.exp(-(f - 5) / 2) * Math.sin(f * 2.7);
  const shiver = f > 18 ? 2 * Math.sin(f * 1.57) : 0;
  const dim = interpolate(f, [20, duration], [1, 0.3], clamp);
  return (
    <AbsoluteFill style={{background: "#07090d"}}>
      <div style={{position: "absolute", left: 0, right: 0, top: 800, transform: `translate(${shake + shiver}px, ${shiver}px) scale(${s})`, opacity: dim}}>
        <ChromaText text="AGAIN." size={262} color={P.bad} split={split} />
      </div>
      <Wash color="#ff2d3a" at={0} peak={0.6} frames={16} />
    </AbsoluteFill>
  );
};

// ── 5. reveal: the fix, in plain words; the memory is built from what the repository already has ─
const Reveal: SceneComponent = ({duration}) => {
  const f = useCurrentFrame();
  const w = (word: string, nth = 1) => wordIn("reveal", "v3", word, nth);
  const cmd = typed("$ knowns init", f, 120, 0.45);
  const GZ = 1.75;
  return (
    <Push duration={duration}>
      <div style={{position: "absolute", left: PANEL_LEFT - 10, width: PANEL_MAX_W + 20, top: 300}}>
        <Kinetic size={112} words={[{text: "Knowns", at: w("Knowns"), color: P.accent}, {text: "gives", at: w("gives")}, {text: "your", at: w("your")}, {text: "repository", at: w("repository")}, {text: "a", at: w("a")}, {text: "memory.", at: w("memory"), color: P.accent}]} />
      </div>
      <div style={{position: "absolute", left: PANEL_LEFT, width: PANEL_MAX_W, top: 790, ...rise(up(f, 112, 10), 16)}}>
        <div style={{borderRadius: 22, background: CARD.bg, border: `2px solid ${CARD.border}`, padding: "22px 30px", fontFamily: FONT.mono, fontSize: 48, fontWeight: 600, color: P.text, minHeight: 100}}>
          <span style={{color: P.accent}}>{cmd.slice(0, 1)}</span>
          {cmd.slice(1)}
        </div>
      </div>
      <div style={{position: "absolute", left: PANEL_LEFT, width: PANEL_MAX_W, top: 950, ...rise(up(f, 142, 10), 12)}}>
        <Label style={{fontSize: 30, letterSpacing: 3, textAlign: "center"}}>Decisions · Specs · Tasks</Label>
      </div>
      <div style={{position: "absolute", left: PANEL_LEFT, width: PANEL_MAX_W, top: 1010, height: 560, opacity: up(f, 140, 10)}}>
        <div style={{zoom: GZ, width: PANEL_MAX_W / GZ}}>
          <KnownsGraph layout="horizontal" frame={f} fps={30} width={PANEL_MAX_W / GZ} height={300} tools={[{id: "decisions", label: "Decisions", at: 158}, {id: "specs", label: "Specs", at: 176}, {id: "tasks", label: "Tasks", at: 194}]} />
        </div>
      </div>
    </Push>
  );
};

// ── 6. payoff: the same Friday, but the agent already knows, and shows where it knows it from ──
const SOURCES = [
  {title: "Onboarding starts with the checklist", site: "DEC-018", excerpt: "Accepted. Checklist first, then the demo."},
  {title: "Onboarding flow", site: "specs/onboarding-flow", excerpt: "Checklist, then the demo."},
];
const Payoff: SceneComponent = ({duration}) => {
  const f = useCurrentFrame();
  const w = (word: string, nth = 1) => wordIn("payoff", "v4", word, nth);
  const SC = 1.95;
  const glow = up(f, w("sources") - 4, 14);
  return (
    <Push duration={duration}>
      <Day text="NEXT FRIDAY" sub="A new session" k={up(f, 4, 10)} />
      <Counter n={0} top={540} color={P.good} size={150} />
      <div style={{position: "absolute", left: PANEL_LEFT, top: 790, ...rise(up(f, 10, 8), 16)}}>
        <div style={{width: PANEL_MAX_W / SC, transform: `scale(${SC})`, transformOrigin: "0 0"}}>
          <div style={{borderRadius: 16, boxShadow: `0 0 ${60 * glow}px ${P.accent}88, 0 0 0 ${3 * glow}px ${P.accent}`}}>
            <KnownsAnswer frame={f - 10} width={PANEL_MAX_W / SC} question="Continue the onboarding flow." steps={["Read project memory", "Cited 2 sources"]} sources={SOURCES} text="Onboarding starts with the checklist [1], then the demo [2]." cps={1.0} />
          </div>
        </div>
      </div>
    </Push>
  );
};

// ── 7. lockup: the tagline on the spoken words, the install command, then one still second ─────
const Lockup: SceneComponent = () => {
  const f = useCurrentFrame();
  const w = (word: string, nth = 1) => wordIn("lockup", "v5", word, nth);
  const big = 168;
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: PANEL_LEFT, width: PANEL_MAX_W, top: 300, ...rise(up(f, 0, 10))}}>
        <div style={{fontFamily: FONT.sans, fontWeight: 800, fontSize: 40, letterSpacing: 6, color: P.accentSoft}}>KNOWNS</div>
        <div style={{height: 4, width: `${up(f, 2, 16) * 120}px`, background: P.accent, marginTop: 14, borderRadius: 2}} />
      </div>
      <div style={{position: "absolute", left: PANEL_LEFT - 20, width: PANEL_MAX_W + 40, top: 430}}>
        <Kinetic size={big} words={[{text: "Project", at: w("Project")}, {text: "memory.", at: w("memory"), color: P.accent}]} />
        <div style={{height: 30}} />
        <Kinetic size={big * 0.62} words={[{text: "From", at: w("From")}, {text: "the", at: w("the")}, {text: "command", at: w("command")}, {text: "line.", at: w("line"), color: P.accent}]} />
      </div>
      <div style={{position: "absolute", left: PANEL_LEFT, width: PANEL_MAX_W, top: 1110, ...rise(up(f, w("line") + 14, 12))}}>
        <div style={{borderRadius: 22, background: CARD.bg, border: `2px solid ${CARD.border}`, padding: "26px 30px", fontFamily: FONT.mono, fontSize: 31, color: P.text, display: "flex", flexDirection: "column", gap: 12}}>
          <span><span style={{color: P.accent}}>$</span> brew install knowns-dev/tap/knowns</span>
          <span><span style={{color: P.accent}}>$</span> knowns init</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export {BEAT};
export const scenes: Record<string, SceneComponent> = {monday: Monday, friday: Friday, again: Again, slam: Slam, reveal: Reveal, payoff: Payoff, lockup: Lockup};
