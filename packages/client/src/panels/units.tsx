import { useTranslation } from 'react-i18next';
import { UNITS, count, type UnitCounts } from '@romavis/shared';

/** "Hastatus 10 · Eques 3", or a dash when empty. */
export function UnitList({ units, empty = '—' }: { units: UnitCounts; empty?: string }) {
  const { t } = useTranslation();
  const present = UNITS.filter((u) => count(units, u) > 0);
  if (present.length === 0) return <span className="muted">{empty}</span>;
  return (
    <span className="unit-list">
      {present.map((u) => <span key={u} className="unit-chip">{t(`unit.${u}`)} <strong>{count(units, u).toLocaleString()}</strong></span>)}
    </span>
  );
}

export function errorCode(e: unknown): string {
  return typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : 'internal';
}
