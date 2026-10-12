import {
  haversineKm,
  obfuscateCoordinates,
  OBFUSCATION_GRID_DEG,
  OBFUSCATION_MAX_OFFSET_DEG,
} from './location-obfuscation.helper';

const LAT = -25.286712;
const LNG = -57.647031;
const DAY = new Date('2026-10-12T10:00:00Z');

describe('obfuscateCoordinates', () => {
  it('es determinista por profesional y dia (mismo resultado aunque cambie la hora)', () => {
    const a = obfuscateCoordinates(LAT, LNG, 7, 's', DAY);
    const b = obfuscateCoordinates(
      LAT,
      LNG,
      7,
      's',
      new Date('2026-10-12T23:59:00Z'),
    );
    expect(a).toEqual(b);
  });

  it('no se puede promediar: movimientos dentro de la misma celda dan el mismo pin', () => {
    const a = obfuscateCoordinates(LAT, LNG, 7, 's', DAY);
    const b = obfuscateCoordinates(LAT + 0.0003, LNG - 0.0003, 7, 's', DAY);
    expect(a).toEqual(b);
  });

  it('cambia entre profesionales, dias y secretos', () => {
    const base = obfuscateCoordinates(LAT, LNG, 7, 's', DAY);
    expect(obfuscateCoordinates(LAT, LNG, 8, 's', DAY)).not.toEqual(base);
    expect(
      obfuscateCoordinates(LAT, LNG, 7, 's', new Date('2026-10-13T10:00:00Z')),
    ).not.toEqual(base);
    expect(obfuscateCoordinates(LAT, LNG, 7, 'otro', DAY)).not.toEqual(base);
  });

  it('el desplazamiento esta acotado (< ~330 m) y nunca devuelve la coordenada exacta', () => {
    const max = OBFUSCATION_GRID_DEG / 2 + OBFUSCATION_MAX_OFFSET_DEG;
    for (let id = 1; id <= 200; id++) {
      const lat = LAT + id * 0.00137;
      const lng = LNG - id * 0.00091;
      const o = obfuscateCoordinates(lat, lng, id, 's', DAY);
      expect(Math.abs(o.latitude - lat)).toBeLessThanOrEqual(max + 1e-6);
      expect(Math.abs(o.longitude - lng)).toBeLessThanOrEqual(max + 1e-6);
      expect(haversineKm(lat, lng, o.latitude, o.longitude)).toBeLessThan(0.33);
      expect(o).not.toEqual({ latitude: lat, longitude: lng });
    }
  });
});
