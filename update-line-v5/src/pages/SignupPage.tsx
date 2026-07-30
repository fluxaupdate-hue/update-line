import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { isMinor } from '../types';
import LanguageSwitch from '../components/LanguageSwitch';

interface CentreOption {
  id: string;
  nom: string;
  ville: string | null;
}

export default function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'centre' | 'agent_libre'>('centre');

  const [nomComplet, setNomComplet] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentEmail, setParentEmail] = useState('');

  // Recherche du centre par nom
  const [centreQuery, setCentreQuery] = useState('');
  const [centreResults, setCentreResults] = useState<CentreOption[]>([]);
  const [selectedCentre, setSelectedCentre] = useState<CentreOption | null>(null);
  const [codeInvitation, setCodeInvitation] = useState('');

  // Agent libre
  const [parcoursTexte, setParcoursTexte] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const minor = dateNaissance ? isMinor(dateNaissance) : false;

  useEffect(() => {
    if (mode !== 'centre' || centreQuery.trim().length < 2 || selectedCentre) {
      setCentreResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('centres')
        .select('id, nom, ville')
        .ilike('nom', `%${centreQuery.trim()}%`)
        .limit(6);
      setCentreResults((data as CentreOption[]) ?? []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [centreQuery, mode, selectedCentre]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (minor && !parentEmail.trim()) {
      setError(t('auth.parent_email_hint'));
      return;
    }
    if (mode === 'centre' && !selectedCentre) {
      setError(t('signup_mode.centre_hint'));
      return;
    }

    setLoading(true);

    let centreId: string | null = null;

    if (mode === 'centre' && selectedCentre) {
      // Le code d'invitation confirme que le joueur a vraiment le droit de rejoindre CE centre
      // (le nom seul ne suffit pas — n'importe qui pourrait chercher un centre par nom).
      const { data: centre, error: centreError } = await supabase
        .from('centres')
        .select('id')
        .eq('id', selectedCentre.id)
        .eq('code_invitation', codeInvitation.trim())
        .maybeSingle();

      if (centreError || !centre) {
        setLoading(false);
        setError(t('auth.centre_not_found'));
        return;
      }
      centreId = centre.id;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !signUpData.user) {
      setLoading(false);
      setError(signUpError?.message ?? t('common.error_generic'));
      return;
    }

    const consentToken = minor ? crypto.randomUUID() : null;
    const consentExpiry = minor ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

    const { error: profileError } = await supabase.from('profiles').insert({
      id: signUpData.user.id,
      centre_id: centreId,
      role: 'joueur',
      nom_complet: nomComplet.trim(),
      date_naissance: dateNaissance,
      parent_email: minor ? parentEmail.trim() : null,
      consent_parental_valide: !minor,
      consent_token: consentToken,
      consent_token_expire_le: consentExpiry,
      agent_libre: mode === 'agent_libre',
      parcours_texte: mode === 'agent_libre' ? parcoursTexte.trim() || null : null,
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
      <p className="mt-1 text-sm text-neutral-400">{t('auth.signup_title')}</p>

      <div className="mt-5 flex w-full max-w-sm gap-2">
        <button
          type="button"
          onClick={() => setMode('centre')}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'centre' ? 'bg-ul-green text-white' : 'bg-white/5 text-neutral-300 border border-white/10'
          }`}
        >
          {t('signup_mode.has_centre')}
        </button>
        <button
          type="button"
          onClick={() => setMode('agent_libre')}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'agent_libre' ? 'bg-ul-green text-white' : 'bg-white/5 text-neutral-300 border border-white/10'
          }`}
        >
          {t('signup_mode.free_agent')}
        </button>
      </div>

      <form onSubmit={handleSignup} className="mt-4 w-full max-w-sm space-y-3">
        <input
          type="text" required placeholder={t('auth.full_name') ?? ''}
          value={nomComplet} onChange={(e) => setNomComplet(e.target.value)}
          className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
        />

        <div>
          <label className="mb-1 block text-xs text-neutral-400">{t('auth.birth_date')}</label>
          <input
            type="date" required value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)}
            className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white focus:border-ul-green focus:outline-none"
          />
        </div>

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

        {mode === 'centre' ? (
          <div>
            <label className="mb-1 block text-xs text-neutral-400">{t('signup_mode.choose_centre')}</label>

            {selectedCentre ? (
              <div className="flex items-center justify-between rounded-xl border border-ul-green/40 bg-ul-green/10 p-3">
                <span className="text-sm text-white">
                  {selectedCentre.nom}{selectedCentre.ville ? ` · ${selectedCentre.ville}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => { setSelectedCentre(null); setCentreQuery(''); }}
                  className="text-xs text-neutral-400 underline"
                >
                  {t('common.cancel')}
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder={t('signup_mode.search_centre_placeholder') ?? ''}
                  value={centreQuery}
                  onChange={(e) => setCentreQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
                />
                {centreQuery.trim().length >= 2 && (
                  <div className="mt-1 overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
                    {centreResults.length === 0 ? (
                      <p className="p-3 text-xs text-neutral-500">{t('signup_mode.no_centre_found')}</p>
                    ) : (
                      centreResults.map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => setSelectedCentre(c)}
                          className="block w-full px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                        >
                          {c.nom}{c.ville ? ` · ${c.ville}` : ''}
                        </button>
                      ))
                    )}
                  </div>
                )}
                <p className="mt-1 text-xs text-neutral-500">{t('signup_mode.centre_hint')}</p>
              </>
            )}

            {selectedCentre && (
              <div className="mt-2">
                <input
                  type="text" required placeholder={t('auth.centre_code') ?? ''}
                  value={codeInvitation}
                  onChange={(e) => setCodeInvitation(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-white/25 bg-white/10 p-3 uppercase text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
                />
                <p className="mt-1 text-xs text-neutral-500">{t('auth.centre_code_hint')}</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-xs text-neutral-400">{t('signup_mode.parcours_label')}</label>
            <textarea
              rows={3}
              placeholder={t('signup_mode.parcours_placeholder') ?? ''}
              value={parcoursTexte}
              onChange={(e) => setParcoursTexte(e.target.value)}
              className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-sm text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
            />
            <p className="mt-1 text-xs text-neutral-500">{t('signup_mode.parcours_hint')}</p>
          </div>
        )}

        {dateNaissance && minor && (
          <div className="rounded-xl border border-ul-yellow/40 bg-ul-yellow/10 p-3">
            <label className="mb-1 block text-xs font-medium text-ul-yellow">{t('auth.parent_email')}</label>
            <input
              type="email" required placeholder="parent@exemple.com"
              value={parentEmail} onChange={(e) => setParentEmail(e.target.value)}
              className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
            />
            <p className="mt-1 text-xs text-neutral-400">{t('auth.parent_email_hint')}</p>
          </div>
        )}

        {error && <p className="text-sm text-ul-red">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? t('common.loading') : t('auth.signup_submit')}
        </button>
      </form>

      <Link to="/login" className="mt-4 text-sm text-neutral-400 underline">
        {t('auth.login_cta')}
      </Link>
    </div>
  );
}
