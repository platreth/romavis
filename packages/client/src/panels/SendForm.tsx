import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UNITS, compact, count, distance, planMovement, travelSeconds, type UnitCounts, type UnitId } from '@romavis/shared';
import { api, type CityDto, type LandmassDto, type MapCityDto } from '../api.ts';
import { formatDuration, useUi } from '../store.ts';
import { errorCode } from './units.tsx';

interface Props { city: CityDto; speed: number; landmasses: LandmassDto[]; cities: MapCityDto[] }

export function SendForm({ city, speed, landmasses, cities }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const sending = useUi((s) => s.sending);
  const setSending = useUi((s) => s.setSending);
  const setTab = useUi((s) => s.setTab);
  const [amounts, setAmounts] = useState<Partial<Record<UnitId, string>>>({});
  const [error, setError] = useState<string | null>(null);

  const landmass = sending ? landmasses.find((l) => l.sites.some((s) => s.id === sending.siteId)) : undefined;
  const site = landmass?.sites.find((s) => s.id === sending?.siteId);
  const units: UnitCounts = compact(Object.fromEntries(UNITS.map((u) => [u, Math.max(0, Math.floor(Number(amounts[u] ?? 0)) || 0)])));
  const send = useMutation({
    mutationFn: () => api.send({ fromCityId: city.id, toSiteId: sending!.siteId, type: sending!.type, units }),
    onSuccess: (res) => {
      qc.setQueryData(['movements'], res);
      void qc.invalidateQueries({ queryKey: ['city', city.id] });
      void qc.invalidateQueries({ queryKey: ['world'] });
      setSending(null);
      setTab('army');
    },
    onError: (e) => setError(errorCode(e)),
  });
  if (!sending || !site || !landmass) return null;

  const sameLandmass = landmass.id === city.landmassId;
  const plan = planMovement(units, sameLandmass, sending.type !== 'support');
  const tooMany = UNITS.some((u) => count(units, u) > count(city.units, u));
  const name = cities.find((c) => c.siteId === site.id)?.name ?? '';
  const available = UNITS.filter((u) => count(city.units, u) > 0);
  const shown = error ?? (tooMany ? 'not_enough_units' : !plan.ok && plan.error !== 'no_units' ? plan.error : null);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={t('send.title')}>
      <form className="card" onSubmit={(e) => { e.preventDefault(); setError(null); send.mutate(); }}>
        <h2>{t(`send.${sending.type}Title`, { name })}</h2>
        <p className="muted">{distance(city, site).toFixed(1)} · {t(sameLandmass ? 'send.byLand' : 'send.bySea')}</p>
        {available.length === 0 && <p className="muted">{t('send.noTroops')}</p>}
        {available.map((u) => (
          <label key={u} className="send-row">
            <span>{t(`unit.${u}`)} <span className="muted">/ {count(city.units, u)}</span></span>
            <input
              type="number" inputMode="numeric" min={0} max={count(city.units, u)} value={amounts[u] ?? ''} placeholder="0"
              onChange={(e) => { setAmounts({ ...amounts, [u]: e.target.value }); setError(null); }}
            />
            <button type="button" className="btn btn--ghost" onClick={() => setAmounts({ ...amounts, [u]: String(count(city.units, u)) })}>{t('army.max')}</button>
          </label>
        ))}
        {plan.ok && <p>{t('send.travel')}: <strong>{formatDuration(travelSeconds(distance(city, site), plan.speed, speed) * 1000)}</strong></p>}
        {shown && <p className="alert" role="alert">{t(`error.${shown}`, { defaultValue: t('error.internal') })}</p>}
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setSending(null)}>{t('send.close')}</button>
          <button className="btn" disabled={send.isPending || !plan.ok || tooMany}>{t('send.go')}</button>
        </div>
      </form>
    </div>
  );
}
