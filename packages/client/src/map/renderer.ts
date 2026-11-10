import { Application, Container, Graphics, Text } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import type { LandmassDto, MapCityDto, SiteDto } from '../api.ts';

/** Screen pixels per world unit at zoom 1. Stored coordinates are world units x100. */
const PX = 14;
const toPx = (v: number) => (v / 100) * PX;

const COLOR = {
  sea: 0x1f5673, shallows: 0x2b6f8f, sand: 0xe3cfa0, land: 0x93a560, landDark: 0x7d9150,
  mine: 0xf2c14e, other: 0xb33a2b, neutral: 0x8a8a8a, free: 0xffffff, native: 0x6b4f2a, select: 0xffffff, ink: 0x2a1d12,
};

export interface MapData {
  landmasses: LandmassDto[];
  cities: MapCityDto[];
  myPlayerId: number | null;
  selectedSiteId: number | null;
}

function coastline(lm: LandmassDto, scale: number): number[] {
  // Low-frequency wobble seeded by the landmass id: stable, and never cuts inside the sites.
  const p = (k: number) => ((lm.id * 9301 + k * 49297) % 233280) / 233280 * Math.PI * 2;
  const pts: number[] = [];
  const r0 = toPx(lm.radius) * scale;
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const r = r0 * (1 + 0.07 * Math.sin(2 * a + p(1)) + 0.06 * Math.sin(3 * a + p(2)) + 0.04 * Math.sin(5 * a + p(3)));
    pts.push(toPx(lm.x) + Math.cos(a) * r, toPx(lm.y) + Math.sin(a) * r);
  }
  return pts;
}

export class MapRenderer {
  private app = new Application();
  private viewport!: Viewport;
  private land = new Graphics();
  private markers = new Graphics();
  private labels = new Container();
  private data: MapData = { landmasses: [], cities: [], myPlayerId: null, selectedSiteId: null };
  private ready = false;
  private destroyed = false;
  private pendingFocus: { x: number; y: number } | null = null;

  constructor(private host: HTMLElement, private onSelect: (siteId: number | null) => void) {}

  async init(): Promise<void> {
    await this.app.init({
      resizeTo: this.host, background: COLOR.sea, antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true,
    });
    if (this.destroyed) {
      this.app.destroy(true, { children: true });
      return;
    }
    this.host.appendChild(this.app.canvas);
    this.viewport = new Viewport({
      screenWidth: this.host.clientWidth, screenHeight: this.host.clientHeight, events: this.app.renderer.events,
    });
    this.viewport.drag().pinch().wheel({ smooth: 4 }).decelerate().clampZoom({ minScale: 0.25, maxScale: 4 });
    this.viewport.addChild(this.land, this.markers, this.labels);
    this.app.stage.addChild(this.viewport);
    this.app.renderer.on('resize', (w: number, h: number) => this.viewport.resize(w, h));
    this.viewport.on('clicked', (e) => this.onSelect(this.siteAt(e.world.x, e.world.y)?.id ?? null));
    this.viewport.on('zoomed', () => this.updateLabels());
    this.viewport.setZoom(1.6, true);
    this.viewport.moveCenter(0, 0);
    this.ready = true;
    this.draw();
    if (this.pendingFocus) this.focus(this.pendingFocus.x, this.pendingFocus.y);
  }

  destroy(): void {
    this.destroyed = true;
    if (this.ready) this.app.destroy(true, { children: true });
  }

  setData(data: MapData): void {
    this.data = data;
    if (this.ready) this.draw();
  }

  /** Centre the view on a stored (x100) world position. */
  focus(x: number, y: number): void {
    if (!this.ready) {
      this.pendingFocus = { x, y };
      return;
    }
    this.pendingFocus = null;
    this.viewport.moveCenter(toPx(x), toPx(y));
  }

  private siteAt(wx: number, wy: number): SiteDto | null {
    let best: SiteDto | null = null;
    let bestD = (PX * 0.9) ** 2;
    for (const lm of this.data.landmasses) {
      for (const s of lm.sites) {
        const d = (toPx(s.x) - wx) ** 2 + (toPx(s.y) - wy) ** 2;
        if (d < bestD) {
          best = s;
          bestD = d;
        }
      }
    }
    return best;
  }

  private updateLabels(): void {
    const scale = this.viewport.scale.x;
    this.labels.visible = scale >= 0.9;
    for (const child of this.labels.children) child.scale.set(1 / scale);
  }

  private draw(): void {
    const { landmasses, cities, myPlayerId, selectedSiteId } = this.data;
    const cityBySite = new Map(cities.map((c) => [c.siteId, c]));
    this.land.clear();
    this.markers.clear();
    for (const child of this.labels.removeChildren()) child.destroy();

    for (const lm of landmasses) this.land.poly(coastline(lm, 1.32)).fill({ color: COLOR.shallows, alpha: 0.55 });
    for (const lm of landmasses) {
      this.land.poly(coastline(lm, 1.1)).fill(COLOR.sand);
      this.land.poly(coastline(lm, 1)).fill(COLOR.land);
      this.land.poly(coastline(lm, 0.55)).fill({ color: COLOR.landDark, alpha: 0.5 });
    }

    for (const lm of landmasses) {
      for (const s of lm.sites) {
        const x = toPx(s.x);
        const y = toPx(s.y);
        if (s.id === selectedSiteId) this.markers.circle(x, y, PX * 0.62).stroke({ width: 2, color: COLOR.select });
        if (s.kind === 'native') {
          const r = PX * 0.3;
          this.markers.poly([x, y - r, x + r, y + r * 0.8, x - r, y + r * 0.8]).fill(COLOR.native).stroke({ width: 1, color: COLOR.ink, alpha: 0.6 });
          continue;
        }
        const city = cityBySite.get(s.id);
        if (!city) {
          this.markers.circle(x, y, PX * 0.2).stroke({ width: 1.5, color: COLOR.free, alpha: 0.55 });
          continue;
        }
        const mine = city.playerId !== null && city.playerId === myPlayerId;
        const color = mine ? COLOR.mine : city.playerId === null ? COLOR.neutral : COLOR.other;
        const r = PX * (0.28 + Math.min(0.2, city.points / 6000));
        this.markers.rect(x - r, y - r, r * 2, r * 2).fill(color).stroke({ width: 1.5, color: COLOR.ink });
        const label = new Text({
          text: city.name,
          style: { fontFamily: 'Georgia, serif', fontSize: 12, fill: 0xffffff, stroke: { color: COLOR.ink, width: 3 } },
        });
        label.anchor.set(0.5, 0);
        label.position.set(x, y + r + 2);
        this.labels.addChild(label);
      }
    }
    this.updateLabels();
  }
}
