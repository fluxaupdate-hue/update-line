import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { ReportCategory } from '../../types';

const CATEGORIES: { key: ReportCategory; labelKey: string }[] = [
  { key: 'violence', labelKey: 'security.violence' },
  { key: 'harcelement', labelKey: 'security.harassment' },
  { key: 'abus', labelKey: 'security.abuse' },
  { key: 'autre', labelKey: 'security.other' },
];

export default function SignalementPage() {
  const { t } = useTranslation();
  const { profile, isMinorUser } = useAuth();
  const [categorie, setCategorie] = useState<ReportCategory>('violence');
  const [description, setDescription] = useState('');
  const [stayAnonymous, setStayAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!description.trim()) return;
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('signalements').insert({
      centre_id: profile?.centre_id ?? null,
      profile_id: stayAnonymous ? null : profile?.id ?? null,
      categorie,
      description: description.trim(),
      requiert_validation_parent: isMinorUser,
    });

    setSubmitting(false);
    if (insertError) {
      setError(t('common.error_generic'));
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <div className="card border-l-4 border-ul-green">
          <h2 className="font-heading text-xl font-bold text-ul-green">
            {t('security.submitted_title')}
          </h2>
          <p className="mt-2 text-sm text-neutral-700">{t('security.submitted_body')}</p>
        </div>
        <HelplinesCard />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-ul-black">
        <ShieldAlert className="h-6 w-6" strokeWidth={1.75} /> {t('security.title')}
      </h1>
      <p className="mt-1 text-sm text-neutral-600">{t('security.subtitle')}</p>

      {isMinorUser && (
        <div className="mt-3 rounded-xl bg-ul-yellow/20 border border-ul-yellow p-3 text-xs text-neutral-800">
          {t('security.parent_consent_notice')}
        </div>
      )}

      <div className="mt-5">
        <label className="mb-2 block font-heading text-sm font-semibold">
          {t('security.category')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategorie(c.key)}
              className={`rounded-xl border p-3 text-sm font-medium transition-colors ${
                categorie === c.key
                  ? 'border-ul-red bg-ul-red/10 text-ul-red'
                  : 'border-black/10 bg-ul-white text-neutral-700'
              }`}
            >
              {t(c.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block font-heading text-sm font-semibold">
          {t('security.description')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('security.description_placeholder') ?? ''}
          rows={5}
          className="w-full rounded-xl border border-black/10 bg-ul-white p-3 text-sm focus:border-ul-green focus:outline-none"
        />
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
        <input
          type="checkbox"
          checked={stayAnonymous}
          onChange={(e) => setStayAnonymous(e.target.checked)}
          className="h-4 w-4 accent-[color:var(--color-brand)]"
        />
        {t('security.anonymous_note')}
      </label>

      {error && <p className="mt-2 text-sm text-ul-red">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting || !description.trim()}
        className="btn-danger mt-5 w-full disabled:opacity-50"
      >
        {submitting ? t('common.loading') : t('security.submit')}
      </button>

      <HelplinesCard />
    </div>
  );
}

function HelplinesCard() {
  const { t } = useTranslation();
  const helplines = [
    { pays: 'Cameroun', label: "Ligne d'écoute enfance (à confirmer avec le Ministère des Affaires Sociales)" },
  ];
  return (
    <div className="card mt-4">
      <h3 className="font-heading text-sm font-semibold">{t('security.helplines_title')}</h3>
      <ul className="mt-2 space-y-1 text-sm text-neutral-600">
        {helplines.map((h) => (
          <li key={h.pays}>
            <span className="font-medium">{h.pays}:</span> {h.label}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-neutral-400">
        Remplacer par les numéros verts officiels validés par le centre avant mise en production.
      </p>
    </div>
  );
}
