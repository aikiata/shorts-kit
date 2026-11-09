// white-flash-logo-simplify-cut: White Flash Simplify (blow out to white, drop to the flat version)
// A liquid-metal colored wordmark sits with flowing light; after a charge-up a white flash blows out from the center of the letters, and when the exposure recovers the same spot holds the flat wordmark:
// one white flash completes the step down from "fancy show" to "formal identity".
//
// Second-round redesign (aurora, liquid metal -> paper finish):
// - look = aurora (dark-stage show segment); after the flash it lands on the shorts-kit editing paper (brand colors folded in: paper / ink / amber).
//   The wordmark is the brand mark "shorts-kit" (all lowercase, wordmark font at weight 700; 15 characters, so the font size is pushed down to FS),
//   and both versions share the same size and position: the viewer reads "the same wordmark, purified", not a swapped image.
// - The liquid segment is a "real material", not a single gradient: (1) a flowing iridescent base (purple -> pink -> peach -> ice blue, background-size 300%, slow flow)
//   (2) vertical light-to-dark (bright top, dark bottom, reads as volume) (3) a chrome horizon reflection band across the waist of the letters (4) one diagonal highlight sweep (Q4: only the hero gets one,
//   clipped into the glyphs) (5) soft bloom under the letters + ground reflection (flipped, fading). Behind it a trace of aurora glow + floating dust.
// - The white flash is not a uniform fade over the whole screen but "light bursting out of the letters": in the charge-up the wordmark brightens and a horizontal anamorphic lens flare stretches from the letter center,
//   then a white radial blob fills the full screen from the letter center within 6f (quadratic ease-in, faster and faster).
// - The finish segment uses "exposure recovery" instead of a fade-in: the white layer leaves over 22f with quint-out, like eyes adjusting to bright light; the flat wordmark is already in place underneath,
//   with only a 1.03->1 focus settle; then above the wordmark the lens-carved mark is drawn (viewfinder frame reveals first, amber slash wipes in after),
//   a short amber line is drawn, and the brand tagline rises word by word, completing the lock-up frame (the mark itself gets no liquid texture: brand rules forbid gradients and glow).
//
// Timeline (30fps, 120f total):
//   0-34    Show: liquid wordmark present (from frame 0), iridescence flowing slowly, highlight sweeps once over 6-34f, whole frame eases 1->1.035
//   34-46   Charge-up: wordmark brightness 1->1.7, bloom strengthens, horizontal flare stretches open (ease-in)
//   44-50   Blow-out: radial white blob fills from the letter center (quadratic ease-in), 50-54 pure white hold (breathing room)
//   54-76   Exposure recovery: white layer 1->0 (quint-out); flat wordmark 1.03->1 focus settle
//   72-96   Lock-up: amber line drawn 72-86, mark drawn 74-96, brand tagline rises word by word from 78f
//   96-120  hold: very slow push-in 1->1.01, freeze
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, Grain, Vignette, mix, ramp } from '../../../shared/fixtures/Polish';
import { Dust, LOOKS, Stage, TextReveal, alpha, type } from '../../../shared/fixtures/Look';
import { BRAND, PITCH, ShortKitMark } from '../../../shared/fixtures/Brand';

export const WHITE_FLASH_LOGO_SIMPLIFY_CUT_DURATION = 120;

const L = LOOKS.aurora;
const WORD = BRAND.name; // wordmark is all lowercase
const FS = 190; // 15-character wordmark: font size is squeezed to fit the frame width (the original 4-letter placeholder mark was 300)
const CY = 500; // wordmark center y
const FLASH0 = 44;
const WHITE = 50; // pure white, the swap frame
const RECOVER = 54;

// Three colors of the flat version: paper / ink / accent (change only these three when swapping brands): shorts-kit: editing paper / set ink / lens amber
const PAPER: [string, string] = ['#f7f5f0', '#ebe7de'];
const FLAT_INK: string = BRAND.ink;
const FLAT_ACCENT: string = BRAND.amber;
const MARK = 124; // size of the lens-carved mark above the wordmark in the lock-up

const wordStyle: React.CSSProperties = {
  fontFamily: BRAND.font, fontSize: FS, fontWeight: 700, letterSpacing: '0.03em', lineHeight: 1, whiteSpace: 'nowrap',
};

// Wordmark text: no letter spacing after the f in "ft", so the two crossbars overlap: with +0.03em spacing the two crossbars just touch,
// and at large sizes an anti-aliased bright line shows at the seam
const wordText = (
  WORD.includes('f') ? <>{WORD.slice(0, WORD.lastIndexOf('f'))}<span style={{ letterSpacing: 0 }}>f</span>{WORD.slice(WORD.lastIndexOf('f') + 1)}</> : <>{WORD}</>
);

const IRIS = 'linear-gradient(100deg, #7c6bff 0%, #b18cff 16%, #f472b6 32%, #ffc6a8 46%, #8fdcff 62%, #7c6bff 78%, #c58cff 90%, #7c6bff 100%)';

const centered = (y: number): React.CSSProperties => ({
  position: 'absolute', left: 0, right: 0, top: y - FS * 0.5, height: FS, display: 'flex', justifyContent: 'center', alignItems: 'center',
});

// Liquid wordmark (one span with multiple stacked backgrounds, all clipped to the glyphs)
const LiquidWord: React.FC<{ frame: number; bright: number }> = ({ frame, bright }) => {
  const flow = (frame * 1.1) % 300;
  const sheen = ramp(frame, 6, 28, EASE.swift); // diagonal highlight sweeps once
  const sx = mix(-30, 130, sheen);
  const layers = [
    // diagonal highlight (appears only during 6-34f)
    sheen > 0 && sheen < 1
      ? `linear-gradient(105deg, rgba(255,255,255,0) ${sx - 10}%, rgba(255,255,255,0.85) ${sx}%, rgba(255,255,255,0) ${sx + 10}%)`
      : 'linear-gradient(0deg, transparent, transparent)',
    // chrome horizon: a bright band at the waist of the letters + a dark band below it
    'linear-gradient(180deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.34) 49%, rgba(255,255,255,0.1) 52%, rgba(40,10,70,0.28) 56%, rgba(40,10,70,0) 68%)',
    // vertical volume: bright top, dark bottom
    'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 38%, rgba(20,5,40,0) 60%, rgba(20,5,40,0.45) 100%)',
    IRIS,
  ];
  return (
    <span style={{
      ...wordStyle,
      backgroundImage: layers.join(', '),
      backgroundSize: '100% 100%, 100% 100%, 100% 100%, 300% 100%',
      backgroundPosition: `0 0, 0 0, 0 0, ${flow}% 0`,
      WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
      filter: bright > 1.001 ? `brightness(${bright.toFixed(3)}) saturate(${(1 / Math.sqrt(bright)).toFixed(3)})` : undefined,
      paddingBottom: 20,
    }}>{wordText}</span>
  );
};

export const WhiteFlashLogoSimplifyCut: React.FC = () => {
  const frame = useCurrentFrame();

  // -- Show segment --
  const push = 1 + 0.035 * ramp(frame, 0, FLASH0, EASE.smooth);
  const charge = ramp(frame, 34, 12, EASE.exit); // charge-up 0->1 (faster and faster)
  const bright = 1 + 0.7 * charge;
  const flare = ramp(frame, 34, 14, EASE.exit);

  // -- Blow-out --
  const burst = ramp(frame, FLASH0, WHITE - FLASH0, (t) => t * t); // radial white blob radius (quadratic ease-in: the last 3 frames visibly swallow the wordmark)
  const whiteHold = frame >= WHITE && frame < RECOVER ? 1 : 0;
  const recover = 1 - ramp(frame, RECOVER, 22, EASE.out); // exposure recovery 1->0
  const whiteA = frame < WHITE ? burst : frame < RECOVER ? 1 : recover;

  // -- Finish segment --
  const focus = ramp(frame, RECOVER - 2, 26, EASE.snappy);
  const flatScale = mix(1.03, 1, focus) * (1 + 0.01 * ramp(frame, 96, 24, EASE.smooth));
  const rule = ramp(frame, 72, 14, EASE.snappy);
  const mark = ramp(frame, 74, 14, EASE.snappy); // mark viewfinder frame reveals
  const cut = ramp(frame, 84, 12, EASE.snappy); // amber slash wipes in

  const dark = frame < WHITE;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: dark ? L.bg[1] : PAPER[0] }}>
      {dark ? (
        <>
          <Stage look={L} keyLight={{ x: 0.5, y: 0.2 }} fill={{ x: 0.82, y: 0.85 }} breathe={0.6}>
            <Dust look={L} count={36} seed={4} drift={0.2} opacity={0.5} />
            {/* aurora glow behind the letters */}
            <div style={{
              position: 'absolute', left: 360, right: 360, top: CY - 260, height: 520,
              background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha('#a78bfa', 0.28 + 0.25 * charge)} 0%, ${alpha('#f472b6', 0.08)} 45%, rgba(0,0,0,0) 72%)`,
            }} />
          </Stage>

          <div style={{ position: 'absolute', inset: 0, transform: `scale(${push.toFixed(5)})`, transformOrigin: `50% ${CY}px` }}>
            {/* bloom: blurred copy in the same color */}
            <div style={{ ...centered(CY), opacity: 0.42 + 0.4 * charge, filter: 'blur(38px)' }}>
              <span style={{ ...wordStyle, backgroundImage: IRIS, backgroundSize: '300% 100%', backgroundPosition: `${(frame * 1.1) % 300}% 0`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{wordText}</span>
            </div>
            {/* ground reflection: flipped + fading */}
            <div style={{
              ...centered(CY + FS * 0.86), transform: 'scaleY(-1)', opacity: 0.22,
              WebkitMaskImage: 'linear-gradient(0deg, #000 0%, rgba(0,0,0,0.4) 30%, transparent 62%)',
              maskImage: 'linear-gradient(0deg, #000 0%, rgba(0,0,0,0.4) 30%, transparent 62%)',
            }}>
              <LiquidWord frame={frame} bright={bright} />
            </div>
            {/* main wordmark */}
            <div style={centered(CY)}>
              <LiquidWord frame={frame} bright={bright} />
            </div>
            {/* horizontal anamorphic flare: stretches from the letter center */}
            {flare > 0 && (
              <>
                {/* flare: wide soft halo + thin bright core (the core's ends fade out; no stroke shadow, otherwise the bright line gets a dark edge) */}
                <div style={{
                  position: 'absolute', left: 960 - 1100 * flare, width: 2200 * flare, top: CY - 24, height: 48,
                  background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha('#e9e2ff', 0.55 * flare)} 0%, rgba(233,226,255,0) 100%)`,
                }} />
                <div style={{
                  position: 'absolute', left: 960 - 1000 * flare, width: 2000 * flare, top: CY - 2, height: 4,
                  background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,${(0.95 * flare).toFixed(3)}) 50%, rgba(255,255,255,0) 100%)`,
                }} />
                <div style={{
                  position: 'absolute', left: 960 - 900 * flare, width: 1800 * flare, top: CY - 90, height: 180,
                  background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha('#d8ccff', 0.45 * flare)} 0%, rgba(216,204,255,0) 70%)`,
                }} />
              </>
            )}
          </div>
        </>
      ) : (
        <>
          {/* paper: cool white with a hint of purple + soft top light + light vignette + grain */}
          <AbsoluteFill style={{ background: `linear-gradient(180deg, ${PAPER[0]} 0%, ${PAPER[1]} 100%)` }} />
          <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 40%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)' }} />
          <Vignette strength={0.1} inner={0.5} color="#2a2620" />
          <div style={{ position: 'absolute', inset: 0, transform: `scale(${flatScale.toFixed(5)})`, transformOrigin: `50% ${CY}px` }}>
            <div style={centered(CY)}>
              <span style={{ ...wordStyle, color: FLAT_INK, paddingBottom: 20 }}>{wordText}</span>
            </div>
            {/* lock-up: lens-carved mark (viewfinder frame reveals -> amber slash wipes in) + short amber line + brand tagline */}
            <div style={{ position: 'absolute', left: 960 - MARK / 2, top: CY - FS * 0.5 - 44 - MARK }}>
              <ShortKitMark size={MARK} tone="light" frameProgress={mark} cutProgress={cut} />
            </div>
            <div style={{
              position: 'absolute', left: 960 - 48, top: CY + FS * 0.5 + 62, width: 96, height: 5, borderRadius: 3,
              background: FLAT_ACCENT, transform: `scaleX(${rule.toFixed(4)})`,
            }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: CY + FS * 0.5 + 106, textAlign: 'center', color: '#716d64', ...type(46, 480) }}>
              <TextReveal text={PITCH.en.motto} by="word" variant="rise" start={78} each={18} gap={4} />
            </div>
          </div>
          <Grain opacity={0.04} />
        </>
      )}

      {/* white flash: first a radial white blob spreading from the letter center, then a full white layer once it fills the screen, then fading out with the exposure recovery */}
      {whiteA > 0.001 && (
        frame < WHITE ? (
          <AbsoluteFill style={{
            background: `radial-gradient(circle ${(80 + burst * 1500).toFixed(1)}px at 50% ${CY}px, rgba(255,255,255,1) 0%, rgba(255,255,255,${(0.6 + 0.4 * burst).toFixed(3)}) 55%, rgba(255,255,255,0) 100%)`,
            opacity: Math.min(1, burst * 1.4),
          }} />
        ) : (
          <AbsoluteFill style={{ background: '#ffffff', opacity: whiteHold ? 1 : whiteA }} />
        )
      )}
    </AbsoluteFill>
  );
};
