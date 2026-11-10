import type { BuildingId, Levels, Resources, UnitCounts, UnitId } from '@romavis/shared';

export class ApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? 'internal', res.status);
  return data as T;
}

export interface UserDto { id: number; username: string; locale: string }
export interface WorldDto { id: number; slug: string; speed: number; ringsGenerated: number; startsAt: number; endsAt: number }
export interface PlayerDto { id: number; cityIds: number[]; protectedUntil: number | null; nightWatchStart: number | null; gloriaBattle: number }
export interface SiteDto { id: number; kind: 'city' | 'native'; x: number; y: number }
export interface LandmassDto { id: number; ring: number; x: number; y: number; radius: number; sites: SiteDto[] }
export interface MapCityDto { cityId: number; siteId: number; name: string; playerId: number | null; playerName: string | null; points: number }
export interface OrderDto { id: number; building: BuildingId; targetLevel: number; startedAt: number | null; dueAt: number | null }
export interface CityDto {
  id: number; name: string; siteId: number; x: number; y: number;
  timber: number; stone: number; iron: number; resourcesAt: number; levels: Levels; queue: OrderDto[];
  landmassId: number;
  units: UnitCounts;
  support: { homeCityId: number; cityName: string; playerName: string | null; units: UnitCounts }[];
  away: { cityId: number; cityName: string; units: UnitCounts }[];
  unitPop: number;
  recruitQueue: { id: number; building: string; unit: UnitId; count: number; startedAt: number | null; dueAt: number | null }[];
  natives: { siteId: number; standing: number; standingAt: number; tributeAt: number }[];
}
export type MovementType = 'attack' | 'support' | 'raid' | 'return';
export interface MovementDto {
  id: number; type: MovementType; homeCityId: number; fromSiteId: number; toSiteId: number;
  units: UnitCounts; loot: Resources | null; departAt: number; arriveAt: number;
}
export interface IncomingDto { id: number; type: MovementType; toSiteId: number; cityId: number; arriveAt: number }
export interface MovementsResponse { serverTime: number; own: MovementDto[]; incoming: IncomingDto[] }
export interface ReportData {
  cityName?: string; siteId: number; attacker: string | null; defender: string | null; attackerWins: boolean;
  attack: number; defense: number; luck: number; nightWatch: boolean; murus: number;
  attackers: UnitCounts; attackerLosses: UnitCounts; defenders: UnitCounts; defenderLosses: UnitCounts; loot: Resources | null;
}
export interface ReportDto { id: number; kind: 'attack' | 'defense' | 'raid'; data: ReportData; createdAt: number; read: boolean }
export interface CityResponse { serverTime: number; city: CityDto }

export const api = {
  me: () => request<{ user: UserDto }>('GET', '/api/auth/me'),
  register: (b: { username: string; email: string; password: string; locale: string }) =>
    request<{ user: UserDto }>('POST', '/api/auth/register', b),
  login: (b: { identifier: string; password: string }) => request<{ user: UserDto }>('POST', '/api/auth/login', b),
  logout: () => request<{ ok: true }>('POST', '/api/auth/logout', {}),
  world: () => request<{ serverTime: number; world: WorldDto; player: PlayerDto | null }>('GET', '/api/world'),
  join: () => request<{ player: PlayerDto }>('POST', '/api/world/join', {}),
  ring: (n: number) => request<{ landmasses: LandmassDto[] }>('GET', `/api/world/rings/${n}`),
  ringCities: (n: number) => request<{ cities: MapCityDto[] }>('GET', `/api/world/rings/${n}/cities`),
  city: (id: number) => request<CityResponse>('GET', `/api/cities/${id}`),
  build: (id: number, building: BuildingId) => request<CityResponse>('POST', `/api/cities/${id}/build`, { building }),
  cancel: (id: number, orderId: number) => request<CityResponse>('DELETE', `/api/cities/${id}/build/${orderId}`),
  recruit: (id: number, unit: UnitId, count: number) => request<CityResponse>('POST', `/api/cities/${id}/recruit`, { unit, count }),
  collectTribute: (id: number) => request<CityResponse>('POST', `/api/cities/${id}/collect-tribute`, {}),
  movements: () => request<MovementsResponse>('GET', '/api/movements'),
  send: (b: { fromCityId: number; toSiteId: number; type: Exclude<MovementType, 'return'>; units: UnitCounts }) =>
    request<MovementsResponse>('POST', '/api/movements', b),
  recall: (id: number) => request<MovementsResponse>('POST', `/api/movements/${id}/recall`, {}),
  returnSupport: (hostCityId: number, homeCityId: number) => request<{ ok: true }>('POST', '/api/support/return', { hostCityId, homeCityId }),
  reports: () => request<{ reports: ReportDto[] }>('GET', '/api/reports'),
  markReportsRead: () => request<{ ok: true }>('POST', '/api/reports/read', {}),
  setNightWatch: (startHour: number) => request<{ player: PlayerDto }>('POST', '/api/player/night-watch', { startHour }),
};
