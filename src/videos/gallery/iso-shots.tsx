import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {ease, easeOut, glide, ramp} from "../../shared/motion/anim";
import {IsoPlane, OnPlane, pileZ, Slab} from "../../shared/motion/iso";
import {DEFAULT_PALETTE as P, FONT} from "../../shared/theme";

/**
 * Isometric shots for the gallery (docs/shots/camera/isometric-pile.md). Placeholder cards, not facts: a pile
 * dealt faster and faster, then the top card turns from isometric to face the viewer.
 */
const CARDS = ["Top 10 apps", "Top 15 apps", "Best of 2025", "20 must-haves", "Top 10 again", "Essential apps", "Top 12 apps", "Best free apps"];
const DROP_AT = (i: number) => Math.round(4 + 54 * Math.pow(i / CARDS.length, 0.62));
const TURN: [number, number] = [96, 124];
const Card: React.FC<{t: string; top?: boolean}> = ({t, top}) => (
  <div style={{width: "100%", height: "100%", boxSizing: "border-box", background: P.surface, border: `2px solid ${top ? P.accent : "rgba(255,255,255,0.14)"}`, borderRadius: 18, padding: "22px 26px", fontFamily: FONT.sans, color: P.text}}>
    <div style={{fontSize: 34, fontWeight: 700}}>{t}</div>
    <div style={{display: "flex", gap: 14, marginTop: 22}}>
      {[P.accent, P.good, P.warn, P.muted].map((c) => (
        <div key={c} style={{width: 60, height: 60, borderRadius: 14, background: c, opacity: 0.85}} />
      ))}
    </div>
  </div>
);

const Pile: React.FC = () => {
  const f = useCurrentFrame();
  const turn = 1 - glide(f, TURN, [0, 1], ease);
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, ${P.surface}, ${P.bg} 70%)`}}>
      <IsoPlane cx={560} cy={960} scale={1.5}>
        {CARDS.slice(0, -1).map((t, i) => {
          const a = ramp(f, DROP_AT(i), 9, easeOut);
          return (
            <OnPlane key={t} x={((i * 37) % 70) - 35} y={((i * 53) % 60) - 30} z={pileZ(i, 22, a)} rz={((i * 29) % 9) - 4} opacity={Math.min(1, a * 3) * turn}>
              <Slab w={520} h={300} depth={12}>
                <Card t={t} />
              </Slab>
            </OnPlane>
          );
        })}
      </IsoPlane>
      {/* the top card: dropped like the rest, then turned to face the viewer (t: 1 → 0) */}
      <IsoPlane cx={560 - (1 - turn) * 20} cy={960 - (1 - turn) * 120} t={turn} scale={1.5 - (1 - turn) * 0.1}>
        <OnPlane z={pileZ(CARDS.length - 1, 22, ramp(f, DROP_AT(CARDS.length - 1), 9, easeOut)) * turn} opacity={Math.min(1, ramp(f, DROP_AT(CARDS.length - 1), 9, easeOut) * 3)}>
          <Slab w={520} h={300} depth={Math.round(12 * turn)}>
            <Card t={CARDS[CARDS.length - 1]} top />
          </Slab>
        </OnPlane>
      </IsoPlane>
    </AbsoluteFill>
  );
};

export const ISO_SHOTS: {Component: React.FC; label: string; note: string; frames?: number}[] = [
  {Component: Pile, label: "shared/motion/iso: IsoPlane, Slab, OnPlane, pileZ", note: "a pile dealt faster and faster, then the top card turns to face you", frames: 150},
];
