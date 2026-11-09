import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {useFormat} from "../../shared/format";
import type {SceneComponent} from "../../shared/frame/ShortsTemplate";
import {glide} from "../../shared/motion/anim";
import {FONT} from "../../shared/theme";
import {PROMO} from "./timing";

/**
 * Placeholder so Studio opens before any scene exists. Replace each entry in
 * `scenes` with a real component (sk-scene). Read the canvas and safe area from
 * useFormat(), never from fixed numbers: this video may be portrait or landscape.
 */
const TemplateScene: SceneComponent = ({id, duration, palette}) => {
  const frame = useCurrentFrame();
  const {w, h, safe} = useFormat();
  const drift = glide(frame, [0, duration], [0, -h * 0.05]);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: w * 0.3,
          top: h * 0.3 + drift,
          width: h * 0.4,
          height: h * 0.4,
          borderRadius: h * 0.2,
          background: `radial-gradient(circle, ${palette.accent}55, transparent 70%)`,
        }}
      />
      <div style={{position: "absolute", left: safe.panelLeft, top: safe.stageTop, fontFamily: FONT.sans, fontWeight: 800, fontSize: 44, letterSpacing: 4, color: palette.accentSoft}}>
        {`SCENE: ${id.toUpperCase()}`}
      </div>
    </AbsoluteFill>
  );
};

/** Scene id (from promo.json) → component. Every id needs one. */
export const scenes: Record<string, SceneComponent> = Object.fromEntries(PROMO.scenes.map((s) => [s.id, TemplateScene]));
