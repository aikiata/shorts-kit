/**
 * Every external process goes through here, with a hard timeout. A hung
 * process (a TTS socket, a render) must fail loudly, not wait forever.
 */
export type RunResult = {code: number; stdout: Buffer; stderr: string; timedOut: boolean};

export const run = async (
  cmd: string,
  args: string[],
  opts: {timeoutMs?: number; inherit?: boolean; cwd?: string; env?: Record<string, string | undefined>} = {},
): Promise<RunResult> => {
  const timeoutMs = opts.timeoutMs ?? 120_000;
  const proc = Bun.spawn([cmd, ...args], {
    cwd: opts.cwd,
    env: opts.env ? {...process.env, ...opts.env} : process.env,
    stdout: opts.inherit ? "inherit" : "pipe",
    stderr: opts.inherit ? "inherit" : "pipe",
    stdin: "ignore",
  });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill("SIGKILL");
  }, timeoutMs);
  const [stdout, stderr] = await Promise.all([
    opts.inherit ? Promise.resolve(Buffer.alloc(0)) : new Response(proc.stdout as ReadableStream).arrayBuffer().then((b) => Buffer.from(b)),
    opts.inherit ? Promise.resolve("") : new Response(proc.stderr as ReadableStream).text(),
  ]);
  const code = await proc.exited;
  clearTimeout(timer);
  return {code: timedOut ? 124 : code, stdout, stderr, timedOut};
};

/** Run and throw with the command's stderr on failure or timeout. */
export const must = async (cmd: string, args: string[], opts: Parameters<typeof run>[2] = {}) => {
  const r = await run(cmd, args, opts);
  if (r.timedOut) throw new Error(`${cmd} timed out after ${(opts.timeoutMs ?? 120_000) / 1000}s: ${cmd} ${args.join(" ")}`);
  if (r.code !== 0) throw new Error(`${cmd} exited ${r.code}: ${cmd} ${args.join(" ")}\n${r.stderr.slice(-2000)}`);
  return r;
};

export const ffprobeJson = async (file: string, extra: string[] = []) => {
  const r = await must("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", ...extra, file], {timeoutMs: 30_000});
  return JSON.parse(r.stdout.toString("utf8")) as {
    format: {duration?: string; size?: string};
    streams: Record<string, any>[];
  };
};

export const duration = async (file: string) => Number((await ffprobeJson(file)).format.duration ?? NaN);

/** Decode any audio file to mono float32 PCM at `rate` Hz. */
export const decodePcm = async (file: string, rate = 48000, filter?: string): Promise<Float32Array> => {
  const args = ["-v", "error", "-i", file, ...(filter ? ["-af", filter] : []), "-ac", "1", "-ar", String(rate), "-f", "f32le", "pipe:1"];
  const r = await must("ffmpeg", args, {timeoutMs: 120_000});
  const buf = r.stdout;
  return new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};

/** Measure integrated loudness and true peak with ffmpeg's ebur128 filter. */
export const loudness = async (file: string) => {
  const r = await run("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-"], {
    timeoutMs: 300_000,
  });
  const summary = r.stderr.slice(r.stderr.lastIndexOf("Summary:"));
  const I = Number(summary.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]);
  const peak = Number(summary.match(/Peak:\s+(-?[\d.]+|-inf) dBFS/)?.[1]);
  return {I, truePeak: peak};
};
