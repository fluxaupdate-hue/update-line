-- ============================================================
-- CORRECTIF : boucle infinie dans les règles de sécurité (RLS) sur `profiles`
-- ============================================================
-- Symptôme observé : erreur 500 (Internal Server Error) en essayant de lire
-- son propre profil juste après inscription.
--
-- Cause : plusieurs policies sur la table `profiles` vérifiaient les droits
-- en refaisant une recherche DANS `profiles` elle-même (ex: "est-ce que je
-- suis admin_centre ?" en interrogeant `profiles`). Comme Postgres évalue
-- TOUTES les policies permissives d'une table à chaque lecture, ça déclenche
-- une boucle : lire son profil → vérifier si on est admin (relit profiles)
-- → vérifier si on est admin (relit profiles) → ... jusqu'à erreur.
--
-- Correctif : des fonctions `SECURITY DEFINER` qui contournent les policies
-- RLS pour cette vérification précise uniquement, cassant la boucle.
-- À coller entièrement dans Supabase > SQL Editor > Run.

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

-- Remplace les 5 policies qui se relisaient elles-mêmes par des versions
-- utilisant les fonctions ci-dessus.

drop policy if exists "profil_select_admin_centre" on profiles;
create policy "profil_select_admin_centre" on profiles for select using (
  public.get_my_role() = 'admin_centre' and public.get_my_centre_id() = profiles.centre_id
);

drop policy if exists "profil_update_admin_centre" on profiles;
create policy "profil_update_admin_centre" on profiles for update using (
  public.get_my_role() = 'admin_centre' and public.get_my_centre_id() = profiles.centre_id
);

drop policy if exists "profil_select_recruteur_verifie" on profiles;
create policy "profil_select_recruteur_verifie" on profiles for select using (
  recrutement_active = true
  and (
    date_naissance <= (current_date - interval '18 years')
    or recrutement_valide_par_parent = true
  )
  and public.get_my_role() = 'recruteur' and public.is_recruteur_verifie()
);

drop policy if exists "profil_update_verif_recruteur" on profiles;
create policy "profil_update_verif_recruteur" on profiles for update using (
  role = 'recruteur' and public.get_my_role() = 'admin_centre'
);

drop policy if exists "profil_select_recruteurs_admin" on profiles;
create policy "profil_select_recruteurs_admin" on profiles for select using (
  role = 'recruteur' and public.get_my_role() = 'admin_centre'
);
