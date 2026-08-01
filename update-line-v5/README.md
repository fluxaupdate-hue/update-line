# Update Line

**FR :** *"Mets à jour ta ligne. Trace ta route."*
**EN:** *"Update Your Line. Trace Your Path."*

Plateforme bilingue (FR/EN) pour les jeunes athlètes 10-21 ans dans les centres sportifs africains.

---

## 🇫🇷 Statut de ce livrable : V1 complète (tous les modules ont une page fonctionnelle)

### Comptes & inscription
- **Inscription centre** (/signup-centre) : un centre crée son propre compte, choisit ses jours
  et horaires d'entraînement dès la création, ce qui génère immédiatement un code d'invitation
  et la structure prête à accueillir des joueurs.
- **Plusieurs admins par centre** : nativement supporté (le rôle est par profil, pas par compte).
  Un centre peut créer plusieurs comptes `admin_centre` rattachés au même centre.
- **Inscription joueur** (/signup) : recherche du centre par nom (autocomplete), confirmation
  par code d'invitation. Consentement parental **bloquant** pour les mineurs (email parent
  obligatoire, accès à l'app totalement verrouillé tant que le centre n'a pas validé).
- **Agent libre** : un joueur sans centre peut s'inscrire quand même et décrire son parcours
  (clubs précédents) en texte libre.
- **Remarques du centre** : un coach/admin peut ajouter une remarque sur un profil joueur, et
  choisir si elle reste privée (staff du centre) ou publique (visible par tous, ex. recruteurs).
- **Guide d'utilisation bilingue** (/guide) : explique chaque section, en français ou anglais
  selon la langue choisie par le joueur.

### Modules (tous avec une page fonctionnelle connectée à Supabase)
1. Dashboard / Profil 360°
2. Statistiques (saisie manuelle ; OCR et IA analytique en V2, voir note dans le module)
3. Vie de club (présence par code de séance, journal coach, exercices, calendrier matchs)
4. Scolaire (notes, moyenne calculée, alerte < 10/20)
5. Opportunités (bourses, écoles sportives, candidatures)
6. Sécurité & Signalement (anonyme, alerte parent si mineur)
7. Guide du Pro / Mentor (conseils, interdits/à faire, alerte arnaques ; contenu statique V1)
8. Communauté (mur du club + mode recruteur opt-in)
9. Admin Centre (valider consentements, vérifier joueurs, code d'invitation)
10. Check-in Bien-être quotidien (sommeil, humeur, stress, hydratation, nutrition, douleur)

### Ce qui reste en V2 (nécessite des services externes ou plus de temps)
- OCR de fiches de match (nécessite un provider OCR, ex. Google Vision)
- IA analytique réelle (nécessite un provider IA type Gemini/Groq, comme sur MalihaGroup)
- PWA offline-first (service worker + synchro différée)
- Messagerie temps réel coach↔joueur (actuellement juste le mur du club)
- Module Conformité & vérification des adultes (background check, formation ; table déjà
  dans le schéma SQL, UI à construire)
- Fiche médicale d'urgence (table déjà dans le schéma SQL, UI à construire)

### Installation

```bash
npm install
cp .env.example .env
# Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

Exécute `supabase/schema.sql` dans le SQL Editor de ton projet Supabase avant de démarrer.

---

## 🇬🇧 Status: V1 complete (every module has a working page)

Same feature set as above: self-service center signup (with training schedule set at creation,
auto-generating an invite code), native multi-admin support per center, player signup with
center search + invite code confirmation, blocking parental consent for minors, free-agent
signup path, center remarks with visibility control, and a bilingual in-app guide.

All 10 modules have a working page wired to Supabase. Real OCR/AI analysis, offline PWA support,
real-time messaging, and the adult-vetting/medical-emergency-card UIs are noted as V2 (their
database tables already exist in `supabase/schema.sql`).

### Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Stack

React 19 - TypeScript - Vite - Tailwind CSS v4 - i18next - Supabase (Auth/DB/Storage) - React Router

---

## 🇫🇷 V1.1 : Corrections structurelles suite à audit

Après relecture critique du concept, 4 failles structurelles ont été corrigées :

### 1. Mode Recruteur sécurisé (faille la plus grave)
Avant : n'importe qui pouvait se déclarer "recruteur" et voir les profils en mode recrutement.
Maintenant :
- Un compte recruteur (`/signup-recruteur`) est créé **non vérifié** (`recruteur_verifie = false`)
  et ne voit AUCUN profil tant qu'un centre ne l'a pas validé manuellement (file d'attente dans
  Admin Centre).
- Pour un mineur, l'opt-in du joueur seul (case à cocher) **n'active jamais** la visibilité :
  ça génère un lien de validation parentale séparé (`recrutement_valide_par_parent`), avec le
  même mécanisme sécurisé que le consentement d'inscription.
- La policy RLS `profil_select_recruteur_verifie` applique ces deux conditions au niveau base
  de données, pas seulement dans l'UI.

### 2. Consentement parental réellement automatisé
Avant : un email affiché en texte, à faire suivre manuellement, sans aucune vérification.
Maintenant :
- Un token unique et non-devinable (`consent_token`) est généré à l'inscription d'un mineur.
- Le joueur obtient un lien direct à copier ou envoyer par email (bouton mailto pré-rempli).
- Le parent ouvre ce lien SANS avoir besoin d'un compte au préalable, crée son propre compte
  "Parent" au moment de confirmer. Le tout passe par des fonctions PostgreSQL
  `SECURITY DEFINER` (`consent_lookup`, `consent_confirm`) qui ne révèlent que le strict
  nécessaire, jamais un accès en liste à tous les mineurs en attente.

### 3. Vraie vue Parent (avant : juste un email stocké)
- Un compte `role = 'parent'` existe maintenant réellement, créé automatiquement lors de la
  confirmation du consentement.
- Table `liens_parent_enfant` : lien fiable, créé uniquement via la confirmation par token
  (jamais déclaré librement par un utilisateur).
- `/parent` (page d'accueil pour ce rôle) : liste des enfants liés, statut du consentement,
  moyenne scolaire, alerte si douleur signalée récemment (via le check-in bien-être), et
  validation du mode Recruteur si une demande est en attente.

### 4. Dashboard restructuré : hiérarchie claire
Avant : 9 icônes identiques dans une grille, Sécurité au même niveau que "Opportunités".
Maintenant :
- Section **"Aujourd'hui"** en haut : check-in bien-être (si pas encore fait) + présence à la
  séance, les deux seules actions vraiment quotidiennes.
- Bouton **Sécurité flottant, permanent**, visible sur presque tout l'écran, dans toute l'app,
  plus jamais noyé dans une liste.
- Le reste (stats, école, opportunités, mentor, communauté, admin) est replié sous "Explorer",
  visible en un clic mais pas envahissant par défaut.

### Point de vigilance restant (documenté, pas corrigé)
Le "réseau de confiance" pour vérifier les recruteurs reste basique : n'importe quel admin d'un
centre peut vérifier n'importe quel recruteur, pas de vérification centralisée par Update Line
lui-même. Suffisant pour un lancement pilote avec quelques centres qui se connaissent, mais à
renforcer avant une ouverture large (ex. vérification manuelle centralisée, preuve de licence
fédérale uploadée et contrôlée).

## 🇬🇧 V1.1: Structural fixes after audit

Same four fixes as above: gated Recruiter mode (unverified by default, separate parental
approval for minors via secure token, enforced at the RLS level not just in the UI), a real
automated consent flow (secure token + SECURITY DEFINER functions, no raw list exposure),
a genuine Parent account and dashboard (not just a stored email), and a restructured dashboard
with a clear "Today" priority section and an always-visible Security button instead of a flat
grid of nine equal icons.

---

## 🇫🇷 V1.2 : système de design réel avec plusieurs thèmes

### Ressources gratuites utilisées (et où les retrouver)
- **DaisyUI** (daisyui.com) : plugin Tailwind gratuit et open-source, 35 thèmes prêts à l'emploi.
  Utilisé ici pour donner à l'app un vrai système de thèmes commutables.
- **Lucide** (lucide.dev) : bibliothèque d'icônes gratuite, utilisée pour remplacer les emojis
  par de vraies icônes sur le tableau de bord et le bouton Sécurité.
- Pour aller plus loin plus tard : HyperUI et Meraki UI (composants Tailwind à copier-coller,
  gratuits), Flowbite et Preline (bibliothèques de composants gratuites plus complètes),
  shadcn/ui (composants React qu'on possède à 100%, gratuit), unDraw (illustrations gratuites
  personnalisables à la couleur de la marque).

### Comment c'est intégré (pas juste des liens, du vrai code)
- `src/index.css` configure DaisyUI avec 4 thèmes réels : **Afrique Pro** (marque, par défaut),
  **Nuit Pro** (variante sombre de la marque), et deux thèmes professionnels DaisyUI prêts à
  l'emploi, **Corporate** et **Forest**.
- Astuce technique : les couleurs `ul-vert`, `ul-rouge`, etc. utilisées dans tout le code déjà
  écrit pointent maintenant vers les variables DaisyUI (`var(--color-primary)`, etc.) plutôt que
  vers des couleurs fixes. Résultat : changer de thème met à jour TOUTE l'application déjà
  construite, sans avoir eu besoin de retoucher chaque fichier un par un.
- `src/components/ThemeSwitcher.tsx` : sélecteur visuel des 4 thèmes, accessible depuis la page
  Guide (`/guide`). Le choix est sauvegardé localement et sur le profil Supabase de la personne
  connectée (colonne `theme_choisi`), donc il est retrouvé sur n'importe quel appareil.

### Pour ajouter d'autres thèmes ou en créer un sur mesure
Le générateur officiel (daisyui.com/theme-generator) permet de créer un thème par simple
glisser-déposer de couleurs, puis d'exporter le bloc CSS à coller dans `src/index.css` en
suivant le même modèle que `afrique_pro` et `nuit_pro` dans ce fichier.

## 🇬🇧 V1.2: real multi-theme design system

Same integration as above using DaisyUI (free, open-source, 35 built-in themes) and Lucide
(free icon set). Four real switchable themes ship today: Afrique Pro (brand default), Nuit Pro
(dark brand variant), and two ready-made professional DaisyUI themes, Corporate and Forest.
Existing `ul-*` color utilities used throughout the app now reference DaisyUI's live theme
variables, so switching themes updates every already-built screen at once. See
`src/components/ThemeSwitcher.tsx` (available on the `/guide` page) and daisyui.com/theme-generator
to add more themes later.

---

## 🇫🇷 V1.3 : manques techniques corrigés

### 1. Upload de vraies photos de profil
- `src/components/AvatarUpload.tsx` : composant réel avec Supabase Storage (plus de placeholder
  Dicebear une fois une vraie photo envoyée).
- Avant le premier déploiement : créer le bucket "avatars" (public) depuis le Dashboard Supabase
  > Storage > New bucket. Les policies de sécurité sont déjà dans `supabase/schema.sql`
  (chacun ne peut modifier que son propre fichier).
- Limite : 5 Mo, formats JPG/PNG/WEBP uniquement.

### 2. Emails automatiques réels (au lieu du mailto uniquement)
- `supabase/functions/send-consent-email/index.ts` : Edge Function qui envoie un vrai email
  via Resend (gratuit jusqu'à 100 emails/jour, largement suffisant pour démarrer).
- Déploiement :
  ```bash
  supabase secrets set RESEND_API_KEY=re_xxxxxxxx
  supabase functions deploy send-consent-email
  ```
- Le bouton "Envoyer par email" dans `PendingConsentPage` et `CommunityPage` (mode Recruteur)
  appelle cette fonction. Si elle n'est pas encore déployée, l'erreur est gérée proprement et
  le lien à copier / le mailto restent disponibles en secours : rien n'est bloqué en attendant.

### 3. Tests automatisés
- Vitest + React Testing Library installés (`npm run test`).
- 19 tests couvrent en priorité la logique la plus sensible de l'app :
  - `isMinor()` et `needsParentalConsent()` (détection de mineur et blocage d'accès tant que
    le consentement parental n'est pas confirmé) : c'est la fonction dont dépend toute la
    protection des mineurs, donc celle qui a le plus besoin d'être testée en premier.
  - `calculerMoyenneSur20()` et `moyenneEnAlerte()` (calcul de moyenne scolaire et seuil de
    blocage de match) : logique qui était dupliquée dans 2 fichiers, maintenant centralisée
    dans `src/lib/schoolUtils.ts` et testée une seule fois.
- Prochaine priorité de test (pas encore fait) : un test d'intégration du flux d'inscription
  complet (mineur → token généré → parent confirme → accès débloqué), qui nécessite de simuler
  Supabase plutôt que de l'appeler réellement.

## 🇬🇧 V1.3: technical gaps fixed

Real avatar upload via Supabase Storage (`AvatarUpload.tsx`, bucket setup instructions above),
a real transactional email Edge Function using Resend for the consent flow (mailto stays as a
working fallback if the function isn't deployed yet), and a Vitest test suite (19 tests)
covering the two most safety-critical pieces of logic in the app: minor detection / parental
consent gating, and the school-average calculation that drives the match-blocking alert.

---

## 🇫🇷 V1.4 : modération du mur du club + vérification réelle des coachs

### Modération (les deux mécanismes demandés)
- **Filtre automatique** (`src/lib/moderation.ts`, testé) : bloque avant publication les mots
  et expressions les plus évidents (insultes, incitation à la violence), en français et en
  anglais, insensible à la casse et aux accents. Volontairement limité : ce n'est qu'une
  première ligne de défense, à enrichir avec l'usage réel.
- **Signalement + retrait** : chaque publication du mur peut être signalée par n'importe quel
  utilisateur (table `signalements_contenu`), et retirée par son auteur ou par un coach/admin
  du centre (nouvelle colonne `masque` sur `mur_club_posts`, jamais de suppression définitive
  pour garder une trace en cas de besoin).

### Vérification des coachs (les deux niveaux demandés)
- **Upload de justificatif** : un coach dépose lui-même un document (vérification
  d'antécédents, attestation de formation) dans un bucket Supabase Storage **privé**
  (`conformite-docs`, à créer depuis le Dashboard Supabase, policies déjà dans le schéma).
  Seuls le coach concerné et les admins de son centre peuvent consulter ce document
  (URL signée à durée limitée, jamais d'URL publique).
- **Checklist admin plus stricte** : l'admin du centre voit, pour chaque coach, le statut détaillé
  (antécédents, formation, code de conduite signé) et valide chaque étape individuellement.
- **Protection contre l'auto-validation** : un trigger PostgreSQL (`proteger_validation_conformite`)
  empêche explicitement un coach de valider lui-même son propre dossier ; seul un admin de son
  centre peut faire passer un statut à "validé". Sans ce garde-fou, la policy qui autorise un
  coach à modifier sa propre ligne (pour uploader un document) aurait aussi permis de s'auto-approuver.
- Le statut global "autorisé au contact des mineurs" (`autorise_contact_mineurs`) reste calculé
  automatiquement par la base de données à partir des trois conditions réunies.

### Toujours vrai, à ne pas oublier
La vérification reste organisationnelle : la Plateforme donne l'outil pour suivre et valider,
mais ne vérifie pas elle-même l'authenticité d'un document déposé. C'est toujours à l'admin du
centre de juger si le justificatif est valable, avec tout ce que ça implique de responsabilité
humaine réelle (voir la Politique de Protection de l'Enfance).

## 🇬🇧 V1.4: club wall moderation + real coach verification

Both requested layers for moderation (automatic banned-word filter, tested, plus report + hide
by author/staff) and both for coach verification (private document upload via Supabase Storage
with signed URLs, plus a stricter per-item admin checklist). A database trigger explicitly
blocks a coach from self-approving their own compliance status — a gap that would otherwise
exist given the policy that lets them update their own row to upload documents.

---

## 🇫🇷 V1.5 : vérification visuelle réelle (pas juste "ça compile")

Jusqu'ici, chaque étape vérifiait que le code compilait et passait les tests, mais personne
n'avait réellement regardé le rendu visuel. Cette fois, l'app a été lancée dans un vrai
navigateur headless et capturée en écran, sur les 4 thèmes, en résolution mobile (390×844,
la taille la plus représentative du public visé).

### Ce que ça a permis de trouver
Les écrans de connexion et d'inscription (fond sombre `bg-ul-black`) utilisaient des champs de
saisie avec une bordure et un fond quasiment invisibles (`border-white/10`, `bg-white/5`).
Sur un téléphone d'entrée de gamme ou en plein soleil, ce genre de contraste très faible peut
rendre le formulaire difficile à utiliser. Corrigé (`border-white/25`, `bg-white/10`,
placeholder plus clair) sur les 5 écrans concernés (Connexion, Inscription joueur, Inscription
centre, Inscription recruteur, Confirmation de consentement parental).

### Autre correction trouvée en préparant cette vérification
Plusieurs champs (formulaires, cartes) utilisaient `bg-white` figé plutôt que la couleur
`ul-blanc` qui suit le thème actif. Résultat concret : en thème sombre (Nuit Pro), ces champs
seraient restés blancs et auraient juré avec le reste de l'écran. Corrigé dans Vie de club,
Bien-être, Sécurité, Remarques du centre, et le sélecteur de langue.

### Limite de cette vérification
Seuls les écrans publics (avant connexion) ont pu être capturés dans cette passe, l'environnement
de test ne permettant pas de simuler facilement une session utilisateur complète avec un vrai
projet Supabase connecté. Un contrôle visuel du Dashboard, du Guide et des autres pages
authentifiées reste à faire une fois un vrai projet Supabase configuré.

## 🇬🇧 V1.5: real visual verification (not just "it compiles")

The app was launched in a real headless browser and screenshotted across all 4 themes at
mobile resolution, catching two real issues that pure code review missed: near-invisible
input field contrast on the dark auth screens, and hardcoded white backgrounds on several
form fields that wouldn't have followed the dark theme. Both are fixed. Authenticated screens
(Dashboard, Guide, etc.) still need a visual pass once a real Supabase project is connected.

---

## 🇫🇷 V1.6 : vrais templates gratuits, réellement intégrés

Jusqu'à la version précédente, le système de thèmes (DaisyUI) était réel, mais aucune maquette
de composant n'avait été reprise depuis un vrai site de templates gratuits. C'est corrigé.

### Source utilisée
[HyperUI](https://hyperui.dev) — bibliothèque de composants Tailwind CSS gratuite et open-source
(licence MIT, aucune attribution obligatoire mais mentionnée ici par transparence), pas de mode
d'emploi à installer, juste du HTML/Tailwind à copier.

### Ce qui a été repris et adapté
- **`src/components/EmptyState.tsx`** : structure d'un "empty state" HyperUI (icône + titre +
  description), recolorée avec les tokens de thème d'Update Line au lieu des gris fixes
  d'origine. Utilisé sur Statistiques, École (notes et absences), Opportunités (bourses et
  écoles), Vie de club (journal, exercices, matchs), et Communauté.
- **`src/components/StatCard.tsx`** : structure d'une carte de statistique HyperUI (icône dans
  un cercle coloré + valeur + libellé), simplifiée et recolorée. Utilisée sur la page
  Statistiques pour afficher les totaux (buts, passes, minutes) en un coup d'œil.

Dans les deux cas, la structure/l'esprit du composant vient de HyperUI, mais les couleurs, les
icônes (Lucide au lieu des SVG génériques d'origine) et le contenu ont été entièrement adaptés
à Update Line et suivent le thème actif.

## 🇬🇧 V1.6: real free templates, actually integrated

Two component patterns adapted from HyperUI (hyperui.dev, free, MIT-licensed, no install
needed): an empty-state pattern (icon + title + description) now used across Stats, School,
Opportunities, Club, and Community pages, and a stat-card pattern (icon + value + label) used
for goal/assist/minutes totals on the Stats page. Both are restyled with Update Line's
theme-aware colors and Lucide icons rather than the original generic gray/SVG styling.

---

## 🇫🇷 V1.7 : onglet Programme Cameroun 2050

Ajout d'un onglet séparé présentant le programme ASBL de Mathias (25 ans, développement social,
éducatif, sportif et énergétique au Cameroun), distinct de la logique des joueurs/centres.

### Ce qui a été fait
- **`/programme-2050`** : nouvel onglet accessible depuis "Explorer" au tableau de bord, et
  aussi accessible sans connexion (comme une page "à propos" publique de la fondation).
- Contenu bilingue complet FR/EN : présentation, vision 25 ans, les 4 axes d'intervention
  (caritatif, eau potable, énergie solaire, basketball), une frise chronologique des 6 phases
  du calendrier 25 ans, la stratégie de financement (dons, tontine, investissement), la
  gouvernance, l'impact attendu, et un bouton de contact.
- Reste volontairement **informationnel** : pas de vrai système de don en ligne ni de suivi
  transactionnel de la tontine/des investissements, ce contenu-là dépasserait largement le
  cadre d'un onglet de présentation et demanderait son propre projet (paiement en ligne,
  comptabilité, conformité légale spécifique aux associations).
- Note de prudence affichée directement dans l'onglet : la section financement est présentée
  telle que décrite par l'organisation, ce n'est pas un conseil financier.

## 🇬🇧 V1.7: Cameroon 2050 Program tab

A separate tab (`/programme-2050`) presenting the 25-year ASBL nonprofit program (charity,
water access, solar energy, basketball academy), fully bilingual, accessible from the dashboard
and without login (as a public "about the foundation" page). Deliberately kept informational:
no real online donation or investment tracking system, which would need its own dedicated
project (payment processing, accounting, nonprofit-specific legal compliance).

---

## 🇫🇷 V1.8 : vraies photos intégrées à l'onglet Programme 2050

5 photos fournies (tournoi de basketball féminin) redimensionnées et compressées pour le web
(max 900px de côté, ~65-75 Ko chacune) dans `src/assets/programme2050/`, puis intégrées dans
`Programme2050Page.tsx` : une photo de couverture, une dans la section Vision, une dans la
carte de l'axe Basketball, deux dans une petite galerie en bas de page.

### Point de vigilance signalé et à garder en tête
Ce sont de vraies photos d'enfants/adolescentes identifiables. Cette page étant **publique et
accessible sans connexion**, la même logique que le consentement parental déjà construit pour
les données des joueurs s'applique aux photos : la publication de photos identifiables de
mineurs nécessite l'autorisation des parents/tuteurs (droit à l'image), généralement couverte
par le règlement d'un tournoi officiel mais à vérifier avant toute mise en ligne réelle.

## 🇬🇧 V1.8: real photos added to the Program 2050 tab

5 provided photos (women's youth basketball tournament) resized and compressed for the web,
integrated into `Programme2050Page.tsx` as a cover photo, a Vision section photo, a Basketball
axis photo, and a small gallery. Flagged for the record: these are real, identifiable minors,
and since this page is public with no login required, the same image-rights/parental-consent
logic already built for player data applies to publishing their photos.

---

## 🇫🇷 V1.9 : prêt pour le déploiement réel

### Ce qui a été ajouté
- **Dépôt git initialisé** avec un premier commit — voir `DEPLOYMENT.md` pour le connecter à GitHub
- **`.github/workflows/ci.yml`** : à chaque push, vérifie automatiquement les types, lance les
  26 tests, et vérifie que le build réussit
- **`vercel.json`** : redirection nécessaire pour que les routes React (comme
  `/consentement/:token`) fonctionnent après un rechargement de page en production
- **`DEPLOYMENT.md`** : guide complet étape par étape (GitHub → Supabase → Vercel → domaine),
  avec une checklist post-déploiement
- **Code-splitting par route** : chaque page ne charge que son propre code au lieu de tout
  charger d'un coup. Le plus gros fichier est passé de 635 Ko à 275 Ko. Important pour le
  public visé, qui a souvent une connexion mobile limitée.

### Ce qui reste à faire, et que je ne peux pas faire à ta place
Je n'ai pas tes identifiants GitHub/Supabase/Vercel/Resend, donc je ne peux pas créer les
comptes ni pousser le code moi-même. Suis `DEPLOYMENT.md` dans l'ordre : ça prend environ
30-45 minutes pour une première mise en ligne complète.

## 🇬🇧 V1.9: ready for real deployment

Git repo initialized with a first commit, a GitHub Actions CI workflow (type-check, tests,
build on every push), a `vercel.json` SPA rewrite rule, a complete step-by-step `DEPLOYMENT.md`
(GitHub → Supabase → Vercel → domain), and route-based code splitting (biggest bundle dropped
from 635 KB to 275 KB). The actual account creation and pushing steps need your own
credentials, so `DEPLOYMENT.md` walks through exactly what to do.

---

## 🇫🇷 V2.0 : correctif critique — boucle infinie dans les règles de sécurité

Découvert en déployant réellement le projet (merci pour les tests en conditions réelles !) :
lire son propre profil juste après inscription provoquait une erreur 500 (Internal Server
Error), bloquant l'application sur un écran de chargement infini.

### Cause
5 règles de sécurité (RLS) sur la table `profiles` vérifiaient les droits d'accès en
recherchant à nouveau DANS `profiles` (ex: "suis-je admin_centre ?" en relisant `profiles`).
Comme PostgreSQL évalue TOUTES les règles permissives d'une table à chaque lecture, ça
déclenchait une boucle : lire son profil → vérifier si admin (relit `profiles`) → vérifier si
admin (relit `profiles`) → ... jusqu'à erreur. Ce risque était déjà noté en commentaire dans
une version précédente du schéma, mais pas corrigé.

### Correctif
Trois fonctions `SECURITY DEFINER` (`get_my_role()`, `get_my_centre_id()`,
`is_recruteur_verifie()`) qui contournent volontairement les règles RLS pour cette vérification
précise, cassant la boucle. `supabase/schema.sql` est à jour ; `supabase/fix-rls-recursion.sql`
contient uniquement le correctif, à coller dans le SQL Editor d'un projet Supabase déjà créé
avec l'ancienne version (pas besoin de tout recréer).

### Autres bugs de déploiement corrigés en cours de route (non liés au code)
- `VITE_SUPABASE_URL` mal copiée (avec un `/rest/v1` en trop) → toujours copier l'URL de base
  exacte depuis Project Settings > API, sans rien ajouter derrière `.supabase.co`
- Confirmation d'email activée par défaut sur Supabase, incompatible avec le flux actuel de
  l'app qui suppose une connexion immédiate après inscription → à désactiver dans
  Authentication > Providers > Email > Confirm email (voir `DEPLOYMENT.md`, mis à jour)

## 🇬🇧 V2.0: critical fix — infinite loop in security rules

Found while doing a real deployment: reading one's own profile right after signup caused a
500 error, freezing the app on an infinite loading screen. Cause: 5 RLS policies on `profiles`
checked permissions by querying `profiles` again, and since Postgres evaluates every permissive
policy on a table per read, this created a loop. Fixed with three SECURITY DEFINER helper
functions that intentionally bypass RLS for this specific check, breaking the cycle.
`supabase/schema.sql` is updated; `supabase/fix-rls-recursion.sql` is a standalone patch for
already-created Supabase projects. Also documented two deployment gotchas found live: a
malformed `VITE_SUPABASE_URL` (extra `/rest/v1`) and Supabase's default email confirmation
being incompatible with the app's current immediate-session-after-signup flow.
