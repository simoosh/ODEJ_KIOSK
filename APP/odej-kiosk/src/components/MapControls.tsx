import { useState, type RefObject } from 'react';
import type { BasemapId } from '../types';
import type { MapHandle } from '../map/MapView';
import { BASEMAPS } from '../map/basemaps';
import { useI18n } from '../i18n/I18n';
import type { StringKey } from '../i18n/strings';
import { Icon } from './Icon';

interface Props {
  map: RefObject<MapHandle | null>;
  compass: RefObject<HTMLSpanElement | null>;
  is3d: boolean;
  basemap: BasemapId;
  terrain: boolean;
  terrainLocked: boolean;
  onBasemap(id: BasemapId): void;
  onTerrain(on: boolean): void;
}

export function MapControls({ map, compass, is3d, basemap, terrain, terrainLocked, onBasemap, onTerrain }: Props) {
  const { t } = useI18n();
  const [layersOpen, setLayersOpen] = useState(false);
  const visible = BASEMAPS.filter((b) => (__ARTIFACT__ ? true : b.id !== 'preview'));

  return (
    <div className="controls">
      <div className="ctrl-group">
        <button type="button" className="ctrl" onClick={() => map.current?.resetNorth()} aria-label={t('resetNorth')} title={t('resetNorth')}>
          <span className="compass" ref={compass}>
            <Icon name="compass" />
          </span>
        </button>
      </div>

      <div className="ctrl-group">
        <button type="button" className="ctrl" onClick={() => map.current?.zoomBy(1)} aria-label={t('zoomIn')} title={t('zoomIn')}>
          <Icon name="plus" />
        </button>
        <button type="button" className="ctrl" onClick={() => map.current?.zoomBy(-1)} aria-label={t('zoomOut')} title={t('zoomOut')}>
          <Icon name="minus" />
        </button>
      </div>

      <div className="ctrl-group">
        <button type="button" className="ctrl" onClick={() => map.current?.tiltBy(12)} aria-label={t('tiltUp')} title={t('tiltUp')}>
          <Icon name="tiltUp" />
        </button>
        <button type="button" className="ctrl" onClick={() => map.current?.tiltBy(-12)} aria-label={t('tiltDown')} title={t('tiltDown')}>
          <Icon name="tiltDown" />
        </button>
        <button type="button" className="ctrl" onClick={() => map.current?.rotateBy(-30)} aria-label={t('rotateLeft')} title={t('rotateLeft')}>
          <Icon name="rotateLeft" />
        </button>
        <button type="button" className="ctrl" onClick={() => map.current?.rotateBy(30)} aria-label={t('rotateRight')} title={t('rotateRight')}>
          <Icon name="rotateRight" />
        </button>
      </div>

      <div className="ctrl-group">
        <button type="button" className="ctrl ctrl-text" onClick={() => map.current?.toggle3d()} aria-label={is3d ? t('view2d') : t('view3d')} title={is3d ? t('view2d') : t('view3d')}>
          {is3d ? '2D' : '3D'}
        </button>
        <button type="button" className="ctrl" onClick={() => map.current?.whole()} aria-label={t('wholeWilaya')} title={t('wholeWilaya')}>
          <Icon name="frame" />
        </button>
        <button
          type="button"
          className={`ctrl ${layersOpen ? 'is-on' : ''}`}
          onClick={() => setLayersOpen((v) => !v)}
          aria-label={t('layers')}
          aria-expanded={layersOpen}
          title={t('layers')}
        >
          <Icon name="layers" />
        </button>
      </div>

      {layersOpen && (
        <div className="layers-pop" role="dialog" aria-label={t('layers')}>
          <h3>{t('layers')}</h3>
          <div className="layer-grid">
            {visible.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`layer-tile ${basemap === b.id ? 'is-on' : ''} ${__ARTIFACT__ && b.online ? 'is-offline' : ''}`}
                onClick={() => onBasemap(b.id)}
                aria-pressed={basemap === b.id}
              >
                <span
                  className="layer-swatch"
                  style={{ background: `linear-gradient(135deg, ${b.swatch[0]} 0 45%, ${b.swatch[1]} 45% 75%, ${b.swatch[2]} 75%)` }}
                />
                <span>{t(`basemap_${b.id}` as StringKey)}</span>
              </button>
            ))}
          </div>
          <label className={`switch ${__ARTIFACT__ || terrainLocked ? 'is-disabled' : ''}`}>
            <input id="terrain-toggle" type="checkbox" checked={terrain} disabled={__ARTIFACT__ || terrainLocked} onChange={(e) => onTerrain(e.target.checked)} />
            <span className="switch-track" aria-hidden="true" />
            <span>{t('terrain3d')}</span>
          </label>
        </div>
      )}
    </div>
  );
}
