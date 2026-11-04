import React from "react";
import {AbsoluteFill} from "remotion";
import {COVER_BAND, PANEL_LEFT, PANEL_MAX_W} from "../../shared/frame/SafeZones";
import {SafeCheck} from "../../shared/frame/SafeCheck";
import {Clouds, Sea, Sky, Sun, type SkyPreset} from "../../shared/nature";
import {DEFAULT_PALETTE, FONT, W} from "../../shared/theme";

/**
 * The cover is its own composition, not a frame of the cut (§10): the same sky,
 * no captions. Text sits inside COVER_BAND (the 1:1.29 grid crop, y 263–1657),
 * the bottom-left corner stays free for the view-count badge, and the answer
 * (scattering) is withheld: the cover only asks.
 */
const p = DEFAULT_PALETTE;
const HORIZON_Y = 1640;
const SKY: SkyPreset = {top: "#1C66AE", low: "#BFE0F0", sea: "#2B7FA6", deep: "#0B3A55", wave: 0.5, light: 1};
const SHADOW = "0 6px 24px rgba(4,24,48,0.55), 0 2px 4px rgba(4,24,48,0.5)";

export const Cover: React.FC<{safe: boolean}> = ({safe}) => (
  <SafeCheck safe={safe} cover>
    <AbsoluteFill>
      <Sky sky={SKY} horizon={HORIZON_Y} />
      <Sun x={820} y={COVER_BAND.top + 150} size={130} on={1} horizon={HORIZON_Y} />
      <Clouds sky="day" count={3} seed={3} horizon={HORIZON_Y} frame={0} />
      <Sea sky={SKY} horizon={HORIZON_Y} glitter={false} frame={0} />
      {/* soft dark pool behind the type so white letters hold on a bright sky */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: COVER_BAND.top + 330,
          height: 900,
          background: "radial-gradient(55% 50% at 50% 50%, rgba(6,34,70,0.45), rgba(6,34,70,0) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PANEL_LEFT,
          width: PANEL_MAX_W,
          top: COVER_BAND.top + 400,
          textAlign: "center",
          fontFamily: FONT.sans,
          color: p.text,
          textShadow: SHADOW,
        }}
      >
        <div style={{fontSize: 46, fontWeight: 800, letterSpacing: 5, color: "#FFF6D6"}}>SUNLIGHT IS WHITE</div>
        <div style={{fontSize: 118, fontWeight: 900, lineHeight: 1, marginTop: 40, letterSpacing: -2}}>SO WHY IS</div>
        <div style={{fontSize: 118, fontWeight: 900, lineHeight: 1, letterSpacing: -2}}>THE SKY</div>
        <div style={{fontSize: 236, fontWeight: 900, lineHeight: 0.95, letterSpacing: -6, marginTop: 14}}>BLUE?</div>
      </div>
    </AbsoluteFill>
  </SafeCheck>
);
