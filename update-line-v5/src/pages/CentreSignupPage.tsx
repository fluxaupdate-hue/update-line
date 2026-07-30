import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LanguageSwitch from '../components/LanguageSwitch';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans caractères ambigus
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function CentreSignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [nomCentre, setNomCentre] = useState('');
  const [pays, setPays] = useState('Cameroun');
  const [ville, setVille] = useState('');
  const [joursSelectionnes, setJoursSelectionnes] = useState<string[]>([]);
  const [horaire, setHoraire] = useState('');
  const [adminNom, setAdminNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  function toggleJour(key: string) {
    setJoursSelectionnes((prev) => (prev.includes(key) ? prev.filter((j) => j !== key) : [...prev, key]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const inviteCode = generateInviteCode();

    // 1. Créer le compte auth de l'administrateur D'ABORD (nécessaire pour que la sécurité
    // de la base de données autorise l'insertion du centre juste après).
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !signUpData.user) {
      setLoading(false);
      setError(signUpError?.message ?? t('common.error_generic'));
      return;
    }

    // 2. Créer le centre — c'est ça qui "génère déjà les bases" pour accueillir les joueurs :
    // code d'invitation prêt, jours/horaires d'entraînement enregistrés dès la création.
    const { data: centre, error: centreError } = await supabase
      .from('centres')
      .insert({
        nom: nomCentre.trim(),
        pays,
        ville: ville.trim() || null,
        code_invitation: inviteCode,
        jours_entrainement: joursSelectionnes.map((k) => t(`centre_signup.days.${k}`)),
        horaire_entrainement: horaire.trim() || null,
      })
      .select('id, code_invitation')
      .single();

    if (centreError || !centre) {
      setLoading(false);
      setError(t('common.error_generic'));
      return;
    }

    // 3. Créer le profil admin, déjà rattaché au centre et déjà vérifié (il EST le centre)
    const { error: profileError } = await supabase.from('profiles').insert({
      id: signUpData.user.id,
      centre_id: centre.id,
      role: 'admin_centre',
      nom_complet: adminNom.trim(),
      consent_parental_valide: true, // un administrateur est nécessairement majeur
      verifie_par_centre: true,
    });

    setLoading(false);
    if (profileError) {
      setError(t('common.error_generic'));
      return;
    }

    setCreatedCode(centre.code_invitation);
  }

  if (createdCode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ul-black px-6 text-center">
        <div className="card max-w-sm border-l-4 border-ul-green">
          <h1 className="font-heading text-xl font-bold text-ul-green">{t('centre_signup.success_title')}</h1>
          <p className="mt-2 text-sm text-neutral-600">{t('centre_signup.success_body')}</p>
          <p className="mt-3 rounded-lg bg-ul-gray px-3 py-2 font-mono text-2xl font-bold tracking-widest text-ul-black">
            {createdCode}
          </p>
          <button onClick={() => navigate('/')} className="btn-primary mt-5 w-full">
            {t('common.save')}
          </button>
        </div>
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
      <p className="mt-1 text-sm text-neutral-400">{t('centre_signup.title')}</p>

      <form onSubmit={handleSubmit} className="mt-6 w-full max-w-sm space-y-3">
        <input
          type="text" required placeholder={t('centre_signup.centre_name') ?? ''}
          value={nomCentre} onChange={(e) => setNomCentre(e.target.value)}
          className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
        />
        <div className="flex gap-2">
          <input
            type="text" required placeholder={t('centre_signup.centre_country') ?? ''}
            value={pays} onChange={(e) => setPays(e.target.value)}
            className="w-1/2 rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
          />
          <input
            type="text" placeholder={t('centre_signup.centre_city') ?? ''}
            value={ville} onChange={(e) => setVille(e.target.value)}
            className="w-1/2 rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-neutral-400">{t('centre_signup.training_days')}</label>
          <div className="flex flex-wrap gap-2">
            {DAY_KEYS.map((key) => (
              <button
                type="button"
                key={key}
                onClick={() => toggleJour(key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  joursSelectionnes.includes(key)
                    ? 'bg-ul-green text-white'
                    : 'bg-white/5 text-neutral-300 border border-white/10'
                }`}
              >
                {t(`centre_signup.days.${key}`)}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text" placeholder={t('centre_signup.training_hours_placeholder') ?? ''}
          value={horaire} onChange={(e) => setHoraire(e.target.value)}
          className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-neutral-400 focus:border-ul-green focus:outline-none"
        />

        <hr className="border-white/10" />

        <input
          type="text" required placeholder={t('centre_signup.admin_name') ?? ''}
          value={adminNom} onChange={(e) => setAdminNom(e.target.value)}
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
        {t('centre_signup.already_have_centre')}
      </Link>
    </div>
  );
}
