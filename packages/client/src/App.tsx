import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError, api, type UserDto } from './api.ts';
import { setLanguage } from './i18n.ts';
import { GameMap, useWorldMap } from './map/GameMap.tsx';
import { ArmyPanel } from './panels/ArmyPanel.tsx';
import { CityPanel } from './panels/CityPanel.tsx';
import { ReportsPanel } from './panels/ReportsPanel.tsx';
import { SendForm } from './panels/SendForm.tsx';
import { SiteCard } from './panels/SiteCard.tsx';
import { formatDuration, useServerNow, useUi } from './store.ts';

function LanguageSwitch() {
  const { i18n } = useTranslation();
  const other = i18n.language === 'fr' ? 'en' : 'fr';
  return (
    <button className="btn btn--ghost lang" onClick={() => setLanguage(other)} aria-label={`Switch language to ${other}`}>
      {other.toUpperCase()}
    </button>
  );
}

function AuthScreen() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const submit = useMutation({
    mutationFn: () =>
      mode === 'login'
        ? api.login({ identifier: form.username, password: form.password })
        : api.register({ ...form, locale: i18n.language === 'fr' ? 'fr' : 'en' }),
    onSuccess: (res) => qc.setQueryData(['me'], res),
  });
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit.mutate();
  };
  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value }),
  });
  const err = submit.error instanceof ApiError ? submit.error.code : submit.error ? 'internal' : null;

  return (
    <main className="gate">
      <div className="gate__lang"><LanguageSwitch /></div>
      <form className="card" onSubmit={onSubmit}>
        <h1 className="logo">ROMAVIS</h1>
        <p className="muted center">{t('tagline')}</p>
        <label>
          {mode === 'login' ? t('auth.identifier') : t('auth.username')}
          <input {...field('username')} autoComplete="username" required minLength={mode === 'login' ? 1 : 3} maxLength={mode === 'login' ? 254 : 20} />
          {mode === 'register' && <small>{t('auth.usernameHint')}</small>}
        </label>
        {mode === 'register' && (
          <label>
            {t('auth.email')}
            <input {...field('email')} type="email" autoComplete="email" required />
          </label>
        )}
        <label>
          {t('auth.password')}
          <input {...field('password')} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? 1 : 8} />
          {mode === 'register' && <small>{t('auth.passwordHint')}</small>}
        </label>
        {err && <p className="alert" role="alert">{t(`error.${err}`, { defaultValue: t('error.internal') })}</p>}
        <button className="btn btn--wide" disabled={submit.isPending}>{t(`auth.${mode}`)}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); submit.reset(); }}>
          {mode === 'login' ? t('auth.toRegister') : t('auth.toLogin')}
        </button>
      </form>
    </main>
  );
}

/** Server pushes are only hints to refetch, so a missed one is harmless. */
function useServerPush(enabled: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let closed = false;
    const open = () => {
      ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(String(e.data)) as { type?: string; cityId?: number };
          if (msg.type === 'city_updated') {
            void qc.invalidateQueries({ queryKey: ['city'] });
            void qc.invalidateQueries({ queryKey: ['ringCities'] });
          } else if (msg.type === 'movements' || msg.type === 'incoming') {
            void qc.invalidateQueries({ queryKey: ['movements'] });
            void qc.invalidateQueries({ queryKey: ['city'] });
          } else if (msg.type === 'report') {
            void qc.invalidateQueries({ queryKey: ['reports'] });
            void qc.invalidateQueries({ queryKey: ['movements'] });
          }
        } catch { /* ignore malformed pushes */ }
      };
      ws.onclose = () => {
        if (!closed) retry = setTimeout(open, 5000);
      };
    };
    open();
    return () => {
      closed = true;
      clearTimeout(retry);
      ws?.close();
    };
  }, [enabled, qc]);
}

function Game({ user }: { user: UserDto }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const now = useServerNow();
  const syncClock = useUi((s) => s.syncClock);
  const panelOpen = useUi((s) => s.panelOpen);
  const setPanelOpen = useUi((s) => s.setPanelOpen);
  const tab = useUi((s) => s.tab);
  const setTab = useUi((s) => s.setTab);

  const world = useQuery({ queryKey: ['world'], queryFn: api.world, refetchInterval: 60_000 });
  useEffect(() => {
    if (world.data) syncClock(world.data.serverTime);
  }, [world.data, syncClock]);
  const join = useMutation({ mutationFn: api.join, onSuccess: () => qc.invalidateQueries({ queryKey: ['world'] }) });
  const logout = useMutation({ mutationFn: api.logout, onSuccess: () => { qc.clear(); } });

  const player = world.data?.player ?? null;
  const cityId = player?.cityIds[0];
  const city = useQuery({
    queryKey: ['city', cityId], queryFn: () => api.city(cityId!), enabled: cityId !== undefined, refetchInterval: 60_000,
  });
  useEffect(() => {
    if (city.data) syncClock(city.data.serverTime);
  }, [city.data, syncClock]);
  useServerPush(player !== null);
  const movements = useQuery({ queryKey: ['movements'], queryFn: api.movements, enabled: player !== null, refetchInterval: 20_000 });
  const reports = useQuery({ queryKey: ['reports'], queryFn: api.reports, enabled: player !== null, refetchInterval: 60_000 });
  const markRead = useMutation({ mutationFn: api.markReportsRead, onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }) });
  const unread = reports.data?.reports.filter((r) => !r.read).length ?? 0;
  // A movement that should have arrived: ask the server what happened.
  const nextArrival = Math.min(...(movements.data ? [...movements.data.own, ...movements.data.incoming].map((m) => m.arriveAt) : []), Infinity);
  const arrived = now >= nextArrival;
  useEffect(() => {
    if (!arrived) return;
    void qc.invalidateQueries({ queryKey: ['movements'] });
    void qc.invalidateQueries({ queryKey: ['city'] });
    void qc.invalidateQueries({ queryKey: ['reports'] });
  }, [arrived, nextArrival, qc]);
  const attacks = movements.data?.incoming.filter((m) => m.type === 'attack') ?? [];
  const map = useWorldMap(player ? world.data!.world.ringsGenerated : 0);

  const topBar = (
    <header className="top">
      <span className="logo logo--small">ROMAVIS</span>
      {world.data && (
        <span className="top__round">{t('top.roundEnds')} <strong>{formatDuration(world.data.world.endsAt - now)}</strong></span>
      )}
      <span className="top__spacer" />
      <span className="top__user">{user.username}</span>
      <LanguageSwitch />
      <button className="btn btn--ghost" onClick={() => logout.mutate()}>{t('auth.logout')}</button>
    </header>
  );

  if (world.isLoading) return <div className="screen">{topBar}</div>;
  if (world.error || !world.data) {
    const code = world.error instanceof ApiError ? world.error.code : 'internal';
    return <div className="screen">{topBar}<main className="gate"><p className="card alert">{t(`error.${code}`, { defaultValue: t('error.internal') })}</p></main></div>;
  }
  const w = world.data.world;

  if (!player) {
    const err = join.error instanceof ApiError ? join.error.code : join.error ? 'internal' : null;
    return (
      <div className="screen">
        {topBar}
        <main className="gate">
          <div className="card center">
            <h2>{t('join.title')}</h2>
            <p className="muted">{t('join.body', { slug: w.slug, speed: w.speed, left: formatDuration(w.endsAt - now) })}</p>
            {err && <p className="alert" role="alert">{t(`error.${err}`, { defaultValue: t('error.internal') })}</p>}
            <button className="btn btn--wide" disabled={join.isPending} onClick={() => join.mutate()}>{t('join.action')}</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="screen">
      {topBar}
      <div className="stage">
        <GameMap rings={w.ringsGenerated} myPlayerId={player.id} focus={city.data ? { x: city.data.city.x, y: city.data.city.y } : null} />
        <SiteCard landmasses={map.landmasses} cities={map.cities} myPlayerId={player.id} />
        <button className="btn panel-toggle" aria-expanded={panelOpen} onClick={() => setPanelOpen(!panelOpen)}>
          {panelOpen ? t('top.map') : t('top.city')}
        </button>
        {attacks.length > 0 && (
          <button className="incoming" onClick={() => setTab('army')}>
            ⚔ {t('army.incomingAlert', { n: attacks.length, left: formatDuration(Math.min(...attacks.map((m) => m.arriveAt)) - now) })}
          </button>
        )}
        {panelOpen && city.data && (
          <aside className="panel">
            <nav className="tabs" aria-label="Panel">
              {(['city', 'army', 'reports'] as const).map((k) => (
                <button key={k} className={`tab ${tab === k ? 'tab--on' : ''}`} aria-current={tab === k} onClick={() => { setTab(k); if (k === 'reports' && unread > 0) markRead.mutate(); }}>
                  {t(`tab.${k}`)}{k === 'reports' && unread > 0 && <span className="dot">{unread}</span>}
                </button>
              ))}
            </nav>
            {tab === 'city' && <CityPanel city={city.data.city} speed={w.speed} />}
            {tab === 'army' && <ArmyPanel city={city.data.city} speed={w.speed} player={player} movements={movements.data} />}
            {tab === 'reports' && <ReportsPanel reports={reports.data?.reports ?? []} />}
          </aside>
        )}
        {city.data && <SendForm city={city.data.city} speed={w.speed} landmasses={map.landmasses} cities={map.cities} />}
      </div>
    </div>
  );
}

export function App() {
  const me = useQuery({ queryKey: ['me'], queryFn: api.me, retry: false, staleTime: Infinity });
  if (me.isLoading) return null;
  if (!me.data) return <AuthScreen />;
  return <Game user={me.data.user} />;
}
