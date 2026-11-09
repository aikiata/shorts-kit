import React from "react";
import {Composition, registerRoot, Still} from "remotion";
import {loadFont} from "../../shared/font";
import {FORMATS, type Orientation} from "../../shared/format";
import "./knowns-ui/knowns-ui.css";
import {Cover} from "./Cover";
import {Cut16, Cut6, FRAMES16, FRAMES6} from "./cuts";
import {DURATION, FPS} from "./timing";
import {Video} from "./Video";
import meta from "./video.json";

loadFont();

/** Canvas from video.json (portrait 1080×1920 or landscape 1920×1080). */
const {w: W, h: H} = FORMATS[meta.format as Orientation];

/** Own root per video, fixed ids `Video` and `Cover` (scripts/remotion.ts relies on them). */
const Root: React.FC = () => (
  <>
    <Composition id="Video" component={Video} durationInFrames={DURATION} fps={FPS} width={W} height={H} defaultProps={{safe: false}} />
    {/* cutdowns (rule 15): render with `bunx remotion render src/videos/knowns-tvc-v4/entry.tsx Cut16 <file>` */}
    <Composition id="Cut16" component={Cut16} durationInFrames={FRAMES16} fps={FPS} width={W} height={H} defaultProps={{safe: false}} />
    <Composition id="Cut6" component={Cut6} durationInFrames={FRAMES6} fps={FPS} width={W} height={H} defaultProps={{safe: false}} />
    <Still id="Cover" component={Cover} width={W} height={H} defaultProps={{safe: false}} />
  </>
);

registerRoot(Root);
