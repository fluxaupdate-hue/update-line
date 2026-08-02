import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();

  const [poste, setPoste] = useState(profile?.poste ?? '');
  const [taille, setTaille] = useState(profile?.taille_cm?.toString() ?? '');
  const [poids, setPoids] = useState(profile?.poids_kg?.toString() ?? '');
  const [ecole, setEcole] = useState(profile?.ecole ?? '');
  const [fbUrl, setFbUrl] = useState(profile?.fb_url ?? '');
  const [igUrl, setIgUrl] = useState(profile?.ig_url ?? '');
  const [tiktokUrl, setTiktokUrl] = useState(profile?.tiktok_url ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState(profile?.youtube_url ?? '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    if (!profile?.id) return;
    setSaving(true);
    setSuccess(false);

    const { error } = await supabase
      .from('profiles')
      .update({
        poste: poste.trim() || null,
        taille_cm: taille ? Number(taille) : null,
        poids_kg: poids ? Number(poids) : null,
        ecole: ecole.trim() || null,
        fb_url: fbUrl.trim() || null,
        ig_url: igUrl.trim() || null,
        tiktok_url: tiktokUrl.trim() || null,
        youtube_url: youtubeUrl.trim() || null,
      })
      .eq('id', profile.id);

    setSaving(false);
    if (!error) {
      setSuccess(true);
      await refreshProfile();
      setTimeout(() => navigate('/'), 1200);
    }
  }

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
        <User className="h-6 w-6 text-ul-green" strokeWidth={1.75} /> {t('profile_edit.title')}
      </h1>

      <div className="card mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">{t('profile_edit.poste')}</label>
          <input
            type="text"
            value={poste}
            onChange={(e) => setPoste(e.target.value)}
            placeholder={t('profile_edit.poste_placeholder') ?? ''}
            className="w-full rounded-lg border border-black/10 bg-ul-white p-2 text-sm focus:border-ul-green focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-neutral-500">{t('profile_edit.taille')}</label>
            <input
              type="number"
              value={taille}
              onChange={(e) => setTaille(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-ul-white p-2 text-sm focus:border-ul-green focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-neutral-500">{t('profile_edit.poids')}</label>
            <input
              type="number"
              value={poids}
              onChange={(e) => setPoids(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-ul-white p-2 text-sm focus:border-ul-green focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">{t('profile_edit.ecole')}</label>
          <input
            type="text"
            value={ecole}
            onChange={(e) => setEcole(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-ul-white p-2 text-sm focus:border-ul-green focus:outline-none"
          />
        </div>
      </div>

      <div className="card mt-4 space-y-3">
        <h2 className="font-heading text-sm font-semibold">{t('profile_edit.social_title')}</h2>
        <input
          type="url"
          value={fbUrl}
          onChange={(e) => setFbUrl(e.target.value)}
          placeholder={t('profile_edit.facebook') ?? ''}
          className="w-full rounded-lg border border-black/10 bg-ul-white p-2 text-sm focus:border-ul-green focus:outline-none"
        />
        <input
          type="url"
          value={igUrl}
          onChange={(e) => setIgUrl(e.target.value)}
          placeholder={t('profile_edit.instagram') ?? ''}
          className="w-full rounded-lg border border-black/10 bg-ul-white p-2 text-sm focus:border-ul-green focus:outline-none"
        />
        <input
          type="url"
          value={tiktokUrl}
          onChange={(e) => setTiktokUrl(e.target.value)}
          placeholder={t('profile_edit.tiktok') ?? ''}
          className="w-full rounded-lg border border-black/10 bg-ul-white p-2 text-sm focus:border-ul-green focus:outline-none"
        />
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder={t('profile_edit.youtube') ?? ''}
          className="w-full rounded-lg border border-black/10 bg-ul-white p-2 text-sm focus:border-ul-green focus:outline-none"
        />
      </div>

      {success && <p className="mt-3 text-center text-sm font-medium text-ul-green">{t('profile_edit.save_success')}</p>}

      <button onClick={handleSave} disabled={saving} className="btn-primary mt-4 w-full disabled:opacity-50">
        {saving ? t('common.loading') : t('common.save')}
      </button>
    </div>
  );
}
