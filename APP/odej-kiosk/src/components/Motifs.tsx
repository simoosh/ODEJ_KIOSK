import { ribbonPath, waveY, RIBBON } from '../lib/ribbon';

/** Frise de motifs géométriques kabyles (poterie, tissage), en trait fin, comme la bande de motifs de Tiwizi. */
const MOTIFS = [
  // losange pointé
  <g key="a"><path d="M12 3 21 12 12 21 3 12z" /><circle cx="12" cy="12" r="1.6" /></g>,
  // yaz ⵣ (simplifié)
  <g key="b"><path d="M12 3v18" /><path d="M6 5c0 4 12 4 12 0" /><path d="M6 19c0-4 12-4 12 0" /></g>,
  // chevrons
  <g key="c"><path d="M3 15 12 7l9 8" /><path d="M3 20 12 12l9 8" /></g>,
  // zigzag
  <g key="d"><path d="M2 14l4-5 4 5 4-5 4 5 4-5" /></g>,
  // croix dans un carré
  <g key="e"><rect x="5" y="5" width="14" height="14" /><path d="M5 5l14 14M19 5 5 19" /></g>,
  // triangles opposés (sablier)
  <g key="f"><path d="M5 4h14L12 12z" /><path d="M5 20h14L12 12z" /></g>,
  // peigne
  <g key="g"><path d="M4 8h16" /><path d="M6 8v9M10 8v9M14 8v9M18 8v9" /></g>,
  // soleil
  <g key="h"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></g>,
];

const TOP = ribbonPath(-1);
const BOTTOM = ribbonPath(1);
// Le ruban entre les deux ondes : l'onde du haut, puis celle du bas parcourue à l'envers
const FILL = `${TOP} ${ribbonPath(1, true).replace(/^M/, 'L')} Z`;

/**
 * Ruban ondulé entre deux sinusoïdes, du bleu ciel au bleu mer, les motifs posés au milieu et des nuages gris clair
 * qui en dépassent. dir="ltr" : l'onde est un dessin, elle ne se retourne pas en arabe.
 */
export function MotifBand({ count = 14, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`motif-band ${className}`} dir="ltr" aria-hidden="true">
      {RIBBON.clouds.map(([t, side]) => (
        <span
          key={t}
          className="motif-cloud"
          style={{ insetInlineStart: `${t * 100}%`, top: `${((waveY(t) + (side * RIBBON.gap) / 2) / RIBBON.height) * 100}%` }}
        />
      ))}
      <svg className="motif-wave" viewBox={`0 0 ${RIBBON.width} ${RIBBON.height}`} preserveAspectRatio="none">
        <defs>
          {/* Du bleu ciel au bleu mer, très clairs */}
          <linearGradient id="motif-sky-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e4f1fb" stopOpacity="0.85" />
            <stop offset="1" stopColor="#dcf2f4" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <path d={FILL} fill="url(#motif-sky-sea)" />
        <path className="motif-line" d={TOP} />
        <path className="motif-line is-low" d={BOTTOM} />
      </svg>
      {Array.from({ length: count }, (_, i) => {
        const t = (i + 0.5) / count;
        return (
          <svg
            key={i}
            className="motif"
            style={{ insetInlineStart: `${t * 100}%`, top: `${(waveY(t) / RIBBON.height) * 100}%` }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {MOTIFS[i % MOTIFS.length]}
          </svg>
        );
      })}
    </div>
  );
}

/** Filet vert / blanc du drapeau, utilisé comme signature discrète. */
export function FlagRule({ className = '' }: { className?: string }) {
  return <span className={`flag-rule ${className}`} aria-hidden="true"><span /><span /></span>;
}
