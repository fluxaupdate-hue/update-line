import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LanguageSwitch from '../components/LanguageSwitch';

export default function RecruiterSignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [nomComplet, setNomComplet] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [licence, setLicence] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !signUpData.user) {
      setLoading(false);
      setError(signUpError?.message ?? t('common.error_generic'));
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: signUpData.user.id,
      role: 'recruteur',
      nom_complet: nomComplet.trim(),
      recruteur_organisation: organisation.trim() || null,
      recruteur_licence: licence.trim() || null,
      recruteur_verifie: false, // un centre doit vérifier avant tout accès aux profils
      consent_parental_valide: true, // un recruteur est nécessairement majeur
    });

    setLoading(false);
    if (profileError) {
      setError(t('common.error_generic'));
      return;
    }
    navigate('/');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ul-black px-6 py-10">
      <div className="absolute right-4 top-4">
        <LanguageSwitch />
      </div>
      <h1 className="font-heading text-2xl font-extrabold text-white">
        Update <span className="text-ul-green">Line</span>
      </h1>
      <p className="mt-1 text-sm text-neutral-400">{t('recruiter.signup_title')}</p>

      <form onSubmit={handleSubmit} className="mt-6 w-full max-w-sm space-y-3">
        <input
          type="text" required placeholder={t('auth.full_name') ?? ''}
          value={nomComplet} onChange={(e) => setNomComplet(e.target.value)}
          className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
        />
        <input
          type="text" placeholder={t('recruiter.organisation') ?? ''}
          value={organisation} onChange={(e) => setOrganisation(e.target.value)}
          className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
        />
        <input
          type="text" placeholder={t('recruiter.licence') ?? ''}
          value={licence} onChange={(e) => setLicence(e.target.value)}
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

        {error && <p className="text-sm text-ul-red">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? t('common.loading') : t('centre_signup.submit')}
        </button>
      </form>

      <Link to="/login" className="mt-4 text-sm text-neutral-400 underline">
        {t('auth.login_cta')}
      </Link>
    </div>
  );
}
