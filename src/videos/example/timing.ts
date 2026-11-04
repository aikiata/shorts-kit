/**
 * This video's clock, from voice.json (written by `bun run tts`). Scene length
 * comes from the voice; never type a duration here (§4).
 */
import {FPS} from "../../shared/theme";
import {sceneTimings, totalFrames, withCaptions, type Voice} from "../../shared/timings";
import narration from "./narration.json";
import rawVoice from "./voice.json";

export {FPS};
export const VOICE: Voice = withCaptions(rawVoice as unknown as Voice, narration);
/** Silent hold after the last word, seconds (§2). */
export const OUTRO_HOLD = narration.outroHold;
export const DURATION = totalFrames(VOICE, FPS, OUTRO_HOLD);
export const TIMINGS = sceneTimings(VOICE, FPS, OUTRO_HOLD);
