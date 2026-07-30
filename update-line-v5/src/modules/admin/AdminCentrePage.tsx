import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, CheckCircle2, Clock, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { isMinor } from '../../types';

interface PlayerRow {
  id: string;
  nom_complet: string;
  date_naissance: string | null;
  parent_email: string | null;
  consent_parental_valide: boolean;
  verifie_par_centre: boolean;
  role: string;
}

interface RecruiterRow {
  id: string;
  nom_complet: string;
  recruteur_organisation: string | null;
  recruteur_licence: string | null;
  recruteur_verifie: boolean;
}

interface ConformiteRow {
  id: string;
  profile_id: string;
  nom_complet: string;
  verification_antecedents_statut: string;
  formation_protection_enfance_statut: string;
  code_conduite_signe: boolean;
  document_antecedents_url: string | null;
  document_formation_url: string | null;
  autorise_contact_mineurs: boolean;
}

export default function AdminCentrePage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [recruiters, setRecruiters] = useState<RecruiterRow[]>([]);
  const [conformites, setConformites] = useState<ConformiteRow[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile?.centre_id) return;

      const [{ data: centre }, { data: profiles }, { data: recruteurs }] = await Promise.all([
        supabase.from('centres').select('code_invitation').eq('id', profile.centre_id).single(),
        supabase
          .from('profiles')
          .select('id, nom_complet, date_naissance, parent_email, consent_parental_valide, verifie_par_centre, role')
          .eq('centre_id', profile.centre_id),
        supabase
          .from('profiles')
          .select('id, nom_complet, recruteur_organisation, recruteur_licence, recruteur_verifie')
          .eq('role', 'recruteur')
          .eq('recruteur_verifie', false),
      ]);

      if (centre) setInviteCode(centre.code_invitation);
      if (profiles) setPlayers(profiles as PlayerRow[]);
      if (recruteurs) setRecruiters(recruteurs as RecruiterRow[]);

      const coachIds = (profiles ?? []).filter((p) => p.role === 'coach').map((p) => p.id);
      if (coachIds.length > 0) {
        const { data: conf } = await supabase
          .from('staff_conformite')
          .select('id, profile_id, verification_antecedents_statut, formation_protection_enfance_statut, code_conduite_signe, document_antecedents_url, document_formation_url, autorise_contact_mineurs')
          .in('profile_id', coachIds);
        const merged = (conf ?? []).map((c) => ({
          ...c,
          nom_complet: profiles?.find((p) => p.id === c.profile_id)?.nom_complet ?? '—',
        }));
        setConformites(merged as ConformiteRow[]);
      }

      setLoading(false);
    }
    load();
  }, [profile?.centre_id]);

  async function verifierRecruteur(id: string) {
    const { error } = await supabase.from('profiles').update({ recruteur_verifie: true }).eq('id', id);
    if (!error) setRecruiters((prev) => prev.filter((r) => r.id !== id));
  }

  async function validerAntecedents(id: string) {
    const { error } = await supabase
      .from('staff_conformite')
      .update({ verification_antecedents_statut: 'valide', verification_antecedents_date: new Date().toISOString().slice(0, 10) })
      .eq('id', id);
    if (!error) {
      setConformites((prev) =>
        prev.map((c) => (c.id === id ? { ...c, verification_antecedents_statut: 'valide' } : c))
      );
    }
  }

  async function validerFormation(id: string) {
    const { error } = await supabase
      .from('staff_conformite')
      .update({ formation_protection_enfance_statut: 'valide', formation_protection_enfance_date: new Date().toISOString().slice(0, 10) })
      .eq('id', id);
    if (!error) {
      setConformites((prev) =>
        prev.map((c) => (c.id === id ? { ...c, formation_protection_enfance_statut: 'valide' } : c))
      );
    }
  }

  async function voirDocument(path: string) {
    const { data } = await supabase.storage.from('conformite-docs').createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  async function validateConsent(playerId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ consent_parental_valide: true, consent_parental_valide_le: new Date().toISOString() })
      .eq('id', playerId);
    if (!error) {
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, consent_parental_valide: true } : p))
      );
    }
  }

  async function toggleVerified(playerId: string, current: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ verifie_par_centre: !current })
      .eq('id', playerId);
    if (!error) {
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, verifie_par_centre: !current } : p))
      );
    }
  }

  if (profile?.role !== 'admin_centre') {
    return <p className="p-6 text-sm text-neutral-500">Accès réservé aux administrateurs du centre.</p>;
  }

  if (loading) return <p className="p-6">{t('common.loading')}</p>;

  const pendingConsent = players.filter(
    (p) => p.date_naissance && isMinor(p.date_naissance) && !p.consent_parental_valide
  );

  return (
    <div className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
        <Settings className="h-6 w-6 text-ul-green" strokeWidth={1.75} /> {t('admin.title')}
      </h1>

      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">{t('admin.invite_code')}</h2>
        <p className="mt-2 rounded-lg bg-ul-gray px-3 py-2 font-mono text-lg font-bold tracking-widest text-ul-green">
          {inviteCode ?? '—'}
        </p>
        <p className="mt-1 text-xs text-neutral-500">{t('admin.invite_code_hint')}</p>
      </div>

      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">{t('admin.pending_consent')}</h2>
        {pendingConsent.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">{t('admin.no_pending')}</p>
        ) : (
          <ul className="mt-2 divide-y divide-black/5">
            {pendingConsent.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{p.nom_complet}</p>
                  <p className="text-xs text-neutral-500">{p.parent_email}</p>
                </div>
                <button onClick={() => validateConsent(p.id)} className="btn-primary px-3 py-1.5 text-xs">
                  {t('admin.validate')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">Recruteurs à vérifier</h2>
        {recruiters.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Aucun recruteur en attente.</p>
        ) : (
          <ul className="mt-2 divide-y divide-black/5">
            {recruiters.map((r) => (
              <li key={r.id} className="py-2">
                <p className="text-sm font-medium">{r.nom_complet}</p>
                <p className="text-xs text-neutral-500">
                  {r.recruteur_organisation ?? '—'} {r.recruteur_licence ? `· Licence: ${r.recruteur_licence}` : ''}
                </p>
                <button onClick={() => verifierRecruteur(r.id)} className="btn-primary mt-1 px-3 py-1 text-xs">
                  Vérifier et autoriser
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">{t('conformite.admin_checklist_title')}</h2>
        {conformites.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">{t('conformite.no_staff')}</p>
        ) : (
          <ul className="mt-2 divide-y divide-black/5">
            {conformites.map((c) => (
              <li key={c.id} className="py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{c.nom_complet}</p>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.autorise_contact_mineurs ? 'bg-ul-green/10 text-ul-green' : 'bg-neutral-200 text-neutral-500'
                    }`}
                  >
                    {c.autorise_contact_mineurs ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {c.autorise_contact_mineurs ? t('conformite.autorise_yes') : t('conformite.autorise_no')}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-ul-gray p-2">
                    <p className="font-medium">{t('conformite.antecedents_title')}</p>
                    <p className="text-neutral-500">{t(`conformite.status_${c.verification_antecedents_statut}`)}</p>
                    {c.document_antecedents_url ? (
                      <button onClick={() => voirDocument(c.document_antecedents_url!)} className="mt-1 flex items-center gap-1 text-ul-green underline">
                        <FileText className="h-3 w-3" /> {t('conformite.view_document')}
                      </button>
                    ) : (
                      <p className="mt-1 text-neutral-400">{t('conformite.no_document')}</p>
                    )}
                    {c.verification_antecedents_statut !== 'valide' && (
                      <button onClick={() => validerAntecedents(c.id)} className="btn-primary mt-1 w-full py-1 text-xs">
                        {t('conformite.validate_antecedents')}
                      </button>
                    )}
                  </div>

                  <div className="rounded-lg bg-ul-gray p-2">
                    <p className="font-medium">{t('conformite.formation_title')}</p>
                    <p className="text-neutral-500">{t(`conformite.status_${c.formation_protection_enfance_statut}`)}</p>
                    {c.document_formation_url ? (
                      <button onClick={() => voirDocument(c.document_formation_url!)} className="mt-1 flex items-center gap-1 text-ul-green underline">
                        <FileText className="h-3 w-3" /> {t('conformite.view_document')}
                      </button>
                    ) : (
                      <p className="mt-1 text-neutral-400">{t('conformite.no_document')}</p>
                    )}
                    {c.formation_protection_enfance_statut !== 'valide' && (
                      <button onClick={() => validerFormation(c.id)} className="btn-primary mt-1 w-full py-1 text-xs">
                        {t('conformite.validate_formation')}
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-2 text-xs text-neutral-500">
                  {t('conformite.code_conduite_title')}: {c.code_conduite_signe ? t('conformite.status_valide') : t('conformite.status_en_attente')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">{t('admin.players')}</h2>
        <ul className="mt-2 divide-y divide-black/5">
          {players
            .filter((p) => p.role === 'joueur')
            .map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <p className="text-sm font-medium">{p.nom_complet}</p>
                <button
                  onClick={() => toggleVerified(p.id, p.verifie_par_centre)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    p.verifie_par_centre ? 'bg-ul-green/10 text-ul-green' : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {p.verifie_par_centre ? t('admin.verified') : t('admin.verify')}
                </button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
