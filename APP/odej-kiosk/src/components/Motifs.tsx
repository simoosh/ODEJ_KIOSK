/** Filet vert / blanc du drapeau, utilisé comme signature discrète. */
export function FlagRule({ className = '' }: { className?: string }) {
  return <span className={`flag-rule ${className}`} aria-hidden="true"><span /><span /></span>;
}
