import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { linearTiming, springTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { FlagRule } from '../components/FlagRule';
import { RevealText } from '../components/RevealText';
import { Sky } from '../components/Sky';
import { Wave } from '../components/Wave';
import { seconds } from '../config';
import { progress, settle, stagger } from '../lib/animation';
import { COLORS, FONTS } from '../theme';

/**
 * Démonstration : titre, chiffres, appel à l'action, enchaînés par des transitions. Les textes sont ceux de la borne
 * (APP/odej-kiosk/src/i18n/strings.ts et l'accueil), aucun n'est inventé.
 */

/** Durée de chaque scène et des transitions, en secondes : changer ici recalcule la durée totale. */
export const SHOWCASE_TIMING = { title: 4, stats: 3.5, cta: 3.5, transition: 0.8 } as const;

export const showcaseDuration = (fps: number) => {
  const { title, stats, cta, transition } = SHOWCASE_TIMING;
  return seconds(title, fps) + seconds(stats, fps) + seconds(cta, fps) - 2 * seconds(transition, fps);
};

function TitleScene() {
  return (
    <AbsoluteFill>
      <Sky />
      <Wave color={COLORS.sea} amplitude={50} waves={1.5} speed={0.006} top={0.86} opacity={0.35} />
      <Wave color={COLORS.sky} amplitude={36} waves={2.2} speed={-0.008} top={0.92} opacity={0.6} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 36 }}>
        <div dir="rtl" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <FlagRule delay={6} />
          <RevealText
            text="معرض مؤسسات الشباب · قصر المعارض، الجزائر"
            delay={10}
            step={2}
            rise={16}
            style={{ fontFamily: FONTS.ui, fontSize: 38, fontWeight: 500, color: COLORS.red }}
          />
        </div>
        <RevealText
          text="فضاءات الشباب في ولاية بجاية"
          delay={22}
          step={5}
          style={{ fontFamily: FONTS.displayAr, fontSize: 150, fontWeight: 700, color: COLORS.ink, lineHeight: 1.3 }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

const STATS = [
  { value: 67, label: 'مؤسسة على الخريطة', color: COLORS.red },
  { value: 52, label: 'بلدية', color: COLORS.ink },
  { value: 19, label: 'دائرة', color: COLORS.ink },
];

function StatsScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Sky />
      {/* Losanges qui tournent en se posant : rappel des motifs kabyles */}
      {[0, 1, 2, 3].map((i) => {
        const t = settle(frame, fps, stagger(i, 4));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${12 + i * 25}%`,
              top: i % 2 ? '18%' : '72%',
              width: 90,
              height: 90,
              border: `4px solid ${i % 2 ? COLORS.green : COLORS.gold}`,
              opacity: 0.35 * t,
              transform: `rotate(${45 + (1 - t) * 180}deg) scale(${t})`,
            }}
          />
        );
      })}
      <AbsoluteFill dir="rtl" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 160 }}>
        {STATS.map((stat, i) => {
          const delay = stagger(i, 6, 6);
          const t = settle(frame, fps, delay);
          // Le chiffre compte jusqu'à sa valeur pendant son entrée
          const count = Math.round(stat.value * progress(frame, delay, seconds(1.2, fps)));
          return (
            <div key={stat.label} style={{ textAlign: 'center', opacity: t, transform: `translateY(${(1 - t) * 60}px)` }}>
              <div style={{ fontFamily: FONTS.ui, fontSize: 170, fontWeight: 600, color: stat.color, fontVariantNumeric: 'tabular-nums' }}>
                {count}
              </div>
              <div style={{ fontFamily: FONTS.ui, fontSize: 44, color: COLORS.ink, opacity: 0.75 }}>{stat.label}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function CtaScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = settle(frame, fps, 8);
  // Légère respiration du bouton une fois posé
  const pulse = 1 + 0.025 * Math.sin(Math.max(0, frame - 30) / 9) * progress(frame, 30, 20);
  const arrow = interpolate(t, [0, 1], [-60, 0]);
  return (
    <AbsoluteFill>
      <Sky />
      <Wave color={COLORS.sea} amplitude={70} waves={1.2} speed={0.007} top={0.8} opacity={0.3} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div
          dir="rtl"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 40,
            padding: '44px 96px',
            borderRadius: 999,
            background: COLORS.green,
            color: '#fff',
            fontFamily: FONTS.ui,
            fontSize: 72,
            fontWeight: 600,
            boxShadow: '0 30px 60px rgba(20, 33, 27, 0.18)',
            opacity: t,
            transform: `scale(${(0.85 + 0.15 * t) * pulse})`,
          }}
        >
          <span>اكتشف ولاية بجاية</span>
          <span style={{ transform: `translateX(${arrow}px)` }}>←</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function Showcase() {
  const { fps } = useVideoConfig();
  const { title, stats, cta, transition } = SHOWCASE_TIMING;
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={seconds(title, fps)}>
        <TitleScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-right' })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: seconds(transition, fps) })}
      />
      <TransitionSeries.Sequence durationInFrames={seconds(stats, fps)}>
        <StatsScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: seconds(transition, fps) })} />
      <TransitionSeries.Sequence durationInFrames={seconds(cta, fps)}>
        <CtaScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}
