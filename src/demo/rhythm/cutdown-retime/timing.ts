/**
 * This promo's clock, from promo.json (written by hand). Scene length is the shot's job, in
 * beats; the spoken lines are placed in scenes and made by `bun run voice` (docs/promo/).
 */
import {FPS} from "../../shared/theme";
import {assertPromo, promoFrames, promoTimings, voiceClipsOf, voiceWordFrame, type Promo, type VoiceRecord} from "../../shared/promo";
import raw from "./promo.json";
import records from "./voice-lines.json";

export {FPS};
/** Every line in promo.json, including the cutdowns' own lines (id "c…"). Word times are scene-relative, so any
 * clock with the same scene placement can read them from here. */
export const ALL: Promo = assertPromo(raw as Promo);
/** The master film: only its own lines (v1-v5). */
export const PROMO: Promo = {...ALL, voice: ALL.voice && {...ALL.voice, lines: ALL.voice.lines.filter((l) => l.id.startsWith("v"))}};
export const DURATION = promoFrames(PROMO, FPS);
export const TIMINGS = promoTimings(PROMO, FPS);
export const VOICE_CLIPS = voiceClipsOf(PROMO, FPS, records as VoiceRecord[]);

/** Start frame of a scene (absolute). */
export const sceneFrom = (id: string) => TIMINGS.find((t) => t.id === id)!.from;
/** Frame, relative to scene `sceneId`, of the `nth` spoken `word` in voice line `lineId`. */
export const wordIn = (sceneId: string, lineId: string, word: string, nth = 1) => voiceWordFrame(ALL, FPS, records as VoiceRecord[], lineId, word, nth) - sceneFrom(sceneId);

/** Records of every spoken line, for a cutdown's own clock. */
export const RECORDS = records as VoiceRecord[];
