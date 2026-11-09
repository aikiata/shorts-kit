/**
 * This promo's clock, from promo.json (written by hand). Scene length is the
 * shot's job, in seconds or beats; there is no voice.json (docs/promo/).
 */
import {FPS} from "../../shared/theme";
import {assertPromo, promoFrames, promoTimings, type Promo} from "../../shared/promo";
import raw from "./promo.json";

export {FPS};
export const PROMO: Promo = assertPromo(raw as Promo);
export const DURATION = promoFrames(PROMO, FPS);
export const TIMINGS = promoTimings(PROMO, FPS);
