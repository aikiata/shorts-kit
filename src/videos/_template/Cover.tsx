import React from "react";
import {AbsoluteFill} from "remotion";
import {Backdrop} from "../../shared/frame/Backdrop";
import {COVER_BAND, PANEL_LEFT, PANEL_MAX_W} from "../../shared/frame/SafeZones";
import {SafeCheck} from "../../shared/frame/SafeCheck";
import {DEFAULT_PALETTE, FONT} from "../../shared/theme";

/**
 * The cover is its own composition, not a frame of the cut (§10). Keep text
 * inside COVER_BAND (the 1:1.29 grid crop), one big number, about three words,
 * no spoiler, no logo. Check it at 200 px wide (sk-handoff).
 */
const p = DEFAULT_PALETTE;

export const Cover: React.FC<{safe: boolean}> = ({safe}) => (
  <SafeCheck safe={safe} cover>
    <AbsoluteFill>
      <Backdrop palette={p} />
      <div
        style={{
          position: "absolute",
          left: PANEL_LEFT,
          width: PANEL_MAX_W,
          top: COVER_BAND.top + 260,
          textAlign: "center",
          fontFamily: FONT.sans,
          color: p.text,
        }}
      >
        <div style={{fontSize: 44, fontWeight: 800, letterSpacing: 4, color: p.accentSoft}}>TOPIC KICKER</div>
        <div style={{fontSize: 360, fontWeight: 900, lineHeight: 1, color: p.warn}}>00</div>
        <div style={{fontSize: 96, fontWeight: 900}}>Not X</div>
      </div>
    </AbsoluteFill>
  </SafeCheck>
);
