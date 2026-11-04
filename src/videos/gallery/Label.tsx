import React from "react";
import {useCurrentFrame} from "remotion";
import {fade} from "../../shared/motion/anim";
import {FONT} from "../../shared/theme";

/** Gallery caption: the import path and what the shot shows, top-left inside the safe area. */
export const Label: React.FC<{path: string; note: string; n: number; of: number}> = ({path, note, n, of}) => {
  const frame = useCurrentFrame();
  const on = fade(frame, 0, 8);
  return (
    <div style={{position: "absolute", left: 60, top: 240, maxWidth: 774, opacity: on, transform: `translateY(${(1 - on) * 12}px)`}}>
      <div
        style={{
          display: "inline-block",
          padding: "14px 22px",
          borderRadius: 14,
          background: "rgba(6,12,18,0.72)",
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        <div style={{fontFamily: FONT.mono, fontSize: 30, fontWeight: 600, color: "#A6E9FF"}}>{path}</div>
        <div style={{fontFamily: FONT.sans, fontSize: 28, fontWeight: 500, color: "#FFFFFF", marginTop: 6}}>{note}</div>
        <div style={{fontFamily: FONT.sans, fontSize: 22, fontWeight: 600, color: "#A7B4C2", marginTop: 8, letterSpacing: 2}}>
          {n} / {of}
        </div>
      </div>
    </div>
  );
};
