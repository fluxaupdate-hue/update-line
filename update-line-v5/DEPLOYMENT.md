# Guide de déploiement — Update Line

Ce guide t'emmène du code sur ton ordinateur jusqu'à une vraie URL en ligne. Suis les étapes
dans l'ordre : GitHub d'abord, Supabase ensuite, Vercel en dernier.

---

## 1. GitHub — héberger le code

Le dossier livré contient déjà un dépôt git initialisé avec un premier commit. Il te reste à le
connecter à un dépôt GitHub.

### 1.1 Créer le dépôt sur GitHub
1. Va sur [github.com/new](https://github.com/new)
2. Nom du dépôt : `update-line` (ou ce que tu préfères)
3. Laisse-le **vide** (ne coche ni README, ni .gitignore, ni licence — ils existent déjà ici)
4. Clique sur "Create repository"

### 1.2 Pousser le code
Dans le dossier du projet, sur ton ordinateur :

```bash
git remote add origin https://github.com/TON-NOM-UTILISATEUR/update-line.git
git push -u origin main
```

GitHub te demandera de t'authentifier (identifiants ou token d'accès personnel selon ta config).

### 1.3 Vérifier la CI (intégration continue)
Un workflow GitHub Actions (`.github/workflows/ci.yml`) est déjà configuré : à chaque `push`, il
vérifie automatiquement les types, lance les tests, et vérifie que le build réussit. Après ton
premier push, va dans l'onglet **Actions** de ton dépôt GitHub pour voir le résultat (ça prend
1-2 minutes).

---

## 2. Supabase — la base de données et l'authentification

### 2.1 Créer le projet
1. Va sur [supabase.com](https://supabase.com) et crée un compte si besoin
2. "New project" → choisis un nom, un mot de passe de base de données (à conserver précieusement),
   et une région (idéalement en Europe, la plus proche du Cameroun parmi les options Supabase)
3. Attends 1-2 minutes que le projet soit prêt

### 2.2 Exécuter le schéma
1. Dans le tableau de bord Supabase, va dans **SQL Editor**
2. Ouvre le fichier `supabase/schema.sql` de ce projet, copie tout son contenu
3. Colle-le dans l'éditeur SQL Supabase et clique sur "Run"
4. Vérifie dans **Table Editor** que les tables sont bien créées (profiles, centres,
   signalements, wellness_checkins, etc.)

### 2.3 Créer les buckets de stockage
Le schéma crée automatiquement les buckets "avatars" (public) et "conformite-docs" (privé) via
les lignes `insert into storage.buckets`. Vérifie dans **Storage** que les deux apparaissent.
Si ce n'est pas le cas (ça peut arriver selon les permissions), crée-les manuellement :
- **avatars** : Public bucket = OUI
- **conformite-docs** : Public bucket = NON

### 2.4 Récupérer les clés API
Dans **Project Settings > API**, note :
- `Project URL` → deviendra `VITE_SUPABASE_URL`
- `anon public key` → deviendra `VITE_SUPABASE_ANON_KEY`

**Attention** : copie bien la `Project URL` de base (`https://xxxxx.supabase.co`, rien après).
Cette page affiche parfois d'autres adresses à côté (comme une URL se terminant par
`/rest/v1`) qui servent à un usage différent ; les coller par erreur dans
`VITE_SUPABASE_URL` provoque des erreurs 404 sur toutes les actions du site.

### 2.5 Configurer les URL de redirection (important)
Dans **Authentication > URL Configuration**, ajoute l'URL Vercel que tu obtiendras à l'étape 3
(par exemple `https://update-line.vercel.app`) dans "Site URL" et "Redirect URLs". Sans ça, la
confirmation d'email et certains flux d'authentification ne fonctionneront pas correctement une
fois en ligne.

### 2.5bis Désactiver la confirmation d'email (obligatoire dans cette version)
Dans **Authentication > Providers > Email**, désactive "Confirm email". L'application suppose
actuellement qu'un compte est immédiatement utilisable juste après l'inscription (création du
centre, du profil joueur, etc. juste après). Si la confirmation d'email reste activée, ces
étapes échoueront avec une erreur 401. Une vraie gestion de la confirmation d'email est une
amélioration possible pour une version future, mais demande de revoir plusieurs écrans.

### 2.6 Déployer la fonction d'envoi d'email (optionnel mais recommandé)
1. Installe la CLI Supabase : `npm install -g supabase`
2. `supabase login`
3. `supabase link --project-ref TON-PROJECT-REF` (visible dans l'URL du tableau de bord)
4. Crée un compte gratuit sur [resend.com](https://resend.com), récupère une clé API
5. `supabase secrets set RESEND_API_KEY=re_xxxxxxxx`
6. `supabase functions deploy send-consent-email`

Si tu sautes cette étape, l'app fonctionne quand même : le bouton "Envoyer par email" affichera
simplement un message et le lien à copier / le mailto resteront disponibles en secours.

### 2.7 Créer le premier centre (pour tester)
Le moyen le plus simple pour démarrer : utilise la page `/signup-centre` une fois l'app en
ligne, elle crée le centre et son compte admin en un seul flux, code d'invitation généré
automatiquement.

---

## 3. Vercel — mettre l'app en ligne

### 3.1 Importer le projet
1. Va sur [vercel.com](https://vercel.com) et connecte-toi (idéalement avec ton compte GitHub,
   ça simplifie tout)
2. "Add New" > "Project"
3. Sélectionne le dépôt `update-line` que tu viens de pousser sur GitHub
4. Vercel détecte automatiquement Vite : ne change rien aux réglages de build

### 3.2 Variables d'environnement
Avant de cliquer sur "Deploy", ajoute dans "Environment Variables" :
- `VITE_SUPABASE_URL` = l'URL récupérée à l'étape 2.4
- `VITE_SUPABASE_ANON_KEY` = la clé récupérée à l'étape 2.4

### 3.3 Déployer
Clique sur "Deploy". Après 1-2 minutes, Vercel donne une URL du type
`https://update-line-xxxx.vercel.app`. Reviens à l'étape 2.5 pour l'ajouter dans la
configuration Supabase.

### 3.4 Nom de domaine personnalisé (optionnel)
Dans le projet Vercel > **Settings > Domains**, tu peux ajouter un domaine que tu possèdes déjà
(ex. `updateline.app` acheté chez Namecheap, Google Domains, ou un registrar camerounais) et
suivre les instructions DNS affichées par Vercel.

---

## 4. Checklist après déploiement

- [ ] Créer un centre de test via `/signup-centre`
- [ ] Créer un compte joueur de test via `/signup`, avec une date de naissance de mineur, pour
      vérifier que le blocage de consentement parental fonctionne bien en conditions réelles
- [ ] Vérifier que les 4 thèmes s'affichent correctement (page `/guide`)
- [ ] Uploader une vraie photo de profil pour vérifier le bucket "avatars"
- [ ] Tester le signalement de sécurité (anonyme et non-anonyme)
- [ ] Relire les 3 documents légaux (CGU, confidentialité, protection de l'enfance) avec un
      avocat avant toute ouverture à de vrais utilisateurs mineurs
- [ ] Remplacer les adresses `[à compléter]` dans les documents légaux par les vraies
      coordonnées de l'entité exploitante

---

## En cas de problème

- **Le build Vercel échoue** : vérifie que les deux variables d'environnement sont bien
  renseignées (erreur la plus fréquente).
- **Impossible de se connecter une fois en ligne** : vérifie l'étape 2.5 (Site URL / Redirect
  URLs dans Supabase).
- **Les policies RLS bloquent une requête qui devrait marcher** : va dans Supabase > 
  **Logs > Postgres Logs** pour voir le message d'erreur exact.
