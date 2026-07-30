import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Upload, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Conformite {
  id: string;
  verification_antecedents_statut: string;
  formation_protection_enfance_statut: string;
  code_conduite_signe: boolean;
  code_conduite_signe_le: string | null;
  document_antecedents_url: string | null;
  document_formation_url: string | null;
  autorise_contact_mineurs: boolean;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  valide: <CheckCircle2 className="h-4 w-4 text-ul-green" strokeWidth={1.75} />,
  en_attente: <Clock className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />,
  expire: <XCircle className="h-4 w-4 text-ul-red" strokeWidth={1.75} />,
  refuse: <XCircle className="h-4 w-4 text-ul-red" strokeWidth={1.75} />,
  suspendu: <XCircle className="h-4 w-4 text-ul-red" strokeWidth={1.75} />,
};

export default function ConformitePage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [record, setRecord] = useState<Conformite | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<'antecedents' | 'formation' | null>(null);
  const antecedentsInputRef = useRef<HTMLInputElement>(null);
  const formationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('staff_conformite')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (data) {
        setRecord(data as Conformite);
      } else {
        // Première visite : on crée la ligne vide pour ce coach
        const { data: created } = await supabase
          .from('staff_conformite')
          .insert({ profile_id: profile.id, centre_id: profile.centre_id })
          .select('*')
          .single();
        setRecord(created as Conformite);
      }
      setLoading(false);
    }
    load();
  }, [profile?.id, profile?.centre_id]);

  async function handleUpload(type: 'antecedents' | 'formation', file: File) {
    if (!profile?.id || !record) return;
    setUploading(type);

    const path = `${profile.id}/${type}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('conformite-docs').upload(path, file);
    if (uploadError) {
      setUploading(null);
      return;
    }

    const field = type === 'antecedents' ? 'document_antecedents_url' : 'document_formation_url';
    const { data, error } = await supabase
      .from('staff_conformite')
      .update({ [field]: path })
      .eq('id', record.id)
      .select('*')
      .single();

    setUploading(null);
    if (!error && data) setRecord(data as Conformite);
  }

  async function signerCodeConduite() {
    if (!record) return;
    const { data, error } = await supabase
      .from('staff_conformite')
      .update({ code_conduite_signe: true, code_conduite_signe_le: new Date().toISOString() })
      .eq('id', record.id)
      .select('*')
      .single();
    if (!error && data) setRecord(data as Conformite);
  }

  if (loading || !record) return <p className="p-6">{t('common.loading')}</p>;

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
        <ShieldCheck className="h-6 w-6 text-ul-green" strokeWidth={1.75} /> {t('conformite.title')}
      </h1>
      <p className="mt-1 text-sm text-neutral-600">{t('conformite.subtitle')}</p>

      <div className={`card mt-4 ${record.autorise_contact_mineurs ? 'border-l-4 border-ul-green' : 'border-l-4 border-ul-yellow'}`}>
        <p className="font-heading text-sm font-semibold">{t('conformite.autorise_title')}</p>
        <p className={`mt-1 text-sm ${record.autorise_contact_mineurs ? 'text-ul-green' : 'text-neutral-600'}`}>
          {record.autorise_contact_mineurs ? t('conformite.autorise_yes') : t('conformite.autorise_no')}
        </p>
      </div>

      {/* Antécédents */}
      <div className="card mt-4">
        <div className="flex items-center justify-between">
          <p className="font-heading text-sm font-semibold">{t('conformite.antecedents_title')}</p>
          <span className="flex items-center gap-1 text-xs">
            {STATUS_ICON[record.verification_antecedents_statut]}
            {t(`conformite.status_${record.verification_antecedents_statut}`)}
          </span>
        </div>
        {record.document_antecedents_url ? (
          <p className="mt-2 text-xs text-neutral-500">{t('conformite.document_uploaded')}</p>
        ) : (
          <button
            onClick={() => antecedentsInputRef.current?.click()}
            disabled={uploading === 'antecedents'}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-ul-green underline disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
            {uploading === 'antecedents' ? t('common.loading') : t('conformite.upload_document')}
          </button>
        )}
        <input
          ref={antecedentsInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleUpload('antecedents', e.target.files[0])}
        />
      </div>

      {/* Formation */}
      <div className="card mt-4">
        <div className="flex items-center justify-between">
          <p className="font-heading text-sm font-semibold">{t('conformite.formation_title')}</p>
          <span className="flex items-center gap-1 text-xs">
            {STATUS_ICON[record.formation_protection_enfance_statut]}
            {t(`conformite.status_${record.formation_protection_enfance_statut}`)}
          </span>
        </div>
        {record.document_formation_url ? (
          <p className="mt-2 text-xs text-neutral-500">{t('conformite.document_uploaded')}</p>
        ) : (
          <button
            onClick={() => formationInputRef.current?.click()}
            disabled={uploading === 'formation'}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-ul-green underline disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
            {uploading === 'formation' ? t('common.loading') : t('conformite.upload_document')}
          </button>
        )}
        <input
          ref={formationInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleUpload('formation', e.target.files[0])}
        />
      </div>

      {/* Code de conduite */}
      <div className="card mt-4">
        <p className="font-heading text-sm font-semibold">{t('conformite.code_conduite_title')}</p>
        {record.code_conduite_signe ? (
          <p className="mt-2 flex items-center gap-1 text-sm text-ul-green">
            <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
            {t('conformite.signed_on')} {record.code_conduite_signe_le?.slice(0, 10)}
          </p>
        ) : (
          <button onClick={signerCodeConduite} className="btn-primary mt-2 w-full py-2 text-sm">
            {t('conformite.sign_code')}
          </button>
        )}
      </div>
    </div>
  );
}
