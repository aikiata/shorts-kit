import React from "react";
import {PromoTemplate} from "../../shared/frame/PromoTemplate";
import {FieldBg, KN_PALETTE} from "./look";
import {ANSWER_AT, EXPLAINS, INIT_AT, NODES, REDOS, STAMP_AT, scenes} from "./scenes";
import {FPS, PROMO, VOICE_CLIPS, sceneFrom, wordIn} from "./timing";

/**
 * Sound (docs/promo/sound.md): one cue table, one sound per cut, never stacked. The counters alternate two
 * samples and step down in volume (S2). No full-frame hit in this film. Every cue is pinned to a scene.
 */
const at = (id: string, f: number) => sceneFrom(id) + f;
const fall = (hits: number[], id: "tick" | "pop", from: number, to: number) => hits.map((s, i) => ({at: at("cost", s), id, volume: from - ((from - to) * i) / Math.max(1, hits.length - 1)}));
const SFX = [
  {at: at("wrong", STAMP_AT), id: "glitch" as const, volume: 0.22},
  ...["decisions,", "specs", "tasks", "scattered."].map((w, i) => ({at: at("where", wordIn("where", "v1", w)), id: (i % 2 ? "tick" : "pop") as "tick" | "pop", volume: 0.3 - 0.04 * i})),
  {at: at("where", wordIn("where", "v1", "none") + 4), id: "tick" as const, volume: 0.3},
  ...fall(EXPLAINS, "pop", 0.34, 0.16),
  ...fall(REDOS, "tick", 0.3, 0.16),
  {at: at("reveal", INIT_AT + 36), id: "ding" as const, volume: 0.24},
  ...NODES.map((n, i) => ({at: at("reveal", n.at), id: "tick" as const, volume: 0.32 - 0.04 * i})),
  {at: at("right", ANSWER_AT), id: "pop" as const, volume: 0.24},
  {at: at("right", wordIn("right", "v4", "from.")), id: "ding" as const, volume: 0.3},
  {at: at("lockup", wordIn("lockup", "v5", "line.") + 14), id: "ding" as const, volume: 0.32},
].sort((a, b) => a.at - b.at);

export const Video: React.FC<{safe: boolean}> = ({safe}) => (
  <PromoTemplate promo={PROMO} fps={FPS} scenes={scenes} palette={KN_PALETTE} background={<FieldBg lift={[sceneFrom("reveal"), sceneFrom("reveal") + 60]} />} safe={safe} sfx={SFX} voiceClips={VOICE_CLIPS} />
);
