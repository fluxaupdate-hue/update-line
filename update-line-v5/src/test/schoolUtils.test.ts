import { describe, it, expect } from 'vitest';
import { calculerMoyenneSur20, moyenneEnAlerte } from '../lib/schoolUtils';

describe('calculerMoyenneSur20', () => {
  it('retourne null s\'il n\'y a aucune note', () => {
    expect(calculerMoyenneSur20([])).toBeNull();
  });

  it('calcule correctement une moyenne simple sur 20', () => {
    expect(calculerMoyenneSur20([{ note: 15, bareme: 20 }, { note: 10, bareme: 20 }])).toBe(12.5);
  });

  it('ramène correctement des barèmes différents à 20', () => {
    // 8/10 = 16/20, 5/20 = 5/20 → moyenne = (16+5)/2 = 10.5
    expect(calculerMoyenneSur20([{ note: 8, bareme: 10 }, { note: 5, bareme: 20 }])).toBe(10.5);
  });

  it('gère une seule note', () => {
    expect(calculerMoyenneSur20([{ note: 18, bareme: 20 }])).toBe(18);
  });
});

describe('moyenneEnAlerte (seuil de blocage match)', () => {
  it('n\'alerte pas si aucune moyenne n\'est encore calculée', () => {
    expect(moyenneEnAlerte(null)).toBe(false);
  });

  it('alerte si la moyenne est strictement inférieure à 10', () => {
    expect(moyenneEnAlerte(9.99)).toBe(true);
    expect(moyenneEnAlerte(5)).toBe(true);
  });

  it('n\'alerte pas à exactement 10/20', () => {
    expect(moyenneEnAlerte(10)).toBe(false);
  });

  it('n\'alerte pas au-dessus de 10', () => {
    expect(moyenneEnAlerte(14.2)).toBe(false);
  });
});
