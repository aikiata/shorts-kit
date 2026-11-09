import React from "react";
import {AbsoluteFill} from "remotion";
import {useFormat} from "../../shared/format";
import {Backdrop} from "../../shared/frame/Backdrop";
import {SafeCheck} from "../../shared/frame/SafeCheck";
import {DEFAULT_PALETTE, FONT} from "../../shared/theme";

/**
 * The poster frame: its own composition, not a frame of the film. One headline,
 * inside the safe area. A 16:9 poster is not cropped by a profile grid.
 */
const p = DEFAULT_PALETTE;

const Poster: React.FC = () => {
  const {safe, h} = useFormat();
  return (
    <AbsoluteFill>
      <Backdrop palette={p} />
      <div style={{position: "absolute", left: safe.panelLeft, width: safe.panelMaxW, top: h * 0.38, textAlign: "center", fontFamily: FONT.sans, color: p.text}}>
        <div style={{fontSize: 44, fontWeight: 800, letterSpacing: 4, color: p.accentSoft}}>PRODUCT</div>
        <div style={{fontSize: 140, fontWeight: 900, lineHeight: 1.05}}>One line</div>
      </div>
    </AbsoluteFill>
  );
};

export const Cover: React.FC<{safe: boolean}> = ({safe}) => (
  <SafeCheck safe={safe} cover>
    <Poster />
  </SafeCheck>
);
