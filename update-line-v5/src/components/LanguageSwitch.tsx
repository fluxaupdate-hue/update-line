import { useTranslation } from 'react-i18next';

export default function LanguageSwitch() {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith('en') ? 'en' : 'fr';

  function toggle() {
    const next = current === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Switch language / Changer de langue"
      className="flex items-center gap-1 rounded-full border border-black/10 bg-ul-white px-3 py-1.5
                 text-sm font-heading font-semibold text-ul-black shadow-sm active:scale-95 transition-transform"
    >
      <span className={current === 'fr' ? 'opacity-100' : 'opacity-40'}>FR</span>
      <span className="opacity-30">/</span>
      <span className={current === 'en' ? 'opacity-100' : 'opacity-40'}>EN</span>
    </button>
  );
}
