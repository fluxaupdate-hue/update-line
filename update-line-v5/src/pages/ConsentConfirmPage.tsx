import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LanguageSwitch from '../components/LanguageSwitch';

interface LookupResult {
  nom_complet: string;
  centre_nom: string | null;
  type: 'consentement' | 'recrutement';
}

export default function ConsentConfirmPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();

  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [checked, setChecked] = useState(false);
  const [parentNom, setParentNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) return;
      const { data, error: rpcError } = await supabase.rpc('consent_lookup', { p_token: token });
      if (!rpcError && data && data.length > 0) {
        setLookup({ nom_complet: data[0].nom_complet, centre_nom: data[0].centre_nom, type: data[0].type });
      }
      setLoading(false);
    }
    load();
  }, [token]);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !checked) return;
    setSubmitting(true);
    setError(null);

    // Le parent crée son propre compte Update Line (rôle "parent") au moment de confirmer.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !signUpData.user) {
      setSubmitting(false);
      setError(signUpError?.message ?? t('common.error_generic'));
      return;
    }

    await supabase.from('profiles').insert({
      id: signUpData.user.id,
      role: 'parent',
      nom_complet: parentNom.trim(),
      consent_parental_valide: true, // un parent est nécessairement majeur
    });

    const rpcName = lookup?.type === 'recrutement' ? 'recrutement_consent_confirm' : 'consent_confirm';
    const { data: confirmed, error: confirmError } = await supabase.rpc(rpcName, {
      p_token: token,
      p_parent_id: signUpData.user.id,
    });

    setSubmitting(false);
    if (confirmError || !confirmed) {
      setError(t('auth.confirm_invalid'));
      return;
    }
    setSuccess(true);
  }

  if (loading) return <p className="p-6 text-center">{t('common.loading')}</p>;

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ul-gray px-6 text-center">
        <div className="card max-w-sm border-l-4 border-ul-green">
          <h1 className="font-heading text-xl font-bold text-ul-green">{t('auth.confirm_success_title')}</h1>
          <p className="mt-2 text-sm text-neutral-700">{t('auth.confirm_success_body')}</p>
          <Link to="/login" className="btn-primary mt-4 block">{t('auth.login_now')}</Link>
        </div>
      </div>
    );
  }

  if (!lookup) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ul-gray px-6 text-center">
        <p className="card max-w-sm text-sm text-ul-red">{t('auth.confirm_invalid')}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ul-black px-6 py-10">
      <div className="absolute right-4 top-4">
        <LanguageSwitch />
      </div>
      <h1 className="font-heading text-2xl font-extrabold text-white">
        Update <span className="text-ul-green">Line</span>
      </h1>
      <p className="mt-1 text-sm text-neutral-400">{t('auth.consent_confirm_title')}</p>

      <div className="card mt-5 w-full max-w-sm bg-white/95">
        <p className="text-sm text-neutral-800">
          <strong>{lookup.nom_complet}</strong>{' '}
          {lookup.type === 'recrutement'
            ? t('auth.consent_confirm_recruitment_body')
            : `${t('auth.consent_confirm_body_prefix')} ${lookup.centre_nom ?? '—'}.`}
        </p>
      </div>

      <form onSubmit={handleConfirm} className="mt-4 w-full max-w-sm space-y-3">
        <input
          type="text" required placeholder={t('auth.your_name') ?? ''}
          value={parentNom} onChange={(e) => setParentNom(e.target.value)}
          className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
        />
        <input
          type="email" required placeholder="email@exemple.com"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
        />
        <input
          type="password" required minLength={6} placeholder="••••••••"
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
        />

        <label className="flex items-start gap-2 text-sm text-neutral-300">
          <input
            type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[color:var(--color-brand)]"
          />
          {t('auth.confirm_submit')}
        </label>

        {error && <p className="text-sm text-ul-red">{error}</p>}

        <button type="submit" disabled={submitting || !checked} className="btn-primary w-full disabled:opacity-50">
          {submitting ? t('common.loading') : t('auth.confirm_submit')}
        </button>
      </form>
    </div>
  );
}
