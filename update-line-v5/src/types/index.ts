export type UserRole = 'joueur' | 'coach' | 'admin_centre' | 'parent' | 'recruteur';

export interface Profile {
  id: string;
  centre_id: string | null;
  sport_id: string | null;
  role: UserRole;
  nom_complet: string;
  date_naissance: string | null;
  photo_url: string | null;
  poste: string | null;
  taille_cm: number | null;
  poids_kg: number | null;
  ecole: string | null;
  fb_url: string | null;
  ig_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  verifie_par_centre: boolean;
  parent_email: string | null;
  consent_parental_valide: boolean;
  consent_token: string | null;
  recrutement_token: string | null;
  langue_pref: 'fr' | 'en';
  xp_total: number;
  mode_sombre: boolean;
  theme_choisi: string;
  recrutement_active: boolean;
  recrutement_valide_par_parent: boolean;
  agent_libre: boolean;
  parcours_texte: string | null;
  recruteur_organisation: string | null;
  recruteur_licence: string | null;
  recruteur_verifie: boolean;
}

export function isMinor(dateNaissance: string | null): boolean {
  if (!dateNaissance) return true; // par prudence, traiter comme mineur si inconnu
  const dob = new Date(dateNaissance);
  const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return age < 18;
}

// Extrait en fonction pure (plutôt que gardé uniquement inline dans AuthContext) pour pouvoir
// être testé unitairement sans avoir à simuler tout le contexte React/Supabase : c'est la
// fonction qui décide si un mineur a accès ou non à l'application, donc la plus critique à
// couvrir par des tests.
export function needsParentalConsent(profile: { date_naissance: string | null; consent_parental_valide: boolean } | null): boolean {
  if (!profile) return false;
  return isMinor(profile.date_naissance) && !profile.consent_parental_valide;
}

export type ReportCategory = 'violence' | 'harcelement' | 'abus' | 'autre';
export type ReportStatus = 'nouveau' | 'en_cours' | 'resolu' | 'archive';

export interface Signalement {
  id: string;
  centre_id: string | null;
  profile_id: string | null; // null = anonyme
  categorie: ReportCategory;
  description: string;
  statut: ReportStatus;
  requiert_validation_parent: boolean;
  parent_valide: boolean;
  created_at: string;
}

export interface StatsEntry {
  id: string;
  profile_id: string;
  date_match: string;
  adversaire: string | null;
  stats: Record<string, number>;
  source: 'manuel' | 'ocr_scan';
  fiche_scan_url: string | null;
}
