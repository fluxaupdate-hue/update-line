// Filtre de premier niveau, côté client, avant publication sur le mur du club.
// Ce n'est PAS une garantie de modération complète : le bouton "signaler" + le retrait par
// un coach/admin (voir CommunityPage) restent la ligne de défense principale pour tout ce
// que cette liste ne couvre pas. Cette liste est volontairement courte et se concentre sur
// les cas les plus évidents (insultes grossières, incitation à la violence) ; elle doit être
// enrichie avec l'usage réel et adaptée aux expressions locales par chaque centre.

const MOTS_INTERDITS_FR = [
  'connard', 'connasse', 'salope', 'pute', 'enculé', 'nègre', 'pd', 'pédé',
  'crève', 'je vais te tuer', 'suicide toi',
];

const MOTS_INTERDITS_EN = [
  'fuck', 'bitch', 'nigger', 'faggot', 'kill yourself', 'kys',
];

const TOUS_LES_MOTS = [...MOTS_INTERDITS_FR, ...MOTS_INTERDITS_EN];

function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // retire les accents pour éviter les contournements simples
}

export interface ResultatModeration {
  autorise: boolean;
  motDetecte?: string;
}

export function verifierContenu(texte: string): ResultatModeration {
  const normalise = normaliser(texte);
  for (const mot of TOUS_LES_MOTS) {
    if (normalise.includes(normaliser(mot))) {
      return { autorise: false, motDetecte: mot };
    }
  }
  return { autorise: true };
}
