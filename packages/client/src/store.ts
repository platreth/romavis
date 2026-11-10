import { useEffect, useState } from 'react';
import { create } from 'zustand';

interface UiState {
  selectedSiteId: number | null;
  /** Server time minus local time, in ms. */
  clockOffset: number;
  panelOpen: boolean;
  tab: 'city' | 'army' | 'reports';
  /** Site an army is being sent to, with the kind of mission. */
  sending: { siteId: number; type: 'attack' | 'support' | 'raid' } | null;
  setTab: (tab: UiState['tab']) => void;
  setSending: (sending: UiState['sending']) => void;
  select: (siteId: number | null) => void;
  syncClock: (serverTime: number) => void;
  setPanelOpen: (open: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  selectedSiteId: null,
  clockOffset: 0,
  panelOpen: true,
  tab: 'city',
  sending: null,
  setTab: (tab) => set({ tab, panelOpen: true }),
  setSending: (sending) => set({ sending }),
  select: (selectedSiteId) => set({ selectedSiteId }),
  syncClock: (serverTime) => set({ clockOffset: serverTime - Date.now() }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
}));

/** Current server time, re-rendering once a second. */
export function useServerNow(): number {
  const offset = useUi((s) => s.clockOffset);
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    setNow(Date.now() + offset);
    const id = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(id);
  }, [offset]);
  return now;
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  const hms = `${h}:${pad(m)}:${pad(s % 60)}`;
  return d > 0 ? `${d}d ${hms}` : hms;
}
