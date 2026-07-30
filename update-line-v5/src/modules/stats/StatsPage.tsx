import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Goal, Target, Clock, BarChart3, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';

interface Entry { id: string; date_match: string; adversaire: string | null; stats: Record<string, number> }

export default function StatsPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const [adversaire, setAdversaire] = useState('');
  const [date, setDate] = useState('');
  const [buts, setButs] = useState('');
  const [passes, setPasses] = useState('');
  const [minutes, setMinutes] = useState('');

  useEffect(() => {
    async function load() {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('stats_entries')
        .select('id, date_match, adversaire, stats')
        .eq('profile_id', profile.id)
        .order('date_match', { ascending: false });
      setEntries((data as Entry[]) ?? []);
      setLoading(false);
    }
    load();
  }, [profile?.id]);

  async function handleAdd() {
    if (!profile?.id || !date) return;
    const stats = { buts: Number(buts) || 0, passes: Number(passes) || 0, minutes: Number(minutes) || 0 };
    const { data, error } = await supabase
      .from('stats_entries')
      .insert({ profile_id: profile.id, date_match: date, adversaire: adversaire.trim() || null, stats, source: 'manuel' })
      .select('id, date_match, adversaire, stats')
      .single();
    if (!error && data) {
      setEntries((prev) => [data as Entry, ...prev]);
      setAdversaire(''); setDate(''); setButs(''); setPasses(''); setMinutes('');
    }
  }

  if (loading) return <p className="p-6">{t('common.loading')}</p>;

  const totaux = entries.reduce(
    (acc, e) => ({
      buts: acc.buts + (e.stats.buts ?? 0),
      passes: acc.passes + (e.stats.passes ?? 0),
      minutes: acc.minutes + (e.stats.minutes ?? 0),
    }),
    { buts: 0, passes: 0, minutes: 0 }
  );

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
        <BarChart3 className="h-6 w-6 text-ul-green" strokeWidth={1.75} /> {t('stats.title')}
      </h1>
      <p className="mt-2 text-xs text-neutral-500">{t('stats.note_ia')}</p>

      {entries.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatCard icon={<Goal className="h-5 w-5" strokeWidth={1.75} />} value={totaux.buts} label={t('stats.goals')} />
          <StatCard icon={<Target className="h-5 w-5" strokeWidth={1.75} />} value={totaux.passes} label={t('stats.assists')} />
          <StatCard icon={<Clock className="h-5 w-5" strokeWidth={1.75} />} value={totaux.minutes} label={t('stats.minutes')} />
        </div>
      )}

      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">{t('stats.add_entry')}</h2>
        <div className="mt-2 space-y-2">
          <input type="text" placeholder={t('stats.opponent') ?? ''} value={adversaire} onChange={(e) => setAdversaire(e.target.value)} className="w-full rounded-lg border border-black/10 p-2 text-sm" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-black/10 p-2 text-sm" />
          <div className="flex gap-2">
            <input type="number" placeholder={t('stats.goals') ?? ''} value={buts} onChange={(e) => setButs(e.target.value)} className="w-1/3 rounded-lg border border-black/10 p-2 text-sm" />
            <input type="number" placeholder={t('stats.assists') ?? ''} value={passes} onChange={(e) => setPasses(e.target.value)} className="w-1/3 rounded-lg border border-black/10 p-2 text-sm" />
            <input type="number" placeholder={t('stats.minutes') ?? ''} value={minutes} onChange={(e) => setMinutes(e.target.value)} className="w-1/3 rounded-lg border border-black/10 p-2 text-sm" />
          </div>
          <button onClick={handleAdd} className="btn-primary w-full py-2 text-sm">{t('stats.submit')}</button>
        </div>
      </div>

      <div className="card mt-4">
        {entries.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="h-6 w-6" strokeWidth={1.75} />}
            title={t('stats.no_entries')}
            description={t('stats.note_ia') ?? undefined}
          />
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id} className="rounded-lg bg-ul-gray p-2 text-sm">
                <p className="font-medium">vs {e.adversaire ?? '—'} · {e.date_match}</p>
                <p className="flex items-center gap-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1"><Goal className="h-3.5 w-3.5" strokeWidth={1.75} /> {e.stats.buts ?? 0}</span>
                  <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" strokeWidth={1.75} /> {e.stats.passes ?? 0}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" strokeWidth={1.75} /> {e.stats.minutes ?? 0} min</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
