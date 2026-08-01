import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CloudSun, MapPin, BarChart3, GraduationCap, Plane, Compass, Users, Settings, BookOpen, ShieldCheck, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitch from '../../components/LanguageSwitch';
import SignOutButton from '../../components/SignOutButton';
import ProfilRemarques from '../../components/ProfilRemarques';
import AvatarUpload from '../../components/AvatarUpload';

const today = () => new Date().toISOString().slice(0, 10);

export default function DashboardPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [wellnessDoneToday, setWellnessDoneToday] = useState<boolean | null>(null);
  const [exploreOpen, setExploreOpen] = useState(false);

  useEffect(() => {
    async function check() {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('wellness_checkins')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('date_checkin', today())
        .maybeSingle();
      setWellnessDoneToday(!!data);
    }
    check();
  }, [profile?.id]);

  if (!profile) return <p className="p-6">{t('common.loading')}</p>;

  return (
    <div className="mx-auto max-w-md p-4 pb-28">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">{t('app.slogan')}</p>
          <h1 className="font-heading text-2xl font-bold">
            {t('dashboard.welcome', { name: profile.nom_complet.split(' ')[0] })}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <SignOutButton />
        </div>
      </div>

      <div className="card mt-5 flex items-center gap-4">
        <AvatarUpload size={64} />
        <div className="flex-1">
          <p className="font-heading font-semibold">{profile.nom_complet}</p>
          <p className="text-sm text-neutral-500">
            {profile.poste ?? '—'} · {profile.agent_libre ? 'Agent libre' : profile.ecole ?? '—'}
          </p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              profile.verifie_par_centre ? 'bg-ul-green/10 text-ul-green' : 'bg-neutral-200 text-neutral-500'
            }`}
          >
            {profile.verifie_par_centre ? t('dashboard.verified') : t('dashboard.not_verified')}
          </span>
        </div>
        <div className="text-right">
          <p className="font-heading text-xs text-neutral-400">XP</p>
          <p className="font-heading text-lg font-bold text-ul-green">{profile.xp_total}</p>
        </div>
      </div>

      {/* --- AUJOURD'HUI : ce qui compte vraiment, en priorité --- */}
      {profile.role === 'joueur' && (
        <>
          <h2 className="mt-6 font-heading text-sm font-semibold text-neutral-500">{t('dashboard.today_title')}</h2>

          {wellnessDoneToday === false && (
            <Link to="/wellness" className="card mt-2 flex items-center gap-3 border-l-4 border-ul-green">
              <CloudSun className="h-7 w-7 shrink-0 text-ul-green" strokeWidth={1.75} />
              <div>
                <p className="font-heading text-sm font-semibold">{t('dashboard.wellness_cta')}</p>
                <p className="text-xs text-neutral-500">{t('dashboard.wellness_cta_sub')}</p>
              </div>
            </Link>
          )}

          <Link to="/club" className="card mt-2 flex items-center gap-3 border-l-4 border-ul-yellow">
            <MapPin className="h-7 w-7 shrink-0 text-ul-yellow" strokeWidth={1.75} />
            <div>
              <p className="font-heading text-sm font-semibold">{t('dashboard.presence_cta')}</p>
              <p className="text-xs text-neutral-500">{t('dashboard.presence_cta_sub')}</p>
            </div>
          </Link>
        </>
      )}

      {/* --- EXPLORER : tout le reste, replié par défaut pour ne pas noyer l'essentiel --- */}
      <button
        onClick={() => setExploreOpen((v) => !v)}
        className="mt-6 flex w-full items-center justify-between font-heading text-sm font-semibold text-neutral-500"
      >
        {t('dashboard.explore_title')}
        <span>{exploreOpen ? '▲' : '▼'}</span>
      </button>

      {exploreOpen && (
        <div className="mt-2 grid grid-cols-2 gap-3">
          <QuickLink to="/stats" labelKey="nav.stats" icon={<BarChart3 className="h-5 w-5" strokeWidth={1.75} />} />
          <QuickLink to="/school" labelKey="nav.school" icon={<GraduationCap className="h-5 w-5" strokeWidth={1.75} />} />
          <QuickLink to="/opportunities" labelKey="nav.opportunities" icon={<Plane className="h-5 w-5" strokeWidth={1.75} />} />
          <QuickLink to="/mentor" labelKey="nav.mentor" icon={<Compass className="h-5 w-5" strokeWidth={1.75} />} />
          <QuickLink to="/community" labelKey="nav.community" icon={<Users className="h-5 w-5" strokeWidth={1.75} />} />
          <QuickLink to="/programme-2050" labelKey="programme2050.nav_label" icon={<Building2 className="h-5 w-5" strokeWidth={1.75} />} />
          {profile.role === 'admin_centre' && (
            <QuickLink to="/admin" labelKey="nav.admin" icon={<Settings className="h-5 w-5" strokeWidth={1.75} />} />
          )}
          {profile.role === 'coach' && (
            <QuickLink to="/conformite" labelKey="conformite.title" icon={<ShieldCheck className="h-5 w-5" strokeWidth={1.75} />} />
          )}
        </div>
      )}

      <Link to="/guide" className="card mt-4 flex items-center justify-between text-ul-green">
        <span className="flex items-center gap-2 font-heading text-sm font-semibold">
          <BookOpen className="h-4 w-4" strokeWidth={1.75} /> {t('guide.open_guide')}
        </span>
        <span>→</span>
      </Link>

      {profile.role === 'joueur' && <ProfilRemarques profileId={profile.id} />}
    </div>
  );
}

function QuickLink({ to, labelKey, icon }: { to: string; labelKey: string; icon: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <Link to={to} className="card flex items-center gap-2">
      {icon}
      <span className="font-heading text-sm font-semibold">{t(labelKey)}</span>
    </Link>
  );
}
