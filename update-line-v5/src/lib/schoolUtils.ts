export interface NoteScolaire {
  note: number;
  bareme: number;
}

/**
 * Calcule la moyenne sur 20, tous barèmes ramenés à 20 avant la moyenne.
 * Retourne null s'il n'y a aucune note (plutôt que 0, pour ne pas déclencher
 * l'alerte "moyenne trop basse" en l'absence de données).
 */
export function calculerMoyenneSur20(notes: NoteScolaire[]): number | null {
  if (notes.length === 0) return null;
  const total = notes.reduce((sum, n) => sum + (n.note / n.bareme) * 20, 0);
  return total / notes.length;
}

export const SEUIL_ALERTE_MOYENNE = 10;

export function moyenneEnAlerte(moyenne: number | null): boolean {
  return moyenne !== null && moyenne < SEUIL_ALERTE_MOYENNE;
}
