import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {shotAt} from "./timing";

/**
 * Whole-video overlay: film grain, dark vignette, a VHS-tape scan band (Kane Pixels shoots
 * with an old-camcorder look), and one light flash when the feeling's name appears.
 */
export const Grade = () => {
  const frame = useCurrentFrame();
  const shot = shotAt(frame);
  const local = frame - shot.start;
  const flash = shot.id === "ten" ? interpolate(local, [0, 9], [0.4, 0], {extrapolateRight: "clamp"}) : 0;
  const seed = frame % 24;
  const scan = (frame * 7) % 1920;
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <AbsoluteFill style={{background: "radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)"}} />
      <svg width={1080} height={1920} style={{position: "absolute", inset: 0, opacity: 0.1, mixBlendMode: "overlay"}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <div style={{position: "absolute", left: 0, right: 0, top: scan, height: 60, background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.05), rgba(255,255,255,0))"}} />
      {flash > 0 ? <AbsoluteFill style={{background: "#fff8d0", opacity: flash}} /> : null}
    </AbsoluteFill>
  );
};
