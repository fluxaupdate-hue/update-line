import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, GraduationCap, ClipboardList, CalendarX } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { calculerMoyenneSur20, moyenneEnAlerte } from '../../lib/schoolUtils';
import EmptyState from '../../components/EmptyState';

interface Note { id: string; matiere: string; note: number; bareme: number; trimestre: string | null }
interface Absence { id: string; date_absence: string; motif: string | null }

export default function SchoolPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

  const isStaff = profile?.role === 'coach' || profile?.role === 'admin_centre';
  const [matiere, setMatiere] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    async function load() {
      if (!profile?.id) return;
      const [{ data: n }, { data: a }] = await Promise.all([
        supabase.from('notes_scolaires').select('id, matiere, note, bareme, trimestre').eq('profile_id', profile.id),
        supabase.from('absences').select('id, date_absence, motif').eq('profile_id', profile.id),
      ]);
      setNotes((n as Note[]) ?? []);
      setAbsences((a as Absence[]) ?? []);
      setLoading(false);
    }
    load();
  }, [profile?.id]);

  const moyenneSur20 = calculerMoyenneSur20(notes);

  async function handleAddNote() {
    if (!matiere.trim() || !note || !profile?.id) return;
    const { data, error } = await supabase
      .from('notes_scolaires')
      .insert({ profile_id: profile.id, matiere: matiere.trim(), note: Number(note) })
      .select('id, matiere, note, bareme, trimestre')
      .single();
    if (!error && data) {
      setNotes((prev) => [...prev, data as Note]);
      setMatiere('');
      setNote('');
    }
  }

  if (loading) return <p className="p-6">{t('common.loading')}</p>;

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
        <GraduationCap className="h-6 w-6 text-ul-green" strokeWidth={1.75} /> {t('school.title')}
      </h1>

      <div className="card mt-4 bg-ul-black text-white">
        <p className="font-heading text-sm">{t('school.average')}</p>
        <p className="font-heading text-3xl font-bold text-ul-yellow">
          {moyenneSur20 !== null ? `${moyenneSur20.toFixed(1)}/20` : '—'}
        </p>
      </div>

      {moyenneEnAlerte(moyenneSur20) && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-ul-red/40 bg-ul-red/10 p-3 text-sm text-ul-red">
          <AlertTriangle className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          <span>{t('school.alert_low_average')}</span>
        </div>
      )}

      <div className="card mt-4">
        {notes.length === 0 ? (
          <EmptyState icon={<ClipboardList className="h-6 w-6" strokeWidth={1.75} />} title={t('school.no_notes')} />
        ) : (
          <ul className="space-y-1">
            {notes.map((n) => (
              <li key={n.id} className="flex justify-between text-sm">
                <span>{n.matiere}</span>
                <span className="font-medium">{n.note}/{n.bareme}</span>
              </li>
            ))}
          </ul>
        )}

        {isStaff && (
          <div className="mt-3 flex gap-2 border-t border-black/5 pt-3">
            <input
              type="text" placeholder={t('school.subject') ?? ''} value={matiere}
              onChange={(e) => setMatiere(e.target.value)}
              className="flex-1 rounded-lg border border-black/10 p-2 text-sm"
            />
            <input
              type="number" placeholder={t('school.grade') ?? ''} value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-20 rounded-lg border border-black/10 p-2 text-sm"
            />
            <button onClick={handleAddNote} className="btn-primary px-3 text-sm">{t('school.add_note')}</button>
          </div>
        )}
      </div>

      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">{t('school.absences_title')}</h2>
        {absences.length === 0 ? (
          <EmptyState icon={<CalendarX className="h-6 w-6" strokeWidth={1.75} />} title={t('school.no_absences')} />
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {absences.map((a) => (
              <li key={a.id}>{a.date_absence} {a.motif ? `· ${a.motif}` : ''}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
