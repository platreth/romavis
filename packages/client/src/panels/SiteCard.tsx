import { useTranslation } from 'react-i18next';
import type { LandmassDto, MapCityDto } from '../api.ts';
import { useUi } from '../store.ts';

interface Props {
  landmasses: LandmassDto[];
  cities: MapCityDto[];
  myPlayerId: number;
}

export function SiteCard({ landmasses, cities, myPlayerId }: Props) {
  const { t } = useTranslation();
  const siteId = useUi((s) => s.selectedSiteId);
  const select = useUi((s) => s.select);
  const setPanelOpen = useUi((s) => s.setPanelOpen);
  if (siteId === null) return null;
  const site = landmasses.flatMap((l) => l.sites).find((s) => s.id === siteId);
  if (!site) return null;
  const city = cities.find((c) => c.siteId === siteId);
  const mine = city?.playerId === myPlayerId;

  return (
    <aside className="site-card" aria-live="polite">
      <button className="site-card__close" aria-label="Close" onClick={() => select(null)}>×</button>
      {site.kind === 'native' ? (
        <><h3>{t('site.native')}</h3><p className="muted">{t('site.nativeBody')}</p></>
      ) : !city ? (
        <><h3>{t('site.free')}</h3><p className="muted">{t('site.freeBody')}</p></>
      ) : (
        <>
          <h3>{city.name}</h3>
          <p className="muted">
            {mine ? t('site.mine') : `${t('site.owner')}: ${city.playerName ?? t('site.neutral')}`} · {t('city.points', { n: city.points })}
          </p>
          {mine && <button className="btn" onClick={() => setPanelOpen(true)}>{t('site.open')}</button>}
        </>
      )}
      <p className="coords">{(site.x / 100).toFixed(1)} · {(site.y / 100).toFixed(1)}</p>
    </aside>
  );
}
