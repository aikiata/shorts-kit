import {AbsoluteFill, Audio, continueRender, delayRender, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";
import {Captions} from "../../shared/caption/Captions";
import {loadChannelFont} from "../../shared/font";
import {PANEL_MAX_W, SAFE_TOP, SafeZones} from "../../shared/frame/SafeZones";
import {Watermark} from "../../shared/frame/Watermark";
import {MAP} from "../../shared/theme";
import {Grade} from "./Grade";
import {INK} from "./ink";
import {flickerAt, SHOT_SCENE} from "./scenes";
import {AUDIO, DURATION, EN, SHOTS, ShotContext, shotAt, shotById, type ShotId, WORDS} from "./timing";

let avatarStarted = false;

/**
 * The buzz of fluorescent lights (`hum.mp3`, synthesised with ffmpeg: 120 Hz plus
 * harmonics, with pink noise added). Low under the voice the whole video, louder on the closing line.
 * Each light flicker in the closing line has a click (`flick.mp3`).
 */
const CHOT = shotById("chot").start;
const humVolume = (f: number) =>
  interpolate(f, [0, 30, CHOT - 20, CHOT + 20, DURATION - 30, DURATION], [0, 0.1, 0.1, 0.3, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
const FLICKS = Array.from({length: DURATION}, (_, f) => f).filter((f) => flickerAt(f) && !flickerAt(f - 1));

const Sound = () => (
  <>
    <Audio src={staticFile("audio/liminal-space/hum.mp3")} volume={humVolume} />
    {FLICKS.map((f) => (
      <Sequence key={f} from={f} durationInFrames={6} layout="none">
        <Audio src={staticFile("audio/liminal-space/flick.mp3")} volume={0.35} />
      </Sequence>
    ))}
  </>
);

/** Every cut between two pictures crossfades over `XFADE` frames, no dip to black. */
const XFADE = 12;
/** Shots entered with a hard cut: the feeling's name, since it has its own glitch and flash. */
const HARD = new Set<ShotId>(["ten"]);

const preloadAvatar = () => {
  if (avatarStarted || typeof document === "undefined") return;
  avatarStarted = true;
  const handle = delayRender("nap dau kenh");
  const image = new Image();
  image.onload = () => continueRender(handle);
  image.onerror = () => continueRender(handle);
  image.src = staticFile("img/avatar.jpg");
};

export const LiminalSpace: React.FC<{safe?: boolean}> = ({safe = false}) => {
  const frame = useCurrentFrame();
  loadChannelFont();
  preloadAvatar();
  const shot = shotAt(frame);
  const Scene = SHOT_SCENE[shot.id];
  const prev = SHOTS[SHOTS.indexOf(shot) - 1];
  const local = frame - shot.start;
  const crossing = prev && !HARD.has(shot.id) && local < XFADE;
  const Prev = crossing ? SHOT_SCENE[prev.id] : null;

  return (
    <AbsoluteFill style={{background: INK.bg, color: INK.text}}>
      {AUDIO ? <Audio src={staticFile(AUDIO)} /> : null}
      <Sound />
      {Prev ? (
        <ShotContext.Provider value={prev}>
          <Prev key={`prev-${prev.id}`} />
        </ShotContext.Provider>
      ) : null}
      <ShotContext.Provider value={shot}>
        <AbsoluteFill key={shot.id} style={{opacity: crossing ? local / XFADE : 1}}>
          <Scene />
        </AbsoluteFill>
      </ShotContext.Provider>
      <Grade />
      <Captions words={WORDS} palette={MAP} variant="map" maxWidth={PANEL_MAX_W} en={EN} />
      <Watermark top={SAFE_TOP + 8} />
      {safe ? <SafeZones /> : null}
    </AbsoluteFill>
  );
};
