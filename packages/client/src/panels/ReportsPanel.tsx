import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LUCK_RANGE, RESOURCES, UNITS, cityBaseDefense, compact, resolveBattle, totalUnits, type UnitCounts, type UnitId } from '@romavis/shared';
import type { ReportDto } from '../api.ts';
import { UnitList } from './units.tsx';

const ICON = { timber: '🪵', stone: '🪨', iron: '⛏️' } as const;
const LAND = UNITS.filter((u) => u !== 'oneraria');

function Simulator() {
  const { t } = useTranslation();
  const [att, setAtt] = useState<Partial<Record<UnitId, string>>>({});
  const [def, setDef] = useState<Partial<Record<UnitId, string>>>({});
  const [wall, setWall] = useState('0');
  const [night, setNight] = useState(false);
  const parse = (v: Partial<Record<UnitId, string>>): UnitCounts =>
    compact(Object.fromEntries(LAND.map((u) => [u, Math.max(0, Math.floor(Number(v[u] ?? 0)) || 0)])));
  const attackers = parse(att);
  const defenders = parse(def);
  const murusLevel = Math.min(20, Math.max(0, Math.floor(Number(wall)) || 0));
  const run = (luck: number) => resolveBattle({ attackers, defenders: [defenders], murusLevel, nightWatch: night, luck, baseDefense: cityBaseDefense(murusLevel) });
  const worst = run(-LUCK_RANGE);
  const best = run(LUCK_RANGE);
  const pct = (a: number, b: number) => (Math.round(a * 100) === Math.round(b * 100) ? `${Math.round(a * 100)}%` : `${Math.round(Math.min(a, b) * 100)}–${Math.round(Math.max(a, b) * 100)}%`);
  const outcome = worst.attackerWins ? t('sim.wins') : best.attackerWins ? `${t('sim.wins')} / ${t('sim.fails')}` : t('sim.fails');

  return (
    <details className="sim">
      <summary>{t('sim.title')}</summary>
      <table className="sim__table">
        <thead><tr><th /><th>{t('report.attackers')}</th><th>{t('report.defenders')}</th></tr></thead>
        <tbody>
          {LAND.map((u) => (
            <tr key={u}>
              <th scope="row">{t(`unit.${u}`)}</th>
              <td><input type="number" min={0} inputMode="numeric" placeholder="0" value={att[u] ?? ''} onChange={(e) => setAtt({ ...att, [u]: e.target.value })} aria-label={`${t('report.attackers')} ${t(`unit.${u}`)}`} /></td>
              <td><input type="number" min={0} inputMode="numeric" placeholder="0" value={def[u] ?? ''} onChange={(e) => setDef({ ...def, [u]: e.target.value })} aria-label={`${t('report.defenders')} ${t(`unit.${u}`)}`} /></td>
            </tr>
          ))}
          <tr>
            <th scope="row">{t('sim.wall')}</th><td />
            <td><input type="number" min={0} max={20} value={wall} onChange={(e) => setWall(e.target.value)} aria-label={t('sim.wall')} /></td>
          </tr>
        </tbody>
      </table>
      <label className="sim__check"><input type="checkbox" checked={night} onChange={(e) => setNight(e.target.checked)} /> {t('sim.nightWatch')}</label>
      {totalUnits(attackers) > 0 && (
        <div className="note">
          <strong>{outcome}</strong><br />
          {t('sim.attackerLoses')}: {pct(worst.attackerLossShare, best.attackerLossShare)} · {t('sim.defenderLoses')}: {pct(worst.defenderLossShare, best.defenderLossShare)}
          <div className="muted">{t('sim.run')}</div>
        </div>
      )}
    </details>
  );
}

export function ReportsPanel({ reports }: { reports: ReportDto[] }) {
  const { t } = useTranslation();
  return (
    <div className="city">
      <Simulator />
      {reports.length === 0 && <p className="muted">{t('report.empty')}</p>}
      <ul className="buildings">
        {reports.map((r) => {
          const d = r.data;
          const won = r.kind === 'defense' ? !d.attackerWins : d.attackerWins;
          return (
            <li key={r.id} className={`report ${r.read ? '' : 'report--new'}`}>
              <details>
                <summary>
                  <span className={`pill ${won ? 'pill--win' : 'pill--loss'}`}>{t(won ? 'report.won' : 'report.lost')}</span>{' '}
                  <strong>{t(`report.${r.kind}`, { name: d.cityName ?? '' })}</strong>
                  <span className="muted"> · {new Date(r.createdAt).toLocaleString()}</span>
                </summary>
                <dl className="report__body">
                  <dt>{t('report.attackers')} {d.attacker && <span className="muted">{d.attacker}</span>}</dt>
                  <dd>{t('report.sent')}: <UnitList units={d.attackers} /><br />{t('report.losses')}: <UnitList units={d.attackerLosses} empty={t('report.none')} /></dd>
                  <dt>{t('report.defenders')} {d.defender && <span className="muted">{d.defender}</span>}</dt>
                  <dd><UnitList units={d.defenders} empty={t('report.none')} /><br />{t('report.losses')}: <UnitList units={d.defenderLosses} empty={t('report.none')} /></dd>
                  <dt>{t('report.loot')}</dt>
                  <dd>{d.loot ? RESOURCES.map((res) => `${ICON[res]} ${d.loot![res].toLocaleString()}`).join('  ') : t('report.none')}</dd>
                </dl>
                <p className="muted">
                  {t('report.details', { attack: d.attack.toLocaleString(), defense: d.defense.toLocaleString(), luck: (d.luck * 100).toFixed(1) })}
                  {d.murus > 0 && ` · ${t('report.wall', { n: d.murus })}`}{d.nightWatch && ` · ${t('report.nightWatch')}`}
                </p>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
