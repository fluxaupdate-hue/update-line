import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function AvatarUpload({ size = 64 }: { size?: number }) {
  const { t } = useTranslation();
  const { profile, refreshProfile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    setError(null);

    if (file.size > MAX_SIZE_BYTES) {
      setError(t('photo.too_large'));
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t('photo.wrong_type'));
      return;
    }

    setUploading(true);

    // Convention de nommage : {user_id}/avatar.{ext} — c'est ce que vérifient les policies
    // Storage RLS pour garantir que chacun ne peut modifier QUE son propre fichier.
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (uploadError) {
      setUploading(false);
      setError(t('photo.error'));
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
    // Cache-buster pour forcer le rafraîchissement de l'image affichée après remplacement
    const photoUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ photo_url: photoUrl })
      .eq('id', profile.id);

    setUploading(false);
    if (profileError) {
      setError(t('photo.error'));
      return;
    }
    refreshProfile();
  }

  return (
    <div className="relative inline-block">
      <img
        src={profile?.photo_url ?? `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.nom_complet ?? '?'}`}
        alt={profile?.nom_complet ?? 'Avatar'}
        style={{ width: size, height: size }}
        className="rounded-full border-2 border-ul-green object-cover"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={t('photo.change') ?? 'Changer la photo'}
        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-ul-black text-white shadow disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" strokeWidth={2} />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p className="absolute top-full mt-1 w-40 text-xs text-ul-red">{error}</p>}
    </div>
  );
}
