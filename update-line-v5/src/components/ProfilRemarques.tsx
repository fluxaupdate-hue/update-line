import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Remarque {
  id: string;
  contenu: string;
  visible_publiquement: boolean;
  created_at: string;
}

export default function ProfilRemarques({ profileId }: { profileId: string }) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const isStaff = profile?.role === 'coach' || profile?.role === 'admin_centre';

  const [remarques, setRemarques] = useState<Remarque[]>([]);
  const [contenu, setContenu] = useState('');
  const [visiblePublic, setVisiblePublic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profil_remarques')
        .select('id, contenu, visible_publiquement, created_at')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      setRemarques((data as Remarque[]) ?? []);
    }
    load();
  }, [profileId]);

  async function handleAdd() {
    if (!contenu.trim() || !profile) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('profil_remarques')
      .insert({
        profile_id: profileId,
        auteur_id: profile.id,
        contenu: contenu.trim(),
        visible_publiquement: visiblePublic,
      })
      .select('id, contenu, visible_publiquement, created_at')
      .single();
    setSaving(false);
    if (!error && data) {
      setRemarques((prev) => [data as Remarque, ...prev]);
      setContenu('');
      setVisiblePublic(false);
    }
  }

  return (
    <div className="card mt-4">
      <h3 className="font-heading text-sm font-semibold">{t('remarques.title')}</h3>

      {remarques.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">{t('remarques.no_remarques')}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {remarques.map((r) => (
            <li key={r.id} className="rounded-lg bg-ul-gray p-2 text-sm">
              <p>{r.contenu}</p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${
                  r.visible_publiquement ? 'bg-ul-green/10 text-ul-green' : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                {r.visible_publiquement ? t('remarques.public') : t('remarques.private')}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isStaff && (
        <div className="mt-3 border-t border-black/5 pt-3">
          <textarea
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder={t('remarques.content_placeholder') ?? ''}
            rows={2}
            className="w-full rounded-xl border border-black/10 bg-ul-white p-2 text-sm focus:border-ul-green focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-2 text-xs">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={!visiblePublic}
                onChange={() => setVisiblePublic(false)}
                className="accent-[color:var(--color-brand)]"
              />
              {t('remarques.private')}
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={visiblePublic}
                onChange={() => setVisiblePublic(true)}
                className="accent-[color:var(--color-brand)]"
              />
              {t('remarques.public')}
            </label>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !contenu.trim()}
            className="btn-primary mt-2 w-full py-2 text-sm disabled:opacity-50"
          >
            {saving ? t('common.loading') : t('remarques.submit')}
          </button>
        </div>
      )}
    </div>
  );
}
