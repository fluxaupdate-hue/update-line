import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const THEMES = [
  { key: 'afrique_pro', dot: 'bg-emerald-600' },
  { key: 'nuit_pro', dot: 'bg-neutral-900' },
  { key: 'corporate', dot: 'bg-blue-600' },
  { key: 'forest', dot: 'bg-green-800' },
] as const;

export default function ThemeSwitcher() {
  const { t } = useTranslation();
  const { profile, refreshProfile } = useAuth();
  const [active, setActive] = useState<string>('afrique_pro');

  useEffect(() => {
    const stored = localStorage.getItem('update-line-theme') ?? profile?.theme_choisi ?? 'afrique_pro';
    setActive(stored);
    document.documentElement.setAttribute('data-theme', stored);
  }, [profile?.theme_choisi]);

  async function selectTheme(key: string) {
    setActive(key);
    document.documentElement.setAttribute('data-theme', key);
    localStorage.setItem('update-line-theme', key);
    if (profile?.id) {
      await supabase.from('profiles').update({ theme_choisi: key }).eq('id', profile.id);
      refreshProfile();
    }
  }

  return (
    <div className="card">
      <h2 className="font-heading text-sm font-semibold">{t('theme.title')}</h2>
      <p className="mt-1 text-xs text-neutral-500">{t('theme.subtitle')}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {THEMES.map((th) => (
          <button
            key={th.key}
            onClick={() => selectTheme(th.key)}
            className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-colors ${
              active === th.key ? 'border-ul-green bg-ul-green/10' : 'border-black/10'
            }`}
          >
            <span className={`h-5 w-5 shrink-0 rounded-full ${th.dot}`} />
            <span>
              <span className="block text-sm font-medium">{t(`theme.${th.key}`)}</span>
              <span className="block text-xs text-neutral-500">{t(`theme.${th.key}_desc`)}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
