-- ============================================================
-- UPDATE LINE — Schéma Supabase complet (V1)
-- Couvre les 9 modules. À exécuter dans l'éditeur SQL Supabase.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- ENUMS ----------
create type user_role as enum ('joueur', 'coach', 'admin_centre', 'parent', 'recruteur');
create type report_status as enum ('nouveau', 'en_cours', 'resolu', 'archive');
create type report_category as enum ('violence', 'harcelement', 'abus', 'autre');
create type injury_status as enum ('declaree', 'en_soin', 'retour_progressif', 'gueri');

-- ---------- 9. CENTRES (multi-tenant) ----------
create table centres (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  pays text not null default 'Cameroun',
  ville text,
  logo_url text,
  code_invitation text unique not null, -- code que les joueurs saisissent à l'inscription
  jours_entrainement text[] default '{}', -- ex: {'Lundi','Mercredi','Samedi'} — saisi à la création du centre
  horaire_entrainement text, -- ex: '17h00 - 19h00'
  created_at timestamptz default now()
);

create table sports (
  id uuid primary key default uuid_generate_v4(),
  centre_id uuid references centres(id) on delete cascade,
  nom text not null, -- ex: Football, Basketball
  postes text[] default '{}', -- créé par admin
  stats_config jsonb default '{}'::jsonb -- champs de stats définis par admin
);

-- ---------- 1. PROFIL 360° ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  centre_id uuid references centres(id),
  sport_id uuid references sports(id),
  role user_role not null default 'joueur',
  nom_complet text not null,
  date_naissance date,
  photo_url text,
  poste text,
  taille_cm numeric,
  poids_kg numeric,
  ecole text,
  fb_url text,
  ig_url text,
  tiktok_url text,
  youtube_url text,
  verifie_par_centre boolean default false,
  parent_email text, -- pour mineurs < 18
  consent_parental_valide boolean default false, -- obligatoire avant tout accès si mineur
  consent_parental_valide_le timestamptz,
  consent_token text unique, -- lien à usage unique envoyé au parent pour confirmer sans compte admin
  consent_token_expire_le timestamptz,
  recrutement_token text unique, -- même mécanisme, dédié à la validation parentale du mode recruteur
  recruteur_organisation text, -- pour role='recruteur' : structure/agence déclarée
  recruteur_licence text, -- numéro de licence fédérale déclaré, à vérifier
  recruteur_verifie boolean default false, -- doit être vérifié par un centre avant tout accès
  langue_pref text default 'fr',
  xp_total integer default 0,
  mode_sombre boolean default false,
  theme_choisi text default 'afrique_pro', -- 'afrique_pro' | 'nuit_pro' | 'corporate' | 'forest'
  recrutement_active boolean default false, -- opt-in explicite du joueur, jamais automatique
  recrutement_valide_par_parent boolean default false, -- requis en plus si mineur
  agent_libre boolean default false, -- joueur sans centre affilié
  parcours_texte text, -- pour agent libre : clubs / parcours en texte libre, saisi par le joueur
  created_at timestamptz default now()
);

-- ---------- 2. STATISTIQUES & IA ----------
create table stats_entries (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  date_match date not null,
  adversaire text,
  stats jsonb not null default '{}'::jsonb, -- flexible selon sport
  source text default 'manuel', -- 'manuel' | 'ocr_scan'
  fiche_scan_url text,
  created_at timestamptz default now()
);

create table ia_analyses (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  points_forts text[],
  points_faibles text[],
  potentiel_pct numeric check (potentiel_pct between 0 and 100),
  risque_blessure_pct numeric check (risque_blessure_pct between 0 and 100),
  genere_le timestamptz default now()
);

-- ---------- 3. VIE DE CLUB ----------
create table presences (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  seance_date date not null,
  scan_qr_at timestamptz default now(),
  xp_gagne integer default 10
);

create table journal_coach (
  id uuid primary key default uuid_generate_v4(),
  centre_id uuid references centres(id),
  coach_id uuid references profiles(id),
  titre_seance text not null,
  contenu text,
  photos text[] default '{}',
  videos_liens text[] default '{}',
  date_seance date not null,
  code_seance text, -- code que les joueurs saisissent pour valider leur présence
  created_at timestamptz default now()
);

create table exercices_assignes (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  titre text not null,
  description text,
  statut text default 'a_faire', -- a_faire | fait
  date_limite date
);

create table matchs (
  id uuid primary key default uuid_generate_v4(),
  centre_id uuid references centres(id),
  sport_id uuid references sports(id),
  adversaire text,
  date_match timestamptz not null,
  lieu text,
  resultat text,
  fiche_url text
);

-- ---------- 4. MODULE SCOLAIRE ----------
create table notes_scolaires (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  matiere text not null,
  note numeric not null,
  bareme numeric default 20,
  trimestre text,
  date_saisie date default current_date
);

create table absences (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  date_absence date not null,
  motif text
);
-- Règle métier appliquée côté app : si moyenne < 10/20 -> alerte + blocage_match = true

-- ---------- 5. OPPORTUNITÉS ----------
create table bourses (
  id uuid primary key default uuid_generate_v4(),
  titre text not null,
  pays text,
  sport_concerne text,
  age_min int,
  age_max int,
  niveau_scolaire_requis text,
  date_limite date,
  lien text
);

create table ecoles_sportives (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  pays text,
  ville text,
  sports text[],
  site_web text
);

create table candidatures (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  bourse_id uuid references bourses(id),
  statut text default 'interesse', -- interesse | envoye | reponse_recue
  match_pct numeric
);

-- ---------- 6. SÉCURITÉ & SIGNALEMENT ----------
create table signalements (
  id uuid primary key default uuid_generate_v4(),
  centre_id uuid references centres(id),
  -- anonyme par défaut : profile_id peut être NULL
  profile_id uuid references profiles(id),
  categorie report_category not null,
  description text not null,
  statut report_status default 'nouveau',
  requiert_validation_parent boolean default false,
  parent_valide boolean default false,
  created_at timestamptz default now(),
  traite_par uuid references profiles(id),
  traite_le timestamptz
);

create table referents_protection (
  id uuid primary key default uuid_generate_v4(),
  centre_id uuid references centres(id),
  profile_id uuid references profiles(id),
  telephone text,
  email text
);

-- ---------- 7. IA MENTOR ----------
create table conseils_ia (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  categorie text, -- corps | terrain | ecole | tete
  contenu text not null,
  date_conseil date default current_date
);

-- ---------- 8. COMMUNAUTÉ & RECRUTEMENT ----------
create table mur_club_posts (
  id uuid primary key default uuid_generate_v4(),
  centre_id uuid references centres(id),
  auteur_id uuid references profiles(id),
  contenu text not null,
  photo_url text,
  masque boolean default false, -- retiré par un coach/admin suite à modération
  masque_le timestamptz,
  created_at timestamptz default now()
);

-- Signalement d'une publication du mur (distinct des signalements de sécurité sur une
-- personne) : permet à tout utilisateur de signaler un contenu inapproprié.
create table signalements_contenu (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references mur_club_posts(id) on delete cascade,
  signale_par uuid references profiles(id),
  motif text,
  statut text default 'nouveau', -- nouveau | traite
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  expediteur_id uuid references profiles(id),
  destinataire_id uuid references profiles(id),
  contenu text not null,
  lu boolean default false,
  created_at timestamptz default now()
);

-- ---------- BONUS : blessures, nutrition, XP badges, tournois ----------
create table blessures (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  description text not null,
  statut injury_status default 'declaree',
  date_declaration date default current_date,
  kine_referent text,
  date_retour_prevue date
);

create table badges (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  code text not null, -- ex: '100_presence', 'meilleur_eleve'
  obtenu_le timestamptz default now()
);

-- ---------- 10. CONFORMITÉ & VÉRIFICATION DES ADULTES (staff/coachs) ----------
-- Inspiré des standards SafeSport/USOPC : aucun adulte ne doit être en contact
-- avec des mineurs sans vérification + formation à jour et renouvelée.
create type conformite_statut as enum ('en_attente', 'valide', 'expire', 'refuse', 'suspendu');

create table staff_conformite (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade, -- coach / staff
  centre_id uuid references centres(id),
  verification_antecedents_statut conformite_statut default 'en_attente',
  verification_antecedents_date date,
  verification_antecedents_expire_le date,
  formation_protection_enfance_statut conformite_statut default 'en_attente',
  formation_protection_enfance_date date,
  formation_protection_enfance_expire_le date,
  code_conduite_signe boolean default false,
  code_conduite_signe_le timestamptz,
  document_antecedents_url text, -- justificatif uploadé (extrait de casier judiciaire, attestation, etc.)
  document_formation_url text, -- justificatif de formation suivie
  autorise_contact_mineurs boolean generated always as (
    verification_antecedents_statut = 'valide' and formation_protection_enfance_statut = 'valide' and code_conduite_signe
  ) stored,
  created_at timestamptz default now()
);

-- Registre disciplinaire consultable (parents peuvent vérifier un coach/centre)
create table sanctions_disciplinaires (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id),
  centre_id uuid references centres(id),
  motif_public text not null, -- formulation neutre, pas de détails du signalement source
  statut text default 'active', -- active | levee
  date_debut date default current_date,
  date_fin date
);

-- ---------- 11. FICHE MÉDICALE D'URGENCE ----------
-- Accès rapide par le staff en cas d'accident sur le terrain.
create table fiches_medicales_urgence (
  profile_id uuid primary key references profiles(id) on delete cascade,
  groupe_sanguin text,
  allergies text[],
  conditions_medicales text[],
  contact_urgence_nom text,
  contact_urgence_telephone text,
  assurance_info text,
  mise_a_jour_le timestamptz default now()
);

-- ---------- 12. CHECK-IN BIEN-ÊTRE QUOTIDIEN ----------
-- Alimente le calcul de risque de blessure/surmenage de l'IA (module 2),
-- inspiré des questionnaires de wellness utilisés par les systèmes pro (sommeil,
-- humeur, stress, nutrition/hydratation) rempli en moins de 30 secondes.
create table wellness_checkins (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  date_checkin date default current_date,
  sommeil_qualite smallint check (sommeil_qualite between 1 and 5),
  humeur smallint check (humeur between 1 and 5),
  niveau_stress smallint check (niveau_stress between 1 and 5),
  hydratation_ok boolean,
  nutrition_ok boolean,
  douleur_signalee boolean default false,
  note_libre text,
  unique (profile_id, date_checkin)
);

-- Remarques du centre sur un profil (ex: "joueur sérieux", "a raté 3 séances") —
-- ajoutées par un coach/admin, avec visibilité choisie PAR LE CENTRE (pas par le joueur) :
-- privée (staff du centre uniquement) ou publique (visible sur le profil, ex. par les recruteurs).
create table profil_remarques (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  auteur_id uuid references profiles(id), -- le coach/admin qui a écrit la remarque
  contenu text not null,
  visible_publiquement boolean default false,
  created_at timestamptz default now()
);

-- Lien parent-enfant : créé uniquement via la confirmation par lien sécurisé (consent_token),
-- jamais déclaré librement par un utilisateur — c'est ce qui rend la vue Parent fiable.
create table liens_parent_enfant (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid references profiles(id) on delete cascade,
  enfant_id uuid references profiles(id) on delete cascade,
  valide boolean default true,
  created_at timestamptz default now(),
  unique (parent_id, enfant_id)
);

-- ============================================================
-- STOCKAGE (Supabase Storage) : photos de profil
-- ============================================================
-- Le bucket lui-même doit être créé une fois depuis le Dashboard Supabase
-- (Storage > New bucket > nom: "avatars" > Public bucket: OUI), car la création
-- de bucket n'est pas possible depuis une simple requête SQL. Les policies
-- ci-dessous s'appliquent ensuite automatiquement à ce bucket.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Chacun peut uploader/modifier UNIQUEMENT son propre fichier, nommé par son user id
-- (convention utilisée par le code : "{user_id}/avatar.jpg")
create policy "avatars_insert_own" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_update_own" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_delete_own" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
-- Bucket public : tout le monde peut voir les avatars (nécessaire pour les afficher dans l'app)
create policy "avatars_select_public" on storage.objects for select
  using (bucket_id = 'avatars');

-- Bucket privé pour les justificatifs de conformité des adultes encadrants (documents
-- sensibles : PAS public, contrairement aux avatars).
insert into storage.buckets (id, name, public)
values ('conformite-docs', 'conformite-docs', false)
on conflict (id) do nothing;

-- Convention de nommage : "{user_id}/{fichier}". Le coach peut déposer son propre justificatif ;
-- lui-même ET les admins de son centre peuvent le consulter (jamais les autres joueurs/coachs).
create policy "conformite_docs_insert_own" on storage.objects for insert
  with check (bucket_id = 'conformite-docs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "conformite_docs_select" on storage.objects for select
  using (
    bucket_id = 'conformite-docs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from profiles staff, profiles admin
        where staff.id::text = (storage.foldername(name))[1]
          and admin.id = auth.uid()
          and admin.role = 'admin_centre'
          and admin.centre_id = staff.centre_id
      )
    )
  );

-- ============================================================
-- ROW LEVEL SECURITY (essentiel : données d'enfants)
-- ============================================================
alter table profiles enable row level security;
alter table stats_entries enable row level security;
alter table signalements enable row level security;
alter table notes_scolaires enable row level security;
alter table messages enable row level security;
alter table fiches_medicales_urgence enable row level security;
alter table wellness_checkins enable row level security;
alter table staff_conformite enable row level security;

-- Fiche médicale : le joueur/parent + tout coach/admin du même centre en cas d'urgence
create policy "fiche_urgence_select" on fiches_medicales_urgence for select using (
  auth.uid() = profile_id or exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('admin_centre', 'coach')
  )
);
create policy "fiche_urgence_upsert" on fiches_medicales_urgence for insert with check (auth.uid() = profile_id);
create policy "fiche_urgence_update" on fiches_medicales_urgence for update using (auth.uid() = profile_id);

-- Wellness : le joueur écrit son propre check-in, le coach/admin peut lire (agrégé) pour repérer les risques
create policy "wellness_insert_own" on wellness_checkins for insert with check (auth.uid() = profile_id);
create policy "wellness_select" on wellness_checkins for select using (
  auth.uid() = profile_id or exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('admin_centre', 'coach')
  ) or exists (
    select 1 from liens_parent_enfant l where l.parent_id = auth.uid() and l.enfant_id = wellness_checkins.profile_id and l.valide = true
  )
);

-- Conformité staff : le coach/staff concerné voit et alimente son propre dossier
-- (document, signature du code de conduite) ; seul l'admin de SON centre valide les statuts.
create policy "conformite_select_self" on staff_conformite for select using (
  auth.uid() = profile_id
  or exists (
    select 1 from profiles admin
    where admin.id = auth.uid() and admin.role = 'admin_centre' and admin.centre_id = staff_conformite.centre_id
  )
);
create policy "conformite_insert_self" on staff_conformite for insert with check (auth.uid() = profile_id);
create policy "conformite_update_self" on staff_conformite for update using (
  auth.uid() = profile_id
  or exists (
    select 1 from profiles admin
    where admin.id = auth.uid() and admin.role = 'admin_centre' and admin.centre_id = staff_conformite.centre_id
  )
);

-- Protection essentielle : la policy ci-dessus autorise un coach à modifier SA PROPRE ligne
-- (pour uploader son justificatif, signer le code de conduite), mais ne doit JAMAIS lui
-- permettre de s'auto-valider. Ce trigger bloque toute tentative de changer les statuts de
-- vérification/formation si l'auteur de la modification n'est pas un admin du centre.
create or replace function public.proteger_validation_conformite()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  est_admin boolean;
begin
  select exists (
    select 1 from profiles admin
    where admin.id = auth.uid() and admin.role = 'admin_centre' and admin.centre_id = new.centre_id
  ) into est_admin;

  if not est_admin then
    if new.verification_antecedents_statut is distinct from old.verification_antecedents_statut
       or new.formation_protection_enfance_statut is distinct from old.formation_protection_enfance_statut
       or new.verification_antecedents_date is distinct from old.verification_antecedents_date
       or new.formation_protection_enfance_date is distinct from old.formation_protection_enfance_date
       or new.verification_antecedents_expire_le is distinct from old.verification_antecedents_expire_le
       or new.formation_protection_enfance_expire_le is distinct from old.formation_protection_enfance_expire_le
    then
      raise exception 'Seul un administrateur du centre peut valider ces statuts.';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_proteger_validation_conformite
  before update on staff_conformite
  for each row execute function public.proteger_validation_conformite();

-- Vie de club : contenu du centre, lisible par tous les membres authentifiés du centre
alter table journal_coach enable row level security;
alter table presences enable row level security;
alter table exercices_assignes enable row level security;
alter table matchs enable row level security;
create policy "journal_select_centre" on journal_coach for select using (auth.role() = 'authenticated');
create policy "journal_insert_coach" on journal_coach for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('coach', 'admin_centre'))
);
create policy "presences_insert_self" on presences for insert with check (auth.uid() = profile_id);
create policy "presences_select_self" on presences for select using (
  auth.uid() = profile_id or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('coach', 'admin_centre'))
);
create policy "exercices_select_self" on exercices_assignes for select using (
  auth.uid() = profile_id or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('coach', 'admin_centre'))
);
create policy "exercices_update_self" on exercices_assignes for update using (auth.uid() = profile_id);
create policy "matchs_select_all" on matchs for select using (auth.role() = 'authenticated');

-- Scolaire
alter table absences enable row level security;
create policy "absences_select_owner" on absences for select using (
  auth.uid() = profile_id or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin_centre')
);
create policy "notes_insert_coach_admin" on notes_scolaires for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('coach', 'admin_centre'))
);

-- Opportunités : contenu de référence, lisible par tous ; candidatures propres au joueur
alter table bourses enable row level security;
alter table ecoles_sportives enable row level security;
alter table candidatures enable row level security;
create policy "bourses_select_all" on bourses for select using (true);
create policy "ecoles_select_all" on ecoles_sportives for select using (true);
create policy "candidatures_select_self" on candidatures for select using (auth.uid() = profile_id);
create policy "candidatures_insert_self" on candidatures for insert with check (auth.uid() = profile_id);

-- Communauté : mur du club visible par les membres authentifiés du centre
alter table mur_club_posts enable row level security;
create policy "mur_select_all" on mur_club_posts for select using (auth.role() = 'authenticated');
create policy "mur_insert_self" on mur_club_posts for insert with check (auth.uid() = auteur_id);

-- Modération : l'auteur peut retirer son propre post ; un coach/admin du même centre aussi
create policy "mur_update_moderation" on mur_club_posts for update using (
  auth.uid() = auteur_id
  or exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role in ('coach', 'admin_centre') and p.centre_id = mur_club_posts.centre_id
  )
);

alter table signalements_contenu enable row level security;
create policy "signalement_contenu_insert" on signalements_contenu for insert with check (auth.role() = 'authenticated');
create policy "signalement_contenu_select_staff" on signalements_contenu for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('coach', 'admin_centre'))
);

-- Remarques du centre : le joueur voit tout ce qui le concerne (transparence) ; le grand public
-- (autres utilisateurs authentifiés, ex. recruteurs) ne voit que ce qui est marqué public
alter table profil_remarques enable row level security;
create policy "remarques_select_owner_or_public" on profil_remarques for select using (
  auth.uid() = profile_id
  or visible_publiquement = true
  or exists (
    select 1 from profiles admin
    where admin.id = auth.uid() and admin.role in ('coach', 'admin_centre')
      and admin.centre_id = (select centre_id from profiles target where target.id = profil_remarques.profile_id)
  )
);
create policy "remarques_insert_staff" on profil_remarques for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('coach', 'admin_centre'))
);

create policy "profil_owner_select" on profiles for select using (auth.uid() = id);
create policy "profil_owner_update" on profiles for update using (auth.uid() = id);
create policy "profil_insert_self" on profiles for insert with check (auth.uid() = id);

-- Fonctions SECURITY DEFINER : contournent volontairement les policies RLS pour cette
-- vérification précise, ce qui casse la boucle infinie qu'on aurait sinon (une policy sur
-- `profiles` qui relit `profiles` déclenche la réévaluation de TOUTES les policies de la
-- table, y compris elle-même, à chaque lecture -> erreur 500 en conditions réelles).
create or replace function public.get_my_role()
returns text
language sql security definer stable set search_path = public as $$
  select role::text from profiles where id = auth.uid();
$$;

create or replace function public.get_my_centre_id()
returns uuid
language sql security definer stable set search_path = public as $$
  select centre_id from profiles where id = auth.uid();
$$;

create or replace function public.is_recruteur_verifie()
returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce(
    (select recruteur_verifie from profiles where id = auth.uid() and role = 'recruteur'),
    false
  );
$$;

-- Un admin_centre voit et met à jour les profils de SON centre (valider consentement, vérifier joueur, etc.)
create policy "profil_select_admin_centre" on profiles for select using (
  public.get_my_role() = 'admin_centre' and public.get_my_centre_id() = profiles.centre_id
);
create policy "profil_update_admin_centre" on profiles for update using (
  public.get_my_role() = 'admin_centre' and public.get_my_centre_id() = profiles.centre_id
);

-- Recruteur vérifié : ne voit QUE les profils en recrutement actif, et pour un mineur
-- UNIQUEMENT si le parent a validé séparément (recrutement_valide_par_parent) — le opt-in
-- du joueur seul ne suffit jamais pour un mineur.
create policy "profil_select_recruteur_verifie" on profiles for select using (
  recrutement_active = true
  and (
    date_naissance <= (current_date - interval '18 years')
    or recrutement_valide_par_parent = true
  )
  and public.get_my_role() = 'recruteur' and public.is_recruteur_verifie()
);

-- Un admin_centre peut vérifier n'importe quel compte recruteur (réseau de confiance simple,
-- suffisant en V1 ; en prod, envisager une vérification centralisée par Update Line lui-même)
create policy "profil_select_recruteurs_admin" on profiles for select using (
  role = 'recruteur' and public.get_my_role() = 'admin_centre'
);
create policy "profil_update_verif_recruteur" on profiles for update using (
  role = 'recruteur' and public.get_my_role() = 'admin_centre'
);

-- Confirmation de consentement par lien : le parent n'a pas de compte au moment de cliquer,
-- donc PAS d'accès direct à la table `profiles` (ça exposerait tous les mineurs en attente à
-- n'importe qui). On passe par des fonctions SECURITY DEFINER qui ne renvoient que le strict
-- nécessaire et seulement si le token exact (non devinable) est fourni.

create or replace function public.consent_lookup(p_token text)
returns table (nom_complet text, centre_nom text, type text)
language plpgsql security definer set search_path = public as $$
begin
  return query
  select p.nom_complet, c.nom, 'consentement'::text
  from profiles p left join centres c on c.id = p.centre_id
  where p.consent_token = p_token and p.consent_token_expire_le > now();

  if not found then
    return query
    select p.nom_complet, c.nom, 'recrutement'::text
    from profiles p left join centres c on c.id = p.centre_id
    where p.recrutement_token = p_token;
  end if;
end;
$$;

create or replace function public.consent_confirm(p_token text, p_parent_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_enfant_id uuid;
begin
  select id into v_enfant_id from profiles
  where consent_token = p_token and consent_token_expire_le > now();

  if v_enfant_id is null then
    return false;
  end if;

  update profiles
  set consent_parental_valide = true,
      consent_parental_valide_le = now(),
      consent_token = null,
      consent_token_expire_le = null
  where id = v_enfant_id;

  insert into liens_parent_enfant (parent_id, enfant_id, valide)
  values (p_parent_id, v_enfant_id, true)
  on conflict (parent_id, enfant_id) do update set valide = true;

  return true;
end;
$$;

create or replace function public.recrutement_consent_confirm(p_token text, p_parent_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_enfant_id uuid;
begin
  select id into v_enfant_id from profiles where recrutement_token = p_token;
  if v_enfant_id is null then
    return false;
  end if;

  update profiles
  set recrutement_valide_par_parent = true,
      recrutement_token = null
  where id = v_enfant_id;

  insert into liens_parent_enfant (parent_id, enfant_id, valide)
  values (p_parent_id, v_enfant_id, true)
  on conflict (parent_id, enfant_id) do update set valide = true;

  return true;
end;
$$;

grant execute on function public.consent_lookup(text) to anon, authenticated;
grant execute on function public.consent_confirm(text, uuid) to anon, authenticated;
grant execute on function public.recrutement_consent_confirm(text, uuid) to anon, authenticated;

-- Parent : ne voit que les enfants explicitement liés et validés
alter table liens_parent_enfant enable row level security;
create policy "liens_select_parent" on liens_parent_enfant for select using (auth.uid() = parent_id);
create policy "liens_insert_via_consent" on liens_parent_enfant for insert with check (auth.uid() = parent_id);

create policy "profil_select_parent_lie" on profiles for select using (
  exists (
    select 1 from liens_parent_enfant l
    where l.parent_id = auth.uid() and l.enfant_id = profiles.id and l.valide = true
  )
);

alter table centres enable row level security;
create policy "centres_select_all" on centres for select using (true); -- non sensible, requis pour la saisie du code d'invitation à l'inscription
create policy "centres_insert_authenticated" on centres for insert with check (auth.role() = 'authenticated');

create policy "signalement_insert" on signalements for insert with check (true);
create policy "signalement_select_admin" on signalements for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin_centre'))
);

create policy "messages_select" on messages for select using (
  auth.uid() = expediteur_id or auth.uid() = destinataire_id
);
create policy "messages_insert" on messages for insert with check (auth.uid() = expediteur_id);

create policy "stats_select_owner" on stats_entries for select using (
  auth.uid() = profile_id or exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin_centre'
  )
);
create policy "notes_select_owner" on notes_scolaires for select using (
  auth.uid() = profile_id or exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin_centre'
  ) or exists (
    select 1 from liens_parent_enfant l where l.parent_id = auth.uid() and l.enfant_id = notes_scolaires.profile_id and l.valide = true
  )
);
