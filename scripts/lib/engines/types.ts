import type {NarrationVoice} from "../narration";

export type EngineLine = {scene: string; index: number; spoken: string};

export type Timed = {start: number; end: number};

/**
 * What an engine returns: audio files, each holding one or more consecutive
 * lines, with each line's [start, end] in that file (seconds) and, when the
 * engine knows them, the spoken word times.
 *
 * - one file per line (`say`, `edge`): a segment per line;
 * - one file for the whole script (`elevenlabs`): one segment, every line.
 *   `bun run tts` cuts it at the quietest point between lines (§4).
 */
export type Segment = {file: string; lines: (Timed & {words?: Timed[] | null})[]};

export type Engine = {
  name: string;
  /** Voice used when narration.json does not name one. */
  defaultVoice: string;
  synth: (lines: EngineLine[], voice: NarrationVoice, workDir: string) => Promise<Segment[]>;
};
