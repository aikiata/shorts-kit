import React from "react";
import {Composition, registerRoot, Still} from "remotion";
import {loadFont} from "../../shared/font";
import {H, W} from "../../shared/theme";
import {Cover} from "./Cover";
import {DURATION, FPS} from "./timing";
import {Video} from "./Video";

loadFont();

/** Own root per video, fixed ids `Video` and `Cover` (scripts/remotion.ts relies on them). */
const Root: React.FC = () => (
  <>
    <Composition id="Video" component={Video} durationInFrames={DURATION} fps={FPS} width={W} height={H} defaultProps={{safe: false}} />
    <Still id="Cover" component={Cover} width={W} height={H} defaultProps={{safe: false}} />
  </>
);

registerRoot(Root);
