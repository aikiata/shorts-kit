import React, {useMemo} from "react";
import {interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {clamp, easeOut} from "../motion/anim";
import {SOUL} from "../soul";
import {FONT, H, type Palette} from "../theme";
import type {Voice, VoiceWord} from "../timings";
import {PANEL_LEFT, PANEL_MAX_W} from "../frame/SafeZones";

/**
 * Running captions (§7): 2–4 words at a time, never across a sentence end, the
 * word being spoken in `palette.accent`. The block's bottom edge sits at
 * `captionBottomShare` of the frame height above the bottom edge, inside the
 * panel width, so the last word never slides under the like column.
 *
 * Captions follow the ear. A whole sentence on screen is a wall of text.
 */
export type Chunk = {words: VoiceWord[]; start: number; end: number; line: number};

const [MIN_WORDS, MAX_WORDS] = SOUL.captionWordsPerChunk;
/** A chunk that stays this long after its last word when the next one is far away. */
const TAIL_SECONDS = 0.35;
const MAX_GAP_SECONDS = 0.7;
const MAX_CHARS = 24;

/** Split n words into the fewest chunks of at most `max`, as evenly as possible (5 → 3+2, not 4+1). */
const balanced = (n: number, max: number): number[] => {
  const k = Math.max(1, Math.ceil(n / max));
  const base = Math.floor(n / k);
  return Array.from({length: k}, (_, i) => base + (i < n % k ? 1 : 0));
};

export const chunkWords = (words: VoiceWord[]): Chunk[] => {
  // 1. sentences: break on a sentence mark or a new script line
  const sentences: VoiceWord[][] = [];
  let cur: VoiceWord[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    if (w.brk === "sentence" || !next || next.line !== w.line) {
      sentences.push(cur);
      cur = [];
    }
  });
  // 2. clauses inside a sentence, merging a lone word into its neighbour
  const groups: VoiceWord[][] = [];
  for (const s of sentences) {
    const clauses: VoiceWord[][] = [];
    let c: VoiceWord[] = [];
    s.forEach((w, i) => {
      c.push(w);
      if (w.brk === "clause" || i === s.length - 1) {
        clauses.push(c);
        c = [];
      }
    });
    const merged: VoiceWord[][] = [];
    for (const cl of clauses) {
      const last = merged[merged.length - 1];
      if (last && (cl.length < MIN_WORDS || last.length < MIN_WORDS) && last.length + cl.length <= MAX_WORDS) {
        last.push(...cl);
      } else merged.push([...cl]);
    }
    groups.push(...merged);
  }
  // 3. balanced split by word count, then by characters
  const chunks: Chunk[] = [];
  for (const g of groups) {
    let i = 0;
    for (const size of balanced(g.length, MAX_WORDS)) {
      const part = g.slice(i, i + size);
      i += size;
      const chars = part.reduce((n, w) => n + w.text.length + 1, 0);
      const pieces = chars > MAX_CHARS && part.length > MIN_WORDS ? [part.slice(0, Math.ceil(part.length / 2)), part.slice(Math.ceil(part.length / 2))] : [part];
      for (const p of pieces) chunks.push({words: p, start: p[0].start, end: p[p.length - 1].end, line: p[0].line});
    }
  }
  return chunks;
};

export const Captions: React.FC<{
  voice: Voice;
  palette: Palette;
  uppercase?: boolean;
  size?: number;
  /** Distance of the caption block's bottom edge from the frame bottom, px. */
  bottom?: number;
  maxWidth?: number;
  /** Show `lines[].caption` (second language) under the main caption (§7e). */
  secondLanguage?: boolean;
}> = ({
  voice,
  palette,
  uppercase = true,
  size = 66,
  bottom = Math.round(H * SOUL.captionBottomShare),
  maxWidth = PANEL_MAX_W,
  secondLanguage = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const chunks = useMemo(() => chunkWords(voice.words), [voice.words]);

  const idx = chunks.findIndex((c, i) => {
    const next = chunks[i + 1];
    const until = next && next.start - c.end < MAX_GAP_SECONDS ? next.start : c.end + TAIL_SECONDS;
    return t >= c.start && t < until;
  });
  const chunk = idx >= 0 ? chunks[idx] : undefined;
  const line = voice.lines[chunk ? chunk.line : -1];
  const second = secondLanguage && line?.caption && t <= line.end + TAIL_SECONDS ? line.caption : undefined;
  const pop = chunk ? interpolate(t, [chunk.start, chunk.start + 0.12], [0.92, 1], {...clamp, easing: easeOut}) : 1;

  return (
    <>
      {chunk ? (
        <div
          style={{
            position: "absolute",
            left: PANEL_LEFT + (PANEL_MAX_W - maxWidth) / 2,
            width: maxWidth,
            bottom,
            textAlign: "center",
            transform: `scale(${pop})`,
            transformOrigin: "50% 100%",
            fontFamily: FONT.sans,
            fontWeight: 900,
            fontSize: size,
            lineHeight: 1.08,
            letterSpacing: -0.5,
            textTransform: uppercase ? "uppercase" : "none",
            WebkitTextStroke: "10px #000",
            paintOrder: "stroke fill",
            textShadow: "0 6px 18px rgba(0,0,0,0.6)",
            pointerEvents: "none",
          }}
        >
          {chunk.words.map((w, i) => {
            const next = chunk.words[i + 1];
            const speaking = t >= w.start && (next ? t < next.start : true);
            return (
              <span key={`${w.start}-${i}`} style={{color: speaking ? palette.accent : palette.text}}>
                {w.text}
                {i < chunk.words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ) : null}
      {second ? (
        <div
          style={{
            position: "absolute",
            left: PANEL_LEFT,
            width: PANEL_MAX_W,
            top: H - bottom + 22,
            textAlign: "center",
            fontFamily: FONT.sans,
            fontWeight: 600,
            fontSize: 32,
            lineHeight: 1.25,
            color: palette.accentSoft,
            textShadow: "0 0 4px #000, 0 2px 8px rgba(0,0,0,0.9)",
            display: "-webkit-box",
            WebkitLineClamp: SOUL.captionSecondLangMaxLines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {second}
        </div>
      ) : null}
    </>
  );
};
