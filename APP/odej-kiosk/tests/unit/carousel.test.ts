import { describe, expect, it } from 'vitest';
import { carouselPose } from '../../src/lib/carousel';
import { shade } from '../../src/map/markers';
import { previewImage } from '../../src/map/previewCard';
import type { Establishment } from '../../src/types';

const x = (transform: string) => parseFloat(/translate3d\((-?[\d.]+)%/.exec(transform)![1]);

describe('carouselPose', () => {
  it('met la photo courante au centre, de face, devant les autres', () => {
    const pose = carouselPose(0, false);
    expect(x(pose.transform)).toBe(0);
    expect(pose.transform).toContain('rotateY(0.00deg)');
    expect(pose.z).toBeGreaterThan(carouselPose(1, false).z);
    expect(pose.shade).toBe(0);
  });

  it('range la suivante du côté de la lecture : à droite en anglais, à gauche en arabe', () => {
    expect(x(carouselPose(1, false).transform)).toBeGreaterThan(0);
    expect(x(carouselPose(1, true).transform)).toBeLessThan(0);
    expect(x(carouselPose(-1, true).transform)).toBeGreaterThan(0);
  });

  it('efface les cartes au bord de la fenêtre rendue', () => {
    expect(carouselPose(2, false).opacity).toBe(1);
    expect(carouselPose(3, false).opacity).toBe(0);
    expect(carouselPose(2.5, false).opacity).toBeCloseTo(0.5);
  });

  it('suit le doigt sans à-coup entre deux crans', () => {
    const a = x(carouselPose(0.49, false).transform);
    const b = x(carouselPose(0.51, false).transform);
    expect(Math.abs(b - a)).toBeLessThan(2);
  });
});

describe('shade', () => {
  it('éclaircit vers le blanc et assombrit vers le noir', () => {
    expect(shade('#000000', 1)).toBe('rgb(255, 255, 255)');
    expect(shade('#FFFFFF', -1)).toBe('rgb(0, 0, 0)');
    expect(shade('#1F6E3E', 0)).toBe('rgb(31, 110, 62)');
  });
});

describe('previewImage', () => {
  const base: Establishment = { id: 'a', name: { ar: 'أ', en: 'A' }, category: 'c', placeId: null, location: { lat: 36.7, lng: 5 } };

  it('prend la couverture, sinon la première photo, jamais une vidéo', () => {
    expect(previewImage(base)).toBeNull();
    const video = { src: 'v.mp4', kind: 'video' as const };
    const photo = { src: 'p.webp', kind: 'image' as const };
    expect(previewImage({ ...base, media: { cover: { src: 'c.webp' }, gallery: [photo] } })).toBe('c.webp');
    expect(previewImage({ ...base, media: { cover: null, gallery: [video, photo] } })).toBe('p.webp');
  });
});
