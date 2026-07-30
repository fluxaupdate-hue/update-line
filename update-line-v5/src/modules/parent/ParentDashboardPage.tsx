import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitch from '../../components/LanguageSwitch';
import { calculerMoyenneSur20 } from '../../lib/schoolUtils';

interface ChildSummary {
  id: string;
  nom_complet: string;
  photo_url: string | null;
  consent_parental_valide: boolean;
  recrutement_active: boolean;
  recrutement_valide_par_parent: boolean;
  moyenne: number | null;
  douleurRecente: boolean;
}

export default function ParentDashboardPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile?.id) return;

      const { data: liens } = await supabase
        .from('liens_parent_enfant')
        .select('enfant_id')
        .eq('parent_id', profile.id)
        .eq('valide', true);

      const childIds = (liens ?? []).map((l) => l.enfant_id);
      if (childIds.length === 0) {
        setLoading(false);
        return;
      }

      const results: ChildSummary[] = [];
      for (const childId of childIds) {
        const [{ data: p }, { data: notes }, { data: wellness }] = await Promise.all([
          supabase.from('profiles').select('id, nom_complet, photo_url, consent_parental_valide, recrutement_active, recrutement_valide_par_parent').eq('id', childId).single(),
          supabase.from('notes_scolaires').select('note, bareme').eq('profile_id', childId),
          supabase.from('wellness_checkins').select('douleur_signalee').eq('profile_id', childId).order('date_checkin', { ascending: false }).limit(7),
        ]);

        if (!p) continue;

        const moyenne = calculerMoyenneSur20(notes ?? []);
        const douleurRecente = (wellness ?? []).some((w) => w.douleur_signalee);

        results.push({ ...p, moyenne, douleurRecente });
      }

      setChildren(results);
      setLoading(false);
    }
    load();
  }, [profile?.id]);

  async function approuverRecrutement(childId: string) {
    const { error } = await supabase.from('profiles').update({ recrutement_valide_par_parent: true }).eq('id', childId);
    if (!error) {
      setChildren((prev) => prev.map((c) => (c.id === childId ? { ...c, recrutement_valide_par_parent: true } : c)));
    }
  }

  if (loading) return <p className="p-6">{t('common.loading')}</p>;

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
          <Users className="h-6 w-6 text-ul-green" strokeWidth={1.75} /> {t('parent.title')}
        </h1>
        <LanguageSwitch />
      </div>

      {children.length === 0 ? (
        <div className="card mt-4">
          <p className="text-sm text-neutral-600">{t('parent.no_children')}</p>
          <p className="mt-1 text-xs text-neutral-400">{t('parent.no_children_hint')}</p>
        </div>
      ) : (
        children.map((c) => (
          <div key={c.id} className="card mt-4">
            <div className="flex items-center gap-3">
              <img
                src={c.photo_url ?? 'https://api.dicebear.com/7.x/initials/svg?seed=' + c.nom_complet}
                alt={c.nom_complet}
                className="h-12 w-12 rounded-full border-2 border-ul-green object-cover"
              />
              <div>
                <p className="font-heading font-semibold">{c.nom_complet}</p>
                <span className="flex items-center gap-1 text-xs text-ul-green">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} /> {t('parent.consent_status')}: {t('parent.confirmed')}
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-ul-gray p-2">
                <p className="text-xs text-neutral-500">{t('parent.school_average')}</p>
                <p className="font-heading font-bold">{c.moyenne !== null ? `${c.moyenne.toFixed(1)}/20` : '—'}</p>
              </div>
              <div className="rounded-lg bg-ul-gray p-2">
                <p className="text-xs text-neutral-500">{t('parent.wellness_recent')}</p>
                <p className={`flex items-center gap-1 text-xs font-medium ${c.douleurRecente ? 'text-ul-red' : 'text-ul-green'}`}>
                  {c.douleurRecente && <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />}
                  {c.douleurRecente ? t('parent.wellness_pain_alert') : t('parent.wellness_ok')}
                </p>
              </div>
            </div>

            {c.recrutement_active && !c.recrutement_valide_par_parent && (
              <div className="mt-3 rounded-xl border border-ul-yellow/40 bg-ul-yellow/10 p-3">
                <p className="text-xs text-neutral-800">{t('parent.recruitment_pending')}</p>
                <button
                  onClick={() => approuverRecrutement(c.id)}
                  className="btn-primary mt-2 w-full py-1.5 text-xs"
                >
                  {t('parent.recruitment_validate')}
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
