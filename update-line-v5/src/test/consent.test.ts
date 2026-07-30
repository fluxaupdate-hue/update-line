import { describe, it, expect } from 'vitest';
import { isMinor, needsParentalConsent } from '../types';

// Ces deux fonctions décident qui a accès à quoi dans toute l'application, en particulier
// pour les mineurs. Des tests solides ici valent plus que sur n'importe quel autre module :
// une régression silencieuse pourrait donner accès à un enfant sans consentement parental.

function isoDateYearsAgo(years: number, extraDays = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() - extraDays);
  return d.toISOString().slice(0, 10);
}

describe('isMinor', () => {
  it('retourne true si la date de naissance est null (prudence par défaut)', () => {
    expect(isMinor(null)).toBe(true);
  });

  it('retourne true pour un enfant de 10 ans', () => {
    expect(isMinor(isoDateYearsAgo(10))).toBe(true);
  });

  it('retourne true pour quelqu\'un de 17 ans et 364 jours (juste avant ses 18 ans)', () => {
    expect(isMinor(isoDateYearsAgo(18, -1))).toBe(true);
  });

  it('retourne false pour quelqu\'un ayant tout juste eu 18 ans', () => {
    expect(isMinor(isoDateYearsAgo(18, 1))).toBe(false);
  });

  it('retourne false pour un adulte de 25 ans', () => {
    expect(isMinor(isoDateYearsAgo(25))).toBe(false);
  });

  it('retourne false pour un adulte de 65 ans', () => {
    expect(isMinor(isoDateYearsAgo(65))).toBe(false);
  });
});

describe('needsParentalConsent', () => {
  it('retourne false si le profil est null (pas encore chargé)', () => {
    expect(needsParentalConsent(null)).toBe(false);
  });

  it('retourne true pour un mineur sans consentement validé', () => {
    expect(
      needsParentalConsent({ date_naissance: isoDateYearsAgo(12), consent_parental_valide: false })
    ).toBe(true);
  });

  it('retourne false pour un mineur AVEC consentement validé', () => {
    expect(
      needsParentalConsent({ date_naissance: isoDateYearsAgo(12), consent_parental_valide: true })
    ).toBe(false);
  });

  it('retourne false pour un majeur, même si consent_parental_valide est false', () => {
    expect(
      needsParentalConsent({ date_naissance: isoDateYearsAgo(30), consent_parental_valide: false })
    ).toBe(false);
  });

  it('retourne true si la date de naissance est manquante (prudence par défaut)', () => {
    expect(needsParentalConsent({ date_naissance: null, consent_parental_valide: false })).toBe(true);
  });
});
