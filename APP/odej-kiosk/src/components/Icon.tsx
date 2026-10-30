import { CATEGORY_ICONS, UI_ICONS, type UiIconName } from './icons';
import type { IconName } from '../types';

interface Props {
  name: UiIconName | IconName;
  size?: number | string;
  className?: string;
}

export function Icon({ name, size = '1.25em', className }: Props) {
  const inner = (UI_ICONS as Record<string, string>)[name] ?? CATEGORY_ICONS[name as IconName] ?? '';
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
