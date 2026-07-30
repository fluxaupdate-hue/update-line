import { useTranslation } from 'react-i18next';
import { Compass, ShieldOff, CheckCircle2, TriangleAlert } from 'lucide-react';

// V1 : conseils statiques qui tournent par jour. Un vrai "IA Mentor" personnalisé nécessite un
// provider IA (ex. Gemini/Groq, comme sur MalihaGroup) branché sur le profil du joueur — étape
// technique distincte, à faire quand ce module sera priorisé.
const TIPS_FR = [
  "Bois de l'eau régulièrement, pas seulement quand tu as soif.",
  'Dors au moins 8h la veille d\'un match ou d\'un entraînement intense.',
  'Un carnet où tu notes tes objectifs de la semaine vaut plus que 10 heures de plus à l\'entraînement.',
  'Le respect de ton coach et de tes coéquipiers se voit avant même ton niveau sur le terrain.',
  "L'école n'est pas un obstacle à ta carrière sportive, c'est ton assurance si elle ne se passe pas comme prévu.",
];
const TIPS_EN = [
  'Drink water regularly, not just when you feel thirsty.',
  'Sleep at least 8 hours the night before a match or intense training.',
  'A notebook where you track your weekly goals is worth more than 10 extra hours of training.',
  'Respect for your coach and teammates shows before your level on the field even does.',
  "School isn't an obstacle to your sports career, it's your safety net if things don't go as planned.",
];

const FORBIDDEN_FR = ['Dopage sous toute forme', 'Faux papiers / fausse date de naissance', 'Abandon scolaire'];
const FORBIDDEN_EN = ['Doping of any kind', 'Fake documents / fake date of birth', 'Dropping out of school'];
const TODO_FR = ['Discipline quotidienne', 'Nutrition équilibrée', 'Sommeil suffisant', 'Respect des autres'];
const TODO_EN = ['Daily discipline', 'Balanced nutrition', 'Enough sleep', 'Respect for others'];

export default function MentorPage() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const tips = isEn ? TIPS_EN : TIPS_FR;
  const dayIndex = new Date().getDate() % tips.length;

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
        <Compass className="h-6 w-6 text-ul-green" strokeWidth={1.75} /> {t('mentor.title')}
      </h1>

      <div className="card mt-4 bg-ul-black text-white">
        <p className="font-heading text-xs uppercase tracking-wide text-ul-yellow">{t('mentor.tip_of_day')}</p>
        <p className="mt-2 text-sm">{tips[dayIndex]}</p>
      </div>

      <div className="card mt-4 border-l-4 border-ul-red">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold text-ul-red">
          <ShieldOff className="h-4 w-4" strokeWidth={1.75} /> {t('mentor.forbidden_title')}
        </h2>
        <ul className="mt-2 list-inside list-disc text-sm text-neutral-700">
          {(isEn ? FORBIDDEN_EN : FORBIDDEN_FR).map((f) => <li key={f}>{f}</li>)}
        </ul>
      </div>

      <div className="card mt-4 border-l-4 border-ul-green">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold text-ul-green">
          <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} /> {t('mentor.todo_title')}
        </h2>
        <ul className="mt-2 list-inside list-disc text-sm text-neutral-700">
          {(isEn ? TODO_EN : TODO_FR).map((f) => <li key={f}>{f}</li>)}
        </ul>
      </div>

      <div className="card mt-4 border-l-4 border-ul-yellow">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold">
          <TriangleAlert className="h-4 w-4" strokeWidth={1.75} /> {t('mentor.scam_warning_title')}
        </h2>
        <p className="mt-2 text-sm text-neutral-700">{t('mentor.scam_warning_body')}</p>
      </div>
    </div>
  );
}
