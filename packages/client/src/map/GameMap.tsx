import { useQueries } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { api, type LandmassDto, type MapCityDto } from '../api.ts';
import { useUi } from '../store.ts';
import { MapRenderer } from './renderer.ts';

interface Props {
  rings: number;
  myPlayerId: number;
  focus: { x: number; y: number } | null;
}

export function useWorldMap(rings: number): { landmasses: LandmassDto[]; cities: MapCityDto[] } {
  const ringIds = useMemo(() => Array.from({ length: rings }, (_, i) => i), [rings]);
  const land = useQueries({
    queries: ringIds.map((n) => ({ queryKey: ['ring', n], queryFn: () => api.ring(n), staleTime: Infinity })),
  });
  const owned = useQueries({
    queries: ringIds.map((n) => ({ queryKey: ['ringCities', n], queryFn: () => api.ringCities(n), refetchInterval: 30_000 })),
  });
  const landKey = land.map((q) => q.dataUpdatedAt).join();
  const ownedKey = owned.map((q) => q.dataUpdatedAt).join();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const landmasses = useMemo(() => land.flatMap((q) => q.data?.landmasses ?? []), [landKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cities = useMemo(() => owned.flatMap((q) => q.data?.cities ?? []), [ownedKey]);
  return { landmasses, cities };
}

export function GameMap({ rings, myPlayerId, focus }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const renderer = useRef<MapRenderer | null>(null);
  const selectedSiteId = useUi((s) => s.selectedSiteId);
  const select = useUi((s) => s.select);
  const { landmasses, cities } = useWorldMap(rings);

  useEffect(() => {
    if (!host.current) return;
    const r = new MapRenderer(host.current, select);
    renderer.current = r;
    void r.init();
    return () => {
      renderer.current = null;
      r.destroy();
    };
  }, [select]);

  useEffect(() => {
    renderer.current?.setData({ landmasses, cities, myPlayerId, selectedSiteId });
  }, [landmasses, cities, myPlayerId, selectedSiteId]);

  const fx = focus?.x;
  const fy = focus?.y;
  useEffect(() => {
    if (fx !== undefined && fy !== undefined) renderer.current?.focus(fx, fy);
  }, [fx, fy]);

  return <div className="map" ref={host} />;
}
