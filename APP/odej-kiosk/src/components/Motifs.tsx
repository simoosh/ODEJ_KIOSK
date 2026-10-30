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

export function MotifBand({ count = 14, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`motif-band ${className}`} aria-hidden="true">
      <svg className="motif-wave" viewBox="0 0 1200 40" preserveAspectRatio="none">
        <path d="M0 26 C 200 6, 400 6, 600 22 S 1000 38, 1200 14" fill="none" />
      </svg>
      <div className="motif-row">
        {Array.from({ length: count }, (_, i) => (
          <svg key={i} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
            {MOTIFS[i % MOTIFS.length]}
          </svg>
        ))}
      </div>
    </div>
  );
}

/** Filet vert / blanc du drapeau, utilisé comme signature discrète. */
export function FlagRule({ className = '' }: { className?: string }) {
  return <span className={`flag-rule ${className}`} aria-hidden="true"><span /><span /></span>;
}
