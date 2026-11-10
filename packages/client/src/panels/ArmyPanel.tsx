import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  NIGHT_WATCH_HOURS, RECALL_WINDOW_SECONDS, RECRUIT_QUEUE_SLOTS, RESOURCES, UNITS, UNIT_DEFS, populationCap,
  populationUsed, plannedLevels, recruitCost, recruitSeconds, settle, standingAt, tributeAccrued, type UnitId,
} from '@romavis/shared';
import { api, type CityDto, type CityResponse, type MovementsResponse, type PlayerDto } from '../api.ts';
import { formatDuration, useServerNow, useUi } from '../store.ts';
import { UnitList, errorCode } from './units.tsx';

const ICON = { timber: '🪵', stone: '🪨', iron: '⛏️' } as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const hourLabel = (utcHour: number) => {
  const d = new Date();
  d.setUTCHours(utcHour, 0, 0, 0);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

interface Props { city: CityDto; speed: number; player: PlayerDto; movements: MovementsResponse | undefined }

export function ArmyPanel({ city, speed, player, movements }: Props) {
  const { t } = useTranslation();
  const now = useServerNow();
  const qc = useQueryClient();
  const syncClock = useUi((s) => s.syncClock);
  const [error, setError] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Partial<Record<UnitId, string>>>({});
  const [watchHour, setWatchHour] = useState(22);

  const onCity = (res: CityResponse) => {
    syncClock(res.serverTime);
    qc.setQueryData(['city', city.id], res);
    setError(null);
  };
  const onError = (e: unknown) => setError(errorCode(e));
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['city', city.id] });
    void qc.invalidateQueries({ queryKey: ['movements'] });
    setError(null);
  };
  const recruit = useMutation({ mutationFn: (v: { unit: UnitId; n: number }) => api.recruit(city.id, v.unit, v.n), onSuccess: (r, v) => { onCity(r); setAmounts((a) => ({ ...a, [v.unit]: '' })); }, onError });
  const collect = useMutation({ mutationFn: () => api.collectTribute(city.id), onSuccess: onCity, onError });
  const recall = useMutation({ mutationFn: (id: number) => api.recall(id), onSuccess: refresh, onError });
  const sendBack = useMutation({ mutationFn: (v: { host: number; home: number }) => api.returnSupport(v.host, v.home), onSuccess: refresh, onError });
  const nightWatch = useMutation({ mutationFn: (h: number) => api.setNightWatch(h), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['world'] }); setError(null); }, onError });
  const busy = recruit.isPending || collect.isPending || recall.isPending || sendBack.isPending || nightWatch.isPending;

  const live = settle(city, now, speed);
  const freePop = populationCap(city.levels.fundus) - populationUsed(plannedLevels(city.levels, city.queue)) - city.unitPop;
  const tribute = city.natives.reduce((sum, n) => sum + tributeAccrued(standingAt(n.standing, now - n.standingAt, speed), now - n.tributeAt, speed), 0);
  const standing = city.natives.length === 0 ? 0
    : Math.round(city.natives.reduce((s, n) => s + standingAt(n.standing, now - n.standingAt, speed), 0) / city.natives.length);
  const mine = movements?.own.filter((m) => m.homeCityId === city.id) ?? [];
  const incoming = movements?.incoming.filter((m) => m.cityId === city.id) ?? [];

  const maxAffordable = (u: UnitId) => {
    const c = UNIT_DEFS[u].cost;
    return Math.max(0, Math.min(Math.floor(live.timber / c.timber), Math.floor(live.stone / c.stone), Math.floor(live.iron / c.iron), Math.floor(freePop / UNIT_DEFS[u].pop)));
  };

  return (
    <div className="city">
      {player.protectedUntil !== null && player.protectedUntil > now && (
        <p className="note">{t('army.protected', { left: formatDuration(player.protectedUntil - now) })}</p>
      )}
      {error && <p className="alert" role="alert">{t(`error.${error}`, { defaultValue: t('error.internal') })}</p>}

      <section>
        <h3>{t('army.home')}</h3>
        <p><UnitList units={city.units} empty={t('army.none')} /></p>
        {city.support.length > 0 && <h3>{t('army.support')}</h3>}
        {city.support.map((s) => (
          <div className="row" key={s.homeCityId}>
            <div className="row__main"><strong>{s.cityName}</strong> <span className="muted">{s.playerName}</span><br /><UnitList units={s.units} /></div>
            <button className="btn btn--ghost" disabled={busy} onClick={() => sendBack.mutate({ host: city.id, home: s.homeCityId })}>{t('army.sendHome')}</button>
          </div>
        ))}
        {city.away.length > 0 && <h3>{t('army.away')}</h3>}
        {city.away.map((a) => (
          <div className="row" key={a.cityId}>
            <div className="row__main"><strong>{a.cityName}</strong><br /><UnitList units={a.units} /></div>
            <button className="btn btn--ghost" disabled={busy} onClick={() => sendBack.mutate({ host: a.cityId, home: city.id })}>{t('army.recallHome')}</button>
          </div>
        ))}
      </section>

      <section>
        <h3>{t('army.movements')}</h3>
        {mine.length === 0 && incoming.length === 0 && <p className="muted">{t('army.noMovements')}</p>}
        {incoming.map((m) => (
          <div className={`row ${m.type === 'attack' ? 'row--danger' : ''}`} key={`in${m.id}`}>
            <div className="row__main"><strong>{t('army.incoming')}: {t(m.type === 'attack' ? 'army.attack' : 'army.support_')}</strong></div>
            <span className="queue__time">{formatDuration(m.arriveAt - now)}</span>
          </div>
        ))}
        {mine.map((m) => (
          <div className="row" key={m.id}>
            <div className="row__main">
              <strong>{t(m.type === 'support' ? 'army.support_' : `army.${m.type}`)}</strong>
              {m.loot && <span className="muted"> {RESOURCES.map((r) => `${ICON[r]} ${m.loot![r]}`).join(' ')}</span>}
              <br /><UnitList units={m.units} />
            </div>
            <span className="queue__time">{formatDuration(m.arriveAt - now)}</span>
            {m.type !== 'return' && now - m.departAt <= (RECALL_WINDOW_SECONDS * 1000) / speed && (
              <button className="btn btn--ghost" disabled={busy} onClick={() => recall.mutate(m.id)}>{t('army.recall')}</button>
            )}
          </div>
        ))}
      </section>

      <section>
        <h3>{t('army.tribute')}</h3>
        <div className="row">
          <div className="row__main muted">{t('army.tributeBody', { n: tribute, standing })}</div>
          <button className="btn" disabled={busy || tribute === 0} onClick={() => collect.mutate()}>{t('army.collect')}</button>
        </div>
      </section>

      <section>
        <h3>{t('army.training')} <span className="muted">{t('army.slotsPerBuilding', { max: RECRUIT_QUEUE_SLOTS })}</span></h3>
        {city.recruitQueue.length === 0 && <p className="muted">{t('army.trainingEmpty')}</p>}
        {city.recruitQueue.map((o) => (
          <div className="row" key={o.id}>
            <div className="row__main"><strong>{o.count} × {t(`unit.${o.unit}`)}</strong></div>
            <span className="queue__time">{o.dueAt !== null ? formatDuration(o.dueAt - now) : t('city.waiting')}</span>
          </div>
        ))}
      </section>

      <section>
        <h3>{t('army.recruit')}</h3>
        <ul className="buildings">
          {UNITS.map((u) => {
            const def = UNIT_DEFS[u];
            const level = city.levels[def.building];
            const locked = level < def.requires;
            const n = Math.floor(Number(amounts[u] ?? ''));
            const valid = Number.isInteger(n) && n > 0;
            const cost = recruitCost(u, valid ? n : 1);
            const max = maxAffordable(u);
            return (
              <li key={u} className={`building ${locked ? 'building--locked' : ''}`}>
                <div className="building__main">
                  <div className="building__title"><strong>{t(`unit.${u}`)}</strong><span className="badge">👥 {def.pop}</span></div>
                  <div className="muted">{t(`unit.${u}Info`)}</div>
                  {locked ? <div className="muted">{t('unit.needs', { building: cap(def.building), level: def.requires })}</div> : (
                    <div className="cost">
                      {RESOURCES.map((r) => <span key={r} className={live[r] < cost[r] ? 'cost--short' : ''}>{ICON[r]} {cost[r].toLocaleString()}</span>)}
                      <span>⏱ {formatDuration(recruitSeconds(u, valid ? n : 1, level, speed) * 1000)}</span>
                    </div>
                  )}
                </div>
                {!locked && (
                  <div className="recruit">
                    <input
                      type="number" inputMode="numeric" min={1} max={max} placeholder={`${t('army.max')} ${max}`} aria-label={`${t('army.count')} ${t(`unit.${u}`)}`}
                      value={amounts[u] ?? ''} onChange={(e) => setAmounts({ ...amounts, [u]: e.target.value })}
                    />
                    <button className="btn" disabled={busy || !valid || n > max} onClick={() => recruit.mutate({ unit: u, n })}>{t('army.recruit')}</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h3>{t('army.nightWatch')}</h3>
        {player.nightWatchStart !== null ? (
          <p className="muted">{t('army.nightWatchSet', { from: hourLabel(player.nightWatchStart), to: hourLabel((player.nightWatchStart + NIGHT_WATCH_HOURS) % 24) })}</p>
        ) : (
          <>
            <p className="muted">{t('army.nightWatchBody')}</p>
            <div className="row">
              <label className="row__main">{t('army.nightWatchStart')}{' '}
                <select value={watchHour} onChange={(e) => setWatchHour(Number(e.target.value))}>
                  {Array.from({ length: 24 }, (_, local) => <option key={local} value={local}>{String(local).padStart(2, '0')}:00</option>)}
                </select>
              </label>
              <button className="btn" disabled={busy} onClick={() => {
                const d = new Date();
                d.setHours(watchHour, 0, 0, 0);
                nightWatch.mutate(d.getUTCHours());
              }}>{t('army.save')}</button>
            </div>
          </>
        )}
      </section>
      <p className="muted">{t('res.population')}: {populationCap(city.levels.fundus) - freePop} / {populationCap(city.levels.fundus)}</p>
    </div>
  );
}
