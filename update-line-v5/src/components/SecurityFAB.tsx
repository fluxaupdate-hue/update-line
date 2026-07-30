import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function SecurityFAB() {
  const { t } = useTranslation();
  const location = useLocation();

  // Ne pas l'afficher sur la page de signalement elle-même, ni sur les pages publiques
  const hiddenOn = ['/security', '/login', '/signup', '/signup-centre', '/signup-recruteur', '/pending-consent'];
  if (hiddenOn.some((path) => location.pathname.startsWith(path)) || location.pathname.startsWith('/consentement')) {
    return null;
  }

  return (
    <Link
      to="/security"
      aria-label={t('nav.security') ?? 'Sécurité'}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ul-red text-white shadow-lg active:scale-95 transition-transform"
    >
      <ShieldAlert className="h-6 w-6" strokeWidth={2} />
    </Link>
  );
}
