import type { RefObject } from 'react';
import type { BasemapId } from '../types';
import type { MapHandle } from '../map/MapView';
import { useI18n } from '../i18n/I18n';
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

/** Colonne de contrôles en verre, côté fin de ligne. Le fond plan / satellite est un interrupteur à deux positions. */
export function MapControls({ map, compass, is3d, basemap, terrain, terrainLocked, onBasemap, onTerrain }: Props) {
  const { t } = useI18n();
  const satellite = basemap === 'satellite';

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
        <button
          type="button"
          className={`ctrl ctrl-3d ${is3d ? 'is-on' : ''}`}
          onClick={() => map.current?.toggle3d()}
          aria-label={is3d ? t('view2d') : t('view3d')}
          title={is3d ? t('view2d') : t('view3d')}
        >
          <Icon name="cube" />
          {/* Mode affiché : la pastille verte et « 3D » quand la vue est inclinée */}
          <span className="ctrl-tag">{is3d ? '3D' : '2D'}</span>
        </button>
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
        <button type="button" className="ctrl" onClick={() => map.current?.whole()} aria-label={t('wholeWilaya')} title={t('wholeWilaya')}>
          <Icon name="frame" />
        </button>
        <button
          type="button"
          className={`ctrl ${terrain ? 'is-on' : ''}`}
          onClick={() => onTerrain(!terrain)}
          disabled={terrainLocked}
          aria-pressed={terrain}
          aria-label={t('terrain3d')}
          title={t('terrain3d')}
        >
          <Icon name="mountain" />
        </button>
      </div>

      <button
        type="button"
        role="switch"
        className={`basemap-switch ${satellite ? 'is-satellite' : ''}`}
        aria-checked={satellite}
        aria-label={t('basemap_satellite')}
        title={satellite ? t('basemap_satellite') : t('basemap_plan')}
        onClick={() => onBasemap(satellite ? 'plan' : 'satellite')}
      >
        <span className="basemap-knob" aria-hidden="true" />
        <span className="basemap-icon is-plan" aria-hidden="true">
          <Icon name="map" />
        </span>
        <span className="basemap-icon is-satellite" aria-hidden="true">
          <Icon name="globe" />
        </span>
      </button>
    </div>
  );
}
