import { describe, it, expect } from 'vitest';
import { verifierContenu } from '../lib/moderation';

describe('verifierContenu', () => {
  it('autorise un message normal', () => {
    expect(verifierContenu('Bravo à toute l\'équipe pour la victoire !').autorise).toBe(true);
  });

  it('bloque un mot interdit en français', () => {
    const result = verifierContenu('Espèce de connard');
    expect(result.autorise).toBe(false);
    expect(result.motDetecte).toBe('connard');
  });

  it('bloque un mot interdit en anglais', () => {
    expect(verifierContenu('you are a bitch').autorise).toBe(false);
  });

  it('détecte le mot même en majuscules', () => {
    expect(verifierContenu('CONNARD').autorise).toBe(false);
  });

  it('détecte le mot même avec des accents différents', () => {
    expect(verifierContenu('nÈgre').autorise).toBe(false);
  });

  it('n\'autorise pas une incitation à la violence', () => {
    expect(verifierContenu('je vais te tuer après le match').autorise).toBe(false);
  });

  it('ne bloque pas un mot inoffensif contenant une sous-chaîne coïncidente', () => {
    // "classe" ne doit pas être bloqué même s'il contient des lettres de mots interdits
    expect(verifierContenu('quelle classe ce but !').autorise).toBe(true);
  });
});
