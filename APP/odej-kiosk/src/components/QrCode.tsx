import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

/** QR code en SVG : le visiteur scanne pour ouvrir la page sur son téléphone (pas de navigation web sur la borne). */
export function QrCode({ value, size = '9rem', label }: { value: string; size?: string; label: string }) {
  const path = useMemo(() => {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(value);
      qr.make();
      const n: number = qr.getModuleCount();
      let d = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + 2} ${r + 2}h1v1h-1z`;
      return { d, n: n + 4 };
    } catch {
      return null;
    }
  }, [value]);

  if (!path) return <span className="qr-fallback">{value}</span>;
  return (
    <svg className="qr" width={size} height={size} viewBox={`0 0 ${path.n} ${path.n}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width={path.n} height={path.n} fill="#FFFFFF" />
      <path d={path.d} fill="#14211B" />
    </svg>
  );
}
