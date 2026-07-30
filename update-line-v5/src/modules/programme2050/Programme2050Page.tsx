import { useTranslation } from 'react-i18next';
import {
  HeartHandshake, Droplets, Sun, Trophy, Landmark,
  ShieldCheck, Sparkles, Mail, Building2,
} from 'lucide-react';
import LanguageSwitch from '../../components/LanguageSwitch';
import photoAction from '../../assets/programme2050/basket-02.jpeg';
import photoCoachVert from '../../assets/programme2050/basket-05.jpeg';
import photoEquipeMenthe from '../../assets/programme2050/basket-04.jpeg';
import photoCoachNoir from '../../assets/programme2050/basket-03.jpeg';
import photoBanc from '../../assets/programme2050/basket-01.jpeg';

const AXES = [
  { key: 'caritatif', icon: HeartHandshake },
  { key: 'eau', icon: Droplets },
  { key: 'energie', icon: Sun },
  { key: 'basketball', icon: Trophy },
] as const;

const TIMELINE_KEYS = ['timeline_1', 'timeline_2', 'timeline_3', 'timeline_4', 'timeline_5', 'timeline_6'] as const;

export default function Programme2050Page() {
  const { t } = useTranslation();

  // t(key, { returnObjects: true }) renvoie un tableau pour les clés JSON de type liste.
  const visionItems = t('programme2050.vision_items', { returnObjects: true }) as string[];
  const gouvernanceItems = t('programme2050.gouvernance_items', { returnObjects: true }) as string[];
  const impactItems = t('programme2050.impact_items', { returnObjects: true }) as string[];

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-ul-green/10 px-2 py-0.5 text-xs font-medium text-ul-green">
            <Building2 className="h-3 w-3" strokeWidth={1.75} /> {t('programme2050.badge')}
          </span>
          <h1 className="mt-2 font-heading text-2xl font-bold">{t('programme2050.title')}</h1>
          <p className="mt-1 text-sm text-neutral-600">{t('programme2050.subtitle')}</p>
        </div>
        <LanguageSwitch />
      </div>

      <img
        src={photoAction}
        alt="Jeunes basketteuses en match, Cameroun"
        className="mt-4 h-48 w-full rounded-2xl object-cover object-top"
      />

      {/* Présentation */}
      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">{t('programme2050.intro_title')}</h2>
        <p className="mt-2 text-sm text-neutral-700">{t('programme2050.intro_body')}</p>
      </div>

      {/* Vision 25 ans */}
      <div className="card mt-4 border-l-4 border-ul-green">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-ul-green" strokeWidth={1.75} /> {t('programme2050.vision_title')}
        </h2>
        <p className="mt-2 text-sm text-neutral-700">{t('programme2050.vision_body')}</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-700">
          {visionItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <img
          src={photoEquipeMenthe}
          alt="Équipe de jeunes basketteuses encourageant une coéquipière"
          className="mt-3 h-40 w-full rounded-xl object-cover"
        />
      </div>

      {/* Axes d'intervention */}
      <h2 className="mt-6 font-heading text-sm font-semibold text-neutral-500">{t('programme2050.axes_title')}</h2>
      <div className="mt-2 space-y-3">
        {AXES.map(({ key, icon: Icon }) => (
          <div key={key} className="card flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ul-green/10 text-ul-green">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="flex-1">
              <h3 className="font-heading text-sm font-semibold">{t(`programme2050.axe_${key}_title`)}</h3>
              <p className="mt-1 text-sm text-neutral-600">{t(`programme2050.axe_${key}_body`)}</p>
              {key === 'basketball' && (
                <img
                  src={photoCoachNoir}
                  alt="Coach donnant ses consignes à son équipe pendant un tournoi"
                  className="mt-3 h-36 w-full rounded-xl object-cover"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Calendrier 25 ans : timeline verticale */}
      <h2 className="mt-6 font-heading text-sm font-semibold text-neutral-500">{t('programme2050.timeline_title')}</h2>
      <ol className="mt-2 border-l-2 border-ul-green/30 pl-4">
        {TIMELINE_KEYS.map((key, i) => (
          <li key={key} className="relative mb-5 last:mb-0">
            <span className="absolute -left-[21px] flex h-4 w-4 items-center justify-center rounded-full bg-ul-green text-[10px] font-bold text-white">
              {i + 1}
            </span>
            <h3 className="font-heading text-sm font-semibold">{t(`programme2050.${key}_title`)}</h3>
            <p className="mt-1 text-sm text-neutral-600">{t(`programme2050.${key}_body`)}</p>
          </li>
        ))}
      </ol>

      {/* Stratégie de financement */}
      <div className="card mt-6 border-l-4 border-ul-yellow">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold">
          <Landmark className="h-4 w-4" strokeWidth={1.75} /> {t('programme2050.financement_title')}
        </h2>
        <p className="mt-2 text-xs italic text-neutral-500">{t('programme2050.financement_note')}</p>

        <h3 className="mt-3 text-sm font-semibold">{t('programme2050.financement_dons_title')}</h3>
        <p className="mt-1 text-sm text-neutral-600">{t('programme2050.financement_dons_body')}</p>

        <h3 className="mt-3 text-sm font-semibold">{t('programme2050.financement_tontine_title')}</h3>
        <p className="mt-1 text-sm text-neutral-600">{t('programme2050.financement_tontine_body')}</p>

        <h3 className="mt-3 text-sm font-semibold">{t('programme2050.financement_invest_title')}</h3>
        <p className="mt-1 text-sm text-neutral-600">{t('programme2050.financement_invest_body')}</p>
      </div>

      {/* Gouvernance */}
      <div className="card mt-4">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-ul-green" strokeWidth={1.75} /> {t('programme2050.gouvernance_title')}
        </h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-700">
          {gouvernanceItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>

      {/* Impact attendu */}
      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">{t('programme2050.impact_title')}</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-700">
          {impactItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>

      {/* Conclusion */}
      <div className="card mt-4 bg-ul-black text-white">
        <h2 className="font-heading text-sm font-semibold">{t('programme2050.conclusion_title')}</h2>
        <p className="mt-2 text-sm text-neutral-200">{t('programme2050.conclusion_body')}</p>
      </div>

      {/* Galerie */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <img src={photoCoachVert} alt="Coach et joueuses en discussion d'équipe" className="h-32 w-full rounded-xl object-cover" />
        <img src={photoBanc} alt="Jeunes basketteuses encourageant leur équipe depuis le banc" className="h-32 w-full rounded-xl object-cover" />
      </div>

      <a
        href="mailto:contact@programmecameroun2050.org"
        className="btn-primary mt-4 flex items-center justify-center gap-2"
      >
        <Mail className="h-4 w-4" strokeWidth={1.75} /> {t('programme2050.contact_cta')}
      </a>
    </div>
  );
}
