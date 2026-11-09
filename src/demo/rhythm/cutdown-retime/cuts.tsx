import React from "react";
import {PromoTemplate} from "../../shared/frame/PromoTemplate";
import {promoFrames, promoTimings, voiceClipsOf, type Promo} from "../../shared/promo";
import {FieldBg, KN_PALETTE} from "./look";
import {INIT_AT, NODES, RevealCut, STAMP_AT, Lockup6, LockupCut, WrongFast, scenes} from "./scenes";
import {ALL, FPS, RECORDS, wordIn} from "./timing";

/**
 * Cutdowns (docs/promo/README.md rule 15, briefs/knowns-tvc-v4.md deliverables matrix). Each is re-edited from
 * the master's scenes, keeping pain, product and CTA in its own length. A spoken line keeps the same place inside
 * its scene as in promo.json, so the scenes' word cues stay right. The music starts from the top of the track.
 */
const lines = (...ids: string[]) => ALL.voice!.lines.filter((l) => ids.includes(l.id));
const music = {...ALL.music!, repeatEvery: undefined, crossfade: undefined, fadeOut: 1.2};

/** 16 s: the pain (wrong), the product with its parts named (reveal, line c3), the CTA (lockup). */
export const PROMO16: Promo = {...ALL, tail: 1, music, voice: {...ALL.voice!, lines: lines("c3", "v5")}, scenes: [{id: "wrong", beats: 8}, {id: "reveal", beats: 16}, {id: "lockup", beats: 6}]};
/** 6 s: the pain line and the stamp, then the name, the tagline and the install command. */
export const PROMO6: Promo = {...ALL, tail: 0, music: {...music, fadeOut: 0.8}, voice: {...ALL.voice!, lines: lines("v5")}, scenes: [{id: "wrong", seconds: 2.5}, {id: "lockup", seconds: 3.5}]};

export const FRAMES16 = promoFrames(PROMO16, FPS);
export const FRAMES6 = promoFrames(PROMO6, FPS);

const from = (promo: Promo, id: string) => promoTimings(promo, FPS).find((t) => t.id === id)!.from;

const SFX16 = [
  {at: from(PROMO16, "wrong") + STAMP_AT, id: "glitch" as const, volume: 0.22},
  {at: from(PROMO16, "reveal") + INIT_AT + 36, id: "ding" as const, volume: 0.24},
  ...NODES.map((n, i) => ({at: from(PROMO16, "reveal") + n.at, id: "tick" as const, volume: 0.32 - 0.04 * i})),
  {at: from(PROMO16, "lockup") + wordIn("lockup", "v5", "line."), id: "ding" as const, volume: 0.32},
];
const SFX6 = [
  {at: from(PROMO6, "wrong") + Math.round(STAMP_AT * 0.6), id: "glitch" as const, volume: 0.22},
  {at: from(PROMO6, "lockup") + wordIn("lockup", "v5", "line."), id: "ding" as const, volume: 0.32},
];

export const Cut16: React.FC<{safe: boolean}> = ({safe}) => (
  <PromoTemplate promo={PROMO16} fps={FPS} scenes={{wrong: scenes.wrong, reveal: RevealCut, lockup: LockupCut}} palette={KN_PALETTE} background={<FieldBg lift={[from(PROMO16, "reveal"), from(PROMO16, "reveal") + 60]} />} safe={safe} sfx={SFX16} voiceClips={voiceClipsOf(PROMO16, FPS, RECORDS)} />
);

export const Cut6: React.FC<{safe: boolean}> = ({safe}) => (
  <PromoTemplate promo={PROMO6} fps={FPS} scenes={{wrong: WrongFast, lockup: Lockup6}} palette={KN_PALETTE} background={<FieldBg />} safe={safe} sfx={SFX6} voiceClips={voiceClipsOf(PROMO6, FPS, RECORDS)} />
);
