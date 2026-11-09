/** Symboles amazighs (tifinagh et motifs kabyles de poterie et de tissage), en trait fin. */
const SYMBOLS = [
  // yaz ⵣ
  <g key="yaz">
    <path d="M12 3v18" />
    <path d="M6 5c0 4 12 4 12 0" />
    <path d="M6 19c0-4 12-4 12 0" />
  </g>,
  // losange pointé
  <g key="los">
    <path d="M12 3 21 12 12 21 3 12z" />
    <circle cx="12" cy="12" r="1.6" />
  </g>,
  // ⵙ : cercle pointé
  <g key="s">
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="1.6" />
  </g>,
  // chevrons
  <g key="chev">
    <path d="M3 15 12 7l9 8" />
    <path d="M3 20 12 12l9 8" />
  </g>,
  // ⵅ : carré barré
  <g key="x">
    <rect x="5" y="5" width="14" height="14" />
    <path d="M5 5l14 14M19 5 5 19" />
  </g>,
  // sablier
  <g key="sab">
    <path d="M5 4h14L12 12z" />
    <path d="M5 20h14L12 12z" />
  </g>,
  // ⵟ : peigne
  <g key="peigne">
    <path d="M4 8h16" />
    <path d="M6 8v9M10 8v9M14 8v9M18 8v9" />
  </g>,
  // zigzag
  <g key="zig">
    <path d="M2 14l4-5 4 5 4-5 4 5 4-5" />
  </g>,
];

const RUN = 18;

/**
 * Bande de symboles amazighs qui défile lentement derrière l'accueil, en gris discret. Une seule animation CSS sur la
 * bande entière (translate), deux copies bout à bout pour boucler sans couture.
 */
export function LandingBand() {
  const run = (copy: number) => (
    <div className="band-run" key={copy}>
      {Array.from({ length: RUN }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {SYMBOLS[i % SYMBOLS.length]}
        </svg>
      ))}
    </div>
  );
  return (
    <div className="landing-band" dir="ltr" aria-hidden="true">
      <div className="band-track">{[0, 1].map(run)}</div>
    </div>
  );
}
