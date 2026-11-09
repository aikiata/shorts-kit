// clipcard-looping: ClipCard crossfade-loop regression card
// Covers the three edge scenarios named in the maintainer's review:
//   1) Crossfade loop with muted=false: the outgoing/incoming layers fade volume in complementary fashion, so the
//      overlap region does not stack two full-volume audio tracks;
//   2) startFrom>0 combined with loop: effective loop step = loopDurationInFrames - startFrom,
//      otherwise each layer plays from startFrom but steps by the full length, freezing at the end of the footage;
//   3) A short Sequence embedded in a long Composition: the layer count is computed from the shot duration (durationInFrames prop),
//      not the total Composition duration, so no layers are generated that will never be seen.
//
// Footage: ClipCard's src is a real mp4 under public/. Before rendering this demo, put a short
// video at the project's public/clips/clipcard-demo.mp4 (30fps and square recommended).
// The three scenarios share the same footage but are driven by different parameters, for easy side-by-side playback.
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { ClipCard } from '../../../shared/frame/ClipCard';

export const CLIPCARD_LOOPING_DURATION = 120; // 4s @30fps
const CLIP = 'clips/clipcard-demo.mp4';

export const ClipCardLooping: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: '#0b0b0f',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 36,
      }}
    >
      {/* Scenario 1: muted=false + loop: volume complementary fade, no doubled audio layers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <ClipCard
          src={CLIP}
          muted={false}
          loopDurationInFrames={60}
          loopCrossfadeInFrames={10}
          durationInFrames={120}
          size={200}
          caption="muted=false · loop"
          captionSize={11}
        />
        {/* Scenario 2: startFrom=12 + loop: effective step 60-12=48 */}
        <ClipCard
          src={CLIP}
          muted
          startFrom={12}
          loopDurationInFrames={60}
          loopCrossfadeInFrames={10}
          durationInFrames={120}
          size={200}
          caption="startFrom=12 · loop"
          captionSize={11}
        />
      </div>

      {/* Scenario 3: short Sequence (120f) embedded in a long Composition (durationInFrames not passed,
          the layer count is computed from the composition duration of useVideoConfig → durationInFrames must be passed explicitly;
          here a Sequence wrapper simulates the "short shot in a long project" structure) */}
      <Sequence name="short-shot" from={0} durationInFrames={120} layout="none">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <ClipCard
            src={CLIP}
            muted
            loopDurationInFrames={45}
            loopCrossfadeInFrames={8}
            durationInFrames={120}
            size={200}
            caption="45f clip · 120f shot"
            captionSize={11}
          />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
