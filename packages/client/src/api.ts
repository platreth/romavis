import type { BuildingId, Levels } from '@romavis/shared';

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
export interface PlayerDto { id: number; cityIds: number[] }
export interface SiteDto { id: number; kind: 'city' | 'native'; x: number; y: number }
export interface LandmassDto { id: number; ring: number; x: number; y: number; radius: number; sites: SiteDto[] }
export interface MapCityDto { cityId: number; siteId: number; name: string; playerId: number | null; playerName: string | null; points: number }
export interface OrderDto { id: number; building: BuildingId; targetLevel: number; startedAt: number | null; dueAt: number | null }
export interface CityDto {
  id: number; name: string; siteId: number; x: number; y: number;
  timber: number; stone: number; iron: number; resourcesAt: number; levels: Levels; queue: OrderDto[];
}
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
};
