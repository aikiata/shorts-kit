import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Chip} from "../../shared/caption/Chip";
import {STAGE_TOP} from "../../shared/frame/SafeZones";
import type {SceneComponent} from "../../shared/frame/ShortsTemplate";
import {glide} from "../../shared/motion/anim";
import narration from "./narration.json";

/**
 * TemplateScene is a placeholder so Studio opens before any scene exists.
 * Replace each entry in `scenes` with a real component (sk-scene, §5, §12);
 * lint warns while the placeholder is still used.
 */
const TemplateScene: SceneComponent = ({id, duration, palette}) => {
  const frame = useCurrentFrame();
  const drift = glide(frame, [0, duration], [0, -60]);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 240,
          top: 700 + drift,
          width: 600,
          height: 600,
          borderRadius: 300,
          background: `radial-gradient(circle, ${palette.accent}55, transparent 70%)`,
        }}
      />
      <Chip label={`scene: ${id}`} palette={palette} style={{left: 153, top: STAGE_TOP}} />
    </AbsoluteFill>
  );
};

/** Scene id (from narration.json) → component. Every id needs one. */
export const scenes: Record<string, SceneComponent> = Object.fromEntries(narration.scenes.map((s) => [s.id, TemplateScene]));
