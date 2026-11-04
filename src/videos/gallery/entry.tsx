import React from "react";
import {Composition, registerRoot} from "remotion";
import {FPS, H, W} from "../../shared/theme";
import {GALLERY_FRAMES, Gallery} from "./Gallery";

const Root: React.FC = () => <Composition id="Video" component={Gallery} width={W} height={H} fps={FPS} durationInFrames={GALLERY_FRAMES} />;

registerRoot(Root);
