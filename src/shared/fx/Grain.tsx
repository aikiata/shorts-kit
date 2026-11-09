import React, {useId} from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {svgId} from "../random";

/**
 * Fine film grain over the frame, new pattern every two frames. Put it near the
 * top of the stack so a flat vector scene reads as an image, not a slide.
 */
export const Grain: React.FC<{opacity?: number; frequency?: number; frame?: number}> = ({opacity = 0.22, frequency = 0.85, frame}) => {
  const now = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const f = frame ?? now;
  const id = svgId(useId(), "grain");
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none", mixBlendMode: "overlay", opacity}}>
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves={2} seed={Math.floor(f / 2) % 97} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={W} height={H} filter={`url(#${id})`} />
    </svg>
  );
};
