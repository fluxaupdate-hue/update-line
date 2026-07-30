import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloudSun } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const SCALE = [1, 2, 3, 4, 5];
const today = () => new Date().toISOString().slice(0, 10);

export default function WellnessCheckinPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [sommeil, setSommeil] = useState(3);
  const [humeur, setHumeur] = useState(3);
  const [stress, setStress] = useState(3);
  const [hydratationOk, setHydratationOk] = useState(true);
  const [nutritionOk, setNutritionOk] = useState(true);
  const [douleur, setDouleur] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    async function checkExisting() {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('wellness_checkins')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('date_checkin', today())
        .maybeSingle();
      if (data) setAlreadyDone(true);
      setLoading(false);
    }
    checkExisting();
  }, [profile?.id]);

  async function handleSubmit() {
    if (!profile?.id) return;
    setSubmitting(true);
    const { error } = await supabase.from('wellness_checkins').insert({
      profile_id: profile.id,
      date_checkin: today(),
      sommeil_qualite: sommeil,
      humeur,
      niveau_stress: stress,
      hydratation_ok: hydratationOk,
      nutrition_ok: nutritionOk,
      douleur_signalee: douleur,
      note_libre: note.trim() || null,
    });
    setSubmitting(false);
    if (!error) setSubmitted(true);
  }

  if (loading) return <p className="p-6">{t('common.loading')}</p>;

  if (alreadyDone || submitted) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <div className="card border-l-4 border-ul-green">
          <h2 className="font-heading text-xl font-bold text-ul-green">
            {submitted ? t('wellness.submitted_title') : t('wellness.already_done_title')}
          </h2>
          <p className="mt-2 text-sm text-neutral-700">
            {submitted ? t('wellness.submitted_body') : t('wellness.already_done_body')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
        <CloudSun className="h-6 w-6 text-ul-green" strokeWidth={1.75} /> {t('wellness.title')}
      </h1>
      <p className="mt-1 text-sm text-neutral-600">{t('wellness.subtitle')}</p>

      <ScaleField label={t('wellness.sleep')} value={sommeil} onChange={setSommeil} emojiLow="😴" emojiHigh="🤩" />
      <ScaleField label={t('wellness.mood')} value={humeur} onChange={setHumeur} emojiLow="😞" emojiHigh="😄" />
      <ScaleField label={t('wellness.stress')} value={stress} onChange={setStress} emojiLow="😌" emojiHigh="😰" />

      <ToggleField label={t('wellness.hydration')} checked={hydratationOk} onChange={setHydratationOk} />
      <ToggleField label={t('wellness.nutrition')} checked={nutritionOk} onChange={setNutritionOk} />
      <ToggleField label={t('wellness.pain')} checked={douleur} onChange={setDouleur} accent="danger" />

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('wellness.note_placeholder') ?? ''}
        rows={3}
        className="mt-4 w-full rounded-xl border border-black/10 bg-ul-white p-3 text-sm focus:border-ul-green focus:outline-none"
      />

      <button onClick={handleSubmit} disabled={submitting} className="btn-primary mt-5 w-full disabled:opacity-50">
        {submitting ? t('common.loading') : t('wellness.submit')}
      </button>
    </div>
  );
}

function ScaleField({
  label,
  value,
  onChange,
  emojiLow,
  emojiHigh,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  emojiLow: string;
  emojiHigh: string;
}) {
  return (
    <div className="card mt-3">
      <p className="mb-2 font-heading text-sm font-semibold">{label}</p>
      <div className="flex items-center justify-between gap-1">
        <span>{emojiLow}</span>
        {SCALE.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`h-9 w-9 rounded-full text-sm font-semibold transition-colors ${
              value === n ? 'bg-ul-green text-white' : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            {n}
          </button>
        ))}
        <span>{emojiHigh}</span>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
  accent,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accent?: 'danger';
}) {
  return (
    <label className="card mt-3 flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`h-5 w-5 ${accent === 'danger' ? 'accent-[color:var(--color-danger)]' : 'accent-[color:var(--color-brand)]'}`}
      />
    </label>
  );
}
