import { useI18n } from '../i18n/I18n';
import { OdejLogo } from '../logo/OdejLogo';
import { LOGO_END } from '../logo/timeline';

/** Logo de l'ODEJ dans l'en-tête de l'accueil : affiché complet dès l'arrivée, le grand logo du centre fait le spectacle. */
export function LandingLogo() {
  const { t } = useI18n();
  return (
    <span className="brand-logo is-drawn">
      <OdejLogo t={LOGO_END} title={t('logoSlot')} />
    </span>
  );
}
