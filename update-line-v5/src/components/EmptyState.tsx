// Structure adaptée d'un composant "empty state" gratuit de HyperUI (hyperui.dev,
// licence MIT) : icône + titre + description, recoloriée avec les tokens de thème
// d'Update Line (ul-vert, ul-blanc...) au lieu des gris fixes de la version d'origine,
// pour suivre automatiquement le thème actif.
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-xs py-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ul-green/10 text-ul-green">
        {icon}
      </div>
      <h3 className="mt-4 font-heading text-sm font-semibold text-ul-black">{title}</h3>
      {description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
