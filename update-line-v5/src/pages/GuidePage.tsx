import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Home, CloudSun, ShieldAlert, MapPin, GraduationCap, Plane, Compass, Users } from 'lucide-react';
import LanguageSwitch from '../components/LanguageSwitch';
import ThemeSwitcher from '../components/ThemeSwitcher';

const SECTION_KEYS = [
  'dashboard', 'wellness', 'security', 'club', 'school', 'opportunities', 'mentor', 'community',
] as const;

const SECTION_ICON: Record<(typeof SECTION_KEYS)[number], React.ReactNode> = {
  dashboard: <Home className="h-6 w-6" strokeWidth={1.75} />,
  wellness: <CloudSun className="h-6 w-6" strokeWidth={1.75} />,
  security: <ShieldAlert className="h-6 w-6" strokeWidth={1.75} />,
  club: <MapPin className="h-6 w-6" strokeWidth={1.75} />,
  school: <GraduationCap className="h-6 w-6" strokeWidth={1.75} />,
  opportunities: <Plane className="h-6 w-6" strokeWidth={1.75} />,
  mentor: <Compass className="h-6 w-6" strokeWidth={1.75} />,
  community: <Users className="h-6 w-6" strokeWidth={1.75} />,
};

export default function GuidePage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t('guide.title')}</h1>
        <LanguageSwitch />
      </div>
      <p className="mt-2 text-sm text-neutral-600">{t('guide.intro')}</p>

      <div className="mt-4">
        <ThemeSwitcher />
      </div>

      <div className="mt-5 space-y-3">
        {SECTION_KEYS.map((key) => (
          <div key={key} className="card flex gap-3">
            <span className="text-ul-green">{SECTION_ICON[key]}</span>
            <div>
              <h2 className="font-heading text-sm font-semibold">{t(`guide.sections.${key}.title`)}</h2>
              <p className="mt-1 text-sm text-neutral-600">{t(`guide.sections.${key}.body`)}</p>
            </div>
          </div>
        ))}
      </div>

      <Link to="/" className="btn-primary mt-6 block w-full text-center">
        ← {t('nav.dashboard')}
      </Link>
    </div>
  );
}
