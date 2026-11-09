import React from "react";
import {Composition, registerRoot, Still} from "remotion";
import {loadFont} from "../../shared/font";
import {FORMATS, type Orientation} from "../../shared/format";
import {Cover} from "./Cover";
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
    <Still id="Cover" component={Cover} width={W} height={H} defaultProps={{safe: false}} />
  </>
);

registerRoot(Root);
