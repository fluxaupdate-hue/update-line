import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LanguageSwitch from '../components/LanguageSwitch';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigate('/');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ul-black px-6">
      <div className="absolute right-4 top-4">
        <LanguageSwitch />
      </div>
      <h1 className="font-heading text-3xl font-extrabold text-white">
        Update <span className="text-ul-green">Line</span>
      </h1>
      <p className="mt-1 text-center text-sm text-neutral-400">{t('app.slogan')}</p>

      <form onSubmit={handleLogin} className="mt-8 w-full max-w-sm space-y-3">
        <input
          type="email"
          required
          placeholder="email@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
        />
        <input
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
        />
        {error && <p className="text-sm text-ul-red">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? t('common.loading') : 'Se connecter'}
        </button>
      </form>

      <Link to="/signup" className="mt-4 text-sm text-neutral-400 underline">
        {t('auth.signup_cta')}
      </Link>
      <Link to="/signup-centre" className="mt-2 text-xs text-neutral-500 underline">
        {t('centre_signup.title')}
      </Link>
      <Link to="/signup-recruteur" className="mt-2 text-xs text-neutral-500 underline">
        {t('recruiter.signup_title')}
      </Link>
    </div>
  );
}
