// Structure adaptée d'un composant "stat card" gratuit de HyperUI (hyperui.dev, licence MIT) :
// icône dans un cercle coloré + valeur + libellé. Recoloriée avec les tokens de thème
// d'Update Line et Lucide au lieu des icônes SVG génériques de la version d'origine.
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
}

export default function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <article className="card flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ul-green/10 text-ul-green">
        {icon}
      </span>
      <div>
        <p className="font-heading text-xl font-bold text-ul-black">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
      </div>
    </article>
  );
}
