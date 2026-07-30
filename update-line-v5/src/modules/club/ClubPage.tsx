import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, PartyPopper, MapPin, NotebookPen, ListChecks, CalendarDays } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import EmptyState from '../../components/EmptyState';

interface JournalEntry { id: string; titre_seance: string; contenu: string | null; date_seance: string; code_seance: string | null }
interface Exercice { id: string; titre: string; description: string | null; statut: string; date_limite: string | null }
interface Match { id: string; adversaire: string | null; date_match: string; lieu: string | null; resultat: string | null }

export default function ClubPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [presenceCode, setPresenceCode] = useState('');
  const [presenceMsg, setPresenceMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: j }, { data: e }, { data: m }] = await Promise.all([
        supabase.from('journal_coach').select('id, titre_seance, contenu, date_seance, code_seance').order('date_seance', { ascending: false }).limit(10),
        profile?.id
          ? supabase.from('exercices_assignes').select('id, titre, description, statut, date_limite').eq('profile_id', profile.id)
          : Promise.resolve({ data: [] }),
        supabase.from('matchs').select('id, adversaire, date_match, lieu, resultat').order('date_match', { ascending: true }).limit(10),
      ]);
      setJournal((j as JournalEntry[]) ?? []);
      setExercices((e as Exercice[]) ?? []);
      setMatchs((m as Match[]) ?? []);
      setLoading(false);
    }
    load();
  }, [profile?.id]);

  async function handlePresence(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id) return;
    const seance = journal.find((j) => j.code_seance && j.code_seance === presenceCode.trim().toUpperCase());
    if (!seance) {
      setPresenceMsg(null);
      return;
    }
    const { error } = await supabase.from('presences').insert({
      profile_id: profile.id,
      seance_date: seance.date_seance,
    });
    if (!error) {
      setPresenceMsg(t('presence.scan_success'));
      setPresenceCode('');
    }
  }

  async function markDone(id: string) {
    const { error } = await supabase.from('exercices_assignes').update({ statut: 'fait' }).eq('id', id);
    if (!error) setExercices((prev) => prev.map((ex) => (ex.id === id ? { ...ex, statut: 'fait' } : ex)));
  }

  if (loading) return <p className="p-6">{t('common.loading')}</p>;

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
        <MapPin className="h-6 w-6 text-ul-green" strokeWidth={1.75} /> {t('club.title')}
      </h1>

      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">{t('club.presence_title')}</h2>
        <form onSubmit={handlePresence} className="mt-2 flex gap-2">
          <input
            type="text"
            placeholder={t('club.presence_code_placeholder') ?? ''}
            value={presenceCode}
            onChange={(e) => setPresenceCode(e.target.value.toUpperCase())}
            className="flex-1 rounded-xl border border-black/10 bg-ul-white p-2 text-sm uppercase focus:border-ul-green focus:outline-none"
          />
          <button type="submit" className="btn-primary px-4 text-sm">{t('club.presence_submit')}</button>
        </form>
        {presenceMsg && (
          <p className="mt-2 flex items-center gap-1 text-sm font-medium text-ul-green">
            <PartyPopper className="h-4 w-4" strokeWidth={1.75} /> {presenceMsg}, +10 XP
          </p>
        )}
      </div>

      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">{t('club.journal_title')}</h2>
        {journal.length === 0 ? (
          <EmptyState icon={<NotebookPen className="h-6 w-6" strokeWidth={1.75} />} title={t('club.no_journal')} />
        ) : (
          <ul className="mt-2 space-y-2">
            {journal.map((j) => (
              <li key={j.id} className="rounded-lg bg-ul-gray p-2 text-sm">
                <p className="font-medium">{j.titre_seance}</p>
                <p className="text-xs text-neutral-500">{j.date_seance}</p>
                {j.contenu && <p className="mt-1 text-neutral-700">{j.contenu}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">{t('club.exercices_title')}</h2>
        {exercices.length === 0 ? (
          <EmptyState icon={<ListChecks className="h-6 w-6" strokeWidth={1.75} />} title={t('club.no_exercices')} />
        ) : (
          <ul className="mt-2 space-y-2">
            {exercices.map((ex) => (
              <li key={ex.id} className="flex items-center justify-between rounded-lg bg-ul-gray p-2 text-sm">
                <div>
                  <p className="font-medium">{ex.titre}</p>
                  {ex.description && <p className="text-xs text-neutral-500">{ex.description}</p>}
                </div>
                {ex.statut !== 'fait' ? (
                  <button onClick={() => markDone(ex.id)} className="rounded-full bg-ul-green/10 px-3 py-1 text-xs font-medium text-ul-green">
                    {t('club.mark_done')}
                  </button>
                ) : (
                  <span className="text-ul-green"><CheckCircle2 className="h-4 w-4" strokeWidth={2} /></span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">{t('club.matchs_title')}</h2>
        {matchs.length === 0 ? (
          <EmptyState icon={<CalendarDays className="h-6 w-6" strokeWidth={1.75} />} title={t('club.no_matchs')} />
        ) : (
          <ul className="mt-2 space-y-2">
            {matchs.map((m) => (
              <li key={m.id} className="rounded-lg bg-ul-gray p-2 text-sm">
                <p className="font-medium">vs {m.adversaire ?? '—'}</p>
                <p className="text-xs text-neutral-500">{new Date(m.date_match).toLocaleDateString()} · {m.lieu ?? '—'}</p>
                {m.resultat && <p className="mt-1 font-heading font-semibold text-ul-green">{m.resultat}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
