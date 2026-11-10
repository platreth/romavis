import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BUILDINGS, BUILDING_DEFS, BUILD_QUEUE_SLOTS, RESOURCES, buildTimeSeconds, buildingCost, buildingPoints, canCancel,
  checkBuild, plannedLevels, populationCap, populationUsed, productionRates, settle, storageCapacity,
  type BuildingId, type ResourceId,
} from '@romavis/shared';
import { ApiError, api, type CityDto, type CityResponse } from '../api.ts';
import { formatDuration, useServerNow, useUi } from '../store.ts';

const ICON: Record<ResourceId, string> = { timber: '🪵', stone: '🪨', iron: '⛏️' };
const label = (b: BuildingId) => b.charAt(0).toUpperCase() + b.slice(1);

export function CityPanel({ city, speed }: { city: CityDto; speed: number }) {
  const { t } = useTranslation();
  const now = useServerNow();
  const qc = useQueryClient();
  const syncClock = useUi((s) => s.syncClock);
  const [error, setError] = useState<string | null>(null);

  const onDone = (res: CityResponse) => {
    syncClock(res.serverTime);
    qc.setQueryData(['city', city.id], res);
    void qc.invalidateQueries({ queryKey: ['ringCities'] });
    setError(null);
  };
  const onError = (e: unknown) => setError(e instanceof ApiError ? e.code : 'internal');
  const build = useMutation({ mutationFn: (b: BuildingId) => api.build(city.id, b), onSuccess: onDone, onError });
  const cancel = useMutation({ mutationFn: (orderId: number) => api.cancel(city.id, orderId), onSuccess: onDone, onError });
  const busy = build.isPending || cancel.isPending;

  // When the running order should be finished, ask the server for the new state.
  const dueAt = city.queue[0]?.dueAt ?? null;
  const overdue = dueAt !== null && now >= dueAt;
  useEffect(() => {
    if (overdue) void qc.invalidateQueries({ queryKey: ['city', city.id] });
  }, [overdue, qc, city.id]);

  const live = settle(city, now, speed);
  const rates = productionRates(city.levels, speed);
  const cap = storageCapacity(city.levels.horreum);
  const planned = plannedLevels(city.levels, city.queue);
  const popUsed = populationUsed(planned) + city.unitPop;
  const popCap = populationCap(planned.fundus);

  return (
    <div className="city">
      <header className="city__head">
        <h2>{city.name}</h2>
        <span className="muted">{t('city.points', { n: buildingPoints(city.levels) })}</span>
      </header>

      <div className="resources">
        {RESOURCES.map((r) => (
          <div className={`res ${live[r] >= cap ? 'res--full' : ''}`} key={r} title={t(`res.${r}`)}>
            <span className="res__icon" aria-hidden>{ICON[r]}</span>
            <div>
              <div className="res__amount">{live[r].toLocaleString()}</div>
              <div className="res__meta">{t(`res.${r}`)} · +{Math.round(rates[r])}{t('res.perHour')}</div>
            </div>
          </div>
        ))}
        <div className="res" title={t('res.population')}>
          <span className="res__icon" aria-hidden>👥</span>
          <div>
            <div className="res__amount">{popUsed} / {popCap}</div>
            <div className="res__meta">{t('res.population')} · {t('res.storage')} {cap.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {error && <p className="alert" role="alert">{t(`error.${error}`, { defaultValue: t('error.internal') })}</p>}

      <section>
        <h3>{t('city.queue')} <span className="muted">{t('city.slots', { used: city.queue.length, max: BUILD_QUEUE_SLOTS })}</span></h3>
        {city.queue.length === 0 && <p className="muted">{t('city.queueEmpty')}</p>}
        <ol className="queue">
          {city.queue.map((o, i) => {
            const total = o.dueAt !== null && o.startedAt !== null ? o.dueAt - o.startedAt : 0;
            const progress = total > 0 ? Math.min(1, Math.max(0, (now - o.startedAt!) / total)) : 0;
            return (
              <li key={o.id} className="queue__item">
                <div className="queue__row">
                  <strong>{label(o.building)}</strong>
                  <span className="muted">{t('city.toLevel', { n: o.targetLevel })}</span>
                  <span className="queue__time">{o.dueAt !== null ? formatDuration(o.dueAt - now) : t('city.waiting')}</span>
                  <button className="btn btn--ghost" disabled={busy || !canCancel(city.levels, city.queue, i, city.unitPop)} onClick={() => cancel.mutate(o.id)}>
                    {t('city.cancel')}
                  </button>
                </div>
                {o.dueAt !== null && <div className="bar"><div className="bar__fill" style={{ width: `${progress * 100}%` }} /></div>}
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <h3>{t('city.buildings')}</h3>
        <ul className="buildings">
          {BUILDINGS.filter((b) => BUILDING_DEFS[b].enabled).map((b) => {
            const check = checkBuild(live, city.queue, b, city.unitPop);
            const next = planned[b] + 1;
            const maxed = next > BUILDING_DEFS[b].maxLevel;
            const cost = buildingCost(b, next);
            return (
              <li key={b} className="building">
                <div className="building__main">
                  <div className="building__title">
                    <strong>{label(b)}</strong>
                    <span className="badge">{t('city.level', { n: city.levels[b] })}{planned[b] > city.levels[b] ? ` → ${planned[b]}` : ''}</span>
                  </div>
                  <div className="muted">{t(`building.${b}`)}</div>
                  {maxed ? <div className="muted">{t('city.maxed')}</div> : (
                    <div className="cost">
                      {RESOURCES.map((r) => (
                        <span key={r} className={live[r] < cost[r] ? 'cost--short' : ''}>{ICON[r]} {cost[r].toLocaleString()}</span>
                      ))}
                      <span>⏱ {formatDuration(buildTimeSeconds(b, next, planned.forum, speed) * 1000)}</span>
                    </div>
                  )}
                </div>
                <button
                  className="btn" disabled={busy || !check.ok}
                  title={check.ok ? undefined : t(`error.${check.error}`)}
                  onClick={() => build.mutate(b)}
                >
                  {t('city.build')}{!maxed && ` ${next}`}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
