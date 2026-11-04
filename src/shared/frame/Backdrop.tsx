import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import type {Palette} from "../theme";

/**
 * Soft gradient background with a slow drifting glow, for scenes that do not
 * fill the frame themselves. Motion is measured in seconds, not frames, so it
 * drifts at the same speed at 30 or 60 fps.
 */
export const Backdrop: React.FC<{palette: Palette}> = ({palette: p}) => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  const dx = Math.sin(t / 3) * 6;
  const dy = Math.cos(t / 4) * 4;
  return (
    <AbsoluteFill style={{background: `linear-gradient(165deg, ${p.surface} 0%, ${p.deep} 55%, ${p.bg} 100%)`}}>
      <AbsoluteFill
        style={{background: `radial-gradient(800px 600px at ${30 + dx}% ${30 + dy}%, ${p.accent}26, transparent 70%)`}}
      />
      <AbsoluteFill
        style={{background: `radial-gradient(700px 520px at ${75 - dx}% ${75 - dy}%, ${p.accentSoft}14, transparent 72%)`}}
      />
      <AbsoluteFill
        style={{background: "radial-gradient(ellipse 80% 60% at 50% 45%, transparent 45%, rgba(0,0,0,0.55) 100%)"}}
      />
    </AbsoluteFill>
  );
};
