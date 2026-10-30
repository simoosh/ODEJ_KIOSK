import { useI18n } from '../i18n/I18n';
import { CONFIG } from '../config';

export function IdleOverlay({ secondsLeft, onStay }: { secondsLeft: number; onStay(): void }) {
  const { t } = useI18n();
  const total = CONFIG.idleWarningMs / 1000;
  const frac = Math.max(0, Math.min(1, secondsLeft / total));
  const C = 2 * Math.PI * 22;
  return (
    <div className="idle" role="alertdialog" aria-live="assertive">
      <div className="idle-card">
        <svg className="idle-ring" viewBox="0 0 50 50" aria-hidden="true">
          <circle cx="25" cy="25" r="22" className="idle-ring-bg" />
          <circle cx="25" cy="25" r="22" className="idle-ring-fg" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} />
          <text x="25" y="30" textAnchor="middle">{secondsLeft}</text>
        </svg>
        <h2>{t('idleTitle')}</h2>
        <p>{t('idleBody', { s: secondsLeft })}</p>
        <button type="button" className="cta" onClick={onStay}>
          {t('idleStay')}
        </button>
      </div>
    </div>
  );
}
