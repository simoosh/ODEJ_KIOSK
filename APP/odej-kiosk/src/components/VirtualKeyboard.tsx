import { useState, type PointerEvent } from 'react';
import type { Locale } from '../types';
import { useI18n } from '../i18n/I18n';
import { Icon } from './Icon';

/** Clavier tactile intégré : en plein écran kiosque, le clavier du système n'apparaît pas toujours. */
const LAYOUTS: Record<Locale, string[][]> = {
  ar: [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'],
    ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
    ['ئ', 'ء', 'ؤ', 'ر', 'ى', 'ة', 'و', 'ز', 'ظ', 'د', 'ذ'],
  ],
  en: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', "'"],
  ],
};

interface Props {
  onKey(ch: string): void;
  onBackspace(): void;
  onClose(): void;
}

export function VirtualKeyboard({ onKey, onBackspace, onClose }: Props) {
  const { locale, t } = useI18n();
  const [layout, setLayout] = useState<Locale>(locale);
  const rows = LAYOUTS[layout];
  // Le clavier ne doit pas voler le focus du champ
  const keep = (e: PointerEvent) => e.preventDefault();

  return (
    <div className="vkb" dir={layout === 'ar' ? 'rtl' : 'ltr'} onPointerDown={keep}>
      {rows.map((row, i) => (
        <div className="vkb-row" key={i}>
          {row.map((k) => (
            <button type="button" key={k} className="vkb-key" onClick={() => onKey(k)}>
              {k}
            </button>
          ))}
          {i === rows.length - 1 && (
            <button type="button" className="vkb-key vkb-wide" onClick={onBackspace} aria-label="⌫">
              <Icon name="backspace" />
            </button>
          )}
        </div>
      ))}
      <div className="vkb-row">
        <button type="button" className="vkb-key vkb-wide" onClick={() => setLayout(layout === 'ar' ? 'en' : 'ar')}>
          {layout === 'ar' ? 'ABC' : 'أبج'}
        </button>
        <button type="button" className="vkb-key vkb-space" onClick={() => onKey(' ')}>
          {t('keyboardSpace')}
        </button>
        <button type="button" className="vkb-key vkb-wide" onClick={onClose} aria-label={t('keyboardHide')}>
          <Icon name="chevronDown" />
        </button>
      </div>
    </div>
  );
}
