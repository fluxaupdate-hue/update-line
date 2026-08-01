import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SignOutButton() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  return (
    <button
      onClick={signOut}
      aria-label={t('common.sign_out') ?? 'Se déconnecter'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-ul-white text-neutral-500"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}
