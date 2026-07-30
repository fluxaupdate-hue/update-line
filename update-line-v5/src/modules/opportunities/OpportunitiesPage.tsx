import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plane, Award, School } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import EmptyState from '../../components/EmptyState';

interface Bourse { id: string; titre: string; pays: string | null; sport_concerne: string | null; date_limite: string | null; lien: string | null }
interface Ecole { id: string; nom: string; pays: string | null; ville: string | null; sports: string[] | null }

export default function OpportunitiesPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [bourses, setBourses] = useState<Bourse[]>([]);
  const [ecoles, setEcoles] = useState<Ecole[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: b }, { data: e }] = await Promise.all([
        supabase.from('bourses').select('id, titre, pays, sport_concerne, date_limite, lien'),
        supabase.from('ecoles_sportives').select('id, nom, pays, ville, sports'),
      ]);
      setBourses((b as Bourse[]) ?? []);
      setEcoles((e as Ecole[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleApply(bourseId: string) {
    if (!profile?.id) return;
    const { error } = await supabase.from('candidatures').insert({ profile_id: profile.id, bourse_id: bourseId, statut: 'interesse' });
    if (!error) setAppliedIds((prev) => new Set(prev).add(bourseId));
  }

  if (loading) return <p className="p-6">{t('common.loading')}</p>;

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
        <Plane className="h-6 w-6 text-ul-green" strokeWidth={1.75} /> {t('opportunities.title')}
      </h1>

      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">{t('opportunities.scholarships_title')}</h2>
        {bourses.length === 0 ? (
          <EmptyState icon={<Award className="h-6 w-6" strokeWidth={1.75} />} title={t('opportunities.no_scholarships')} />
        ) : (
          <ul className="mt-2 space-y-2">
            {bourses.map((b) => (
              <li key={b.id} className="rounded-lg bg-ul-gray p-2 text-sm">
                <p className="font-medium">{b.titre}</p>
                <p className="text-xs text-neutral-500">{b.pays} · {b.sport_concerne ?? '—'}</p>
                {b.date_limite && <p className="text-xs text-neutral-500">Deadline: {b.date_limite}</p>}
                <button
                  onClick={() => handleApply(b.id)}
                  disabled={appliedIds.has(b.id)}
                  className="mt-2 rounded-full bg-ul-green/10 px-3 py-1 text-xs font-medium text-ul-green disabled:opacity-50"
                >
                  {appliedIds.has(b.id) ? t('opportunities.applied') : t('opportunities.apply')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">{t('opportunities.schools_title')}</h2>
        {ecoles.length === 0 ? (
          <EmptyState icon={<School className="h-6 w-6" strokeWidth={1.75} />} title={t('opportunities.no_schools')} />
        ) : (
          <ul className="mt-2 space-y-2">
            {ecoles.map((e) => (
              <li key={e.id} className="rounded-lg bg-ul-gray p-2 text-sm">
                <p className="font-medium">{e.nom}</p>
                <p className="text-xs text-neutral-500">{e.ville}, {e.pays}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
