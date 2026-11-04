import React from "react";
import {useCurrentFrame} from "remotion";

/** Things with wheels: a covered wagon and a field gun. */

/** A covered wagon with its horse; the wheels turn with the frame. */
export const Wagon: React.FC<{x: number; y: number; s?: number; frame?: number}> = ({x, y, s = 1, frame: frameProp}) => {
  const now = useCurrentFrame();
  const frame = frameProp ?? now;
  return (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -120 -60 Q -110 -170 0 -175 Q 110 -170 120 -60 Z" fill="#EDE6D2" stroke="#B9AE90" strokeWidth={4} />
    {[-60, 0, 60].map((rx) => (
      <path key={rx} d={`M ${rx} -60 Q ${rx} -150 ${rx * 0.9} -172`} stroke="#C9BFA3" strokeWidth={3} fill="none" />
    ))}
    <rect x={-130} y={-70} width={260} height={34} fill="#7A5A3A" />
    {[-85, 85].map((wx) => (
      <g key={wx} transform={`translate(${wx} -26) rotate(${(frame * 4) % 360})`}>
        <circle r={30} fill="none" stroke="#4A3422" strokeWidth={6} />
        {[0, 45, 90, 135].map((a) => (
          <line key={a} x1={-28 * Math.cos((a * Math.PI) / 180)} y1={-28 * Math.sin((a * Math.PI) / 180)} x2={28 * Math.cos((a * Math.PI) / 180)} y2={28 * Math.sin((a * Math.PI) / 180)} stroke="#4A3422" strokeWidth={3} />
        ))}
      </g>
    ))}
    {/* the horse in front */}
    <g transform="translate(200 0)">
      <path d="M -50 -64 Q 0 -86 50 -66 L 70 -100 Q 84 -104 92 -92 L 74 -56 Q 60 -44 44 -46 L -46 -44 Z" fill="#6B4A30" />
      {[-40, -20, 30, 46].map((lx, i) => (
        <line key={lx} x1={lx} y1={-46} x2={lx + Math.sin(frame / 4 + i * 1.6) * 10} y2={0} stroke="#4E3420" strokeWidth={8} strokeLinecap="round" />
      ))}
    </g>
  </g>
);
};

/** A field gun, barrel to the right (`s` negative to face left). `fire` 0–1 draws the muzzle flash and smoke puff. */
export const Cannon: React.FC<{x: number; y: number; s?: number; fire: number}> = ({x, y, s = 1, fire}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -70 -40 L 80 -60 L 82 -44 L -66 -24 Z" fill="#2E2F33" />
    <circle cx={-10} cy={-30} r={34} fill="none" stroke="#5B4630" strokeWidth={8} />
    {[0, 60, 120].map((a) => (
      <line key={a} x1={-10 - 30 * Math.cos((a * Math.PI) / 180)} y1={-30 - 30 * Math.sin((a * Math.PI) / 180)} x2={-10 + 30 * Math.cos((a * Math.PI) / 180)} y2={-30 + 30 * Math.sin((a * Math.PI) / 180)} stroke="#5B4630" strokeWidth={4} />
    ))}
    <path d="M -40 -20 L -120 0" stroke="#5B4630" strokeWidth={10} strokeLinecap="round" />
    {fire > 0 ? (
      <g opacity={fire}>
        <path d="M 82 -52 L 150 -90 L 136 -60 L 176 -56 L 136 -44 L 150 -16 Z" fill="#FFD36B" />
        <circle cx={120} cy={-52} r={60 + (1 - fire) * 80} fill="#EDE9E2" opacity={0.55} />
      </g>
    ) : null}
  </g>
);
