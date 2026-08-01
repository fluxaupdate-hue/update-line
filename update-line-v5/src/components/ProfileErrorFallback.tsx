import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileErrorFallback() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="h-10 w-10 text-ul-red" strokeWidth={1.75} />
      <h1 className="mt-3 font-heading text-lg font-bold">{t('common.profile_error_title')}</h1>
      <p className="mt-2 text-sm text-neutral-600">{t('common.profile_error_body')}</p>
      <button onClick={signOut} className="btn-primary mt-5">
        {t('common.sign_out')}
      </button>
    </div>
  );
}
