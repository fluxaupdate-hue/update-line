import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitch from '../components/LanguageSwitch';

export default function PendingConsentPage() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<'ok' | 'error' | null>(null);
  const [centreName, setCentreName] = useState<string | null>(null);

  useEffect(() => {
    async function loadCentre() {
      if (!profile?.centre_id) return;
      const { data } = await supabase.from('centres').select('nom').eq('id', profile.centre_id).single();
      if (data) setCentreName(data.nom);
    }
    loadCentre();
  }, [profile?.centre_id]);

  const consentUrl = profile?.consent_token
    ? `${window.location.origin}/consentement/${profile.consent_token}`
    : null;

  function copyLink() {
    if (!consentUrl) return;
    navigator.clipboard.writeText(consentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendAutomatically() {
    if (!consentUrl || !profile?.parent_email) return;
    setSending(true);
    setSendResult(null);
    const { error } = await supabase.functions.invoke('send-consent-email', {
      body: {
        parentEmail: profile.parent_email,
        childName: profile.nom_complet,
        centreName,
        consentUrl,
        type: 'consentement',
      },
    });
    setSending(false);
    setSendResult(error ? 'error' : 'ok');
  }

  const mailtoHref = consentUrl
    ? `mailto:${profile?.parent_email ?? ''}?subject=${encodeURIComponent('Confirmation Update Line')}&body=${encodeURIComponent(
        `Bonjour,\n\n${profile?.nom_complet} souhaite s'inscrire sur Update Line. Merci de confirmer votre accord en ouvrant ce lien :\n${consentUrl}\n\nMerci !`
      )}`
    : '#';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ul-gray px-6 text-center">
      <div className="absolute right-4 top-4">
        <LanguageSwitch />
      </div>
      <div className="card max-w-sm border-l-4 border-ul-yellow">
        <h1 className="font-heading text-xl font-bold">{t('auth.consent_pending_title')}</h1>
        <p className="mt-3 text-sm text-neutral-700">{t('auth.consent_pending_body')}</p>

        {consentUrl && (
          <>
            {profile?.parent_email && (
              <button
                onClick={sendAutomatically}
                disabled={sending}
                className="btn-primary mt-3 flex w-full items-center justify-center gap-2 py-2 text-sm disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" strokeWidth={1.75} />}
                {sending ? t('common.loading') : t('auth.send_by_email')}
              </button>
            )}
            {sendResult === 'ok' && (
              <p className="mt-2 text-xs text-ul-green">{t('auth.email_sent')}</p>
            )}
            {sendResult === 'error' && (
              <p className="mt-2 text-xs text-neutral-500">{t('auth.email_not_configured')}</p>
            )}

            <p className="mt-3 break-all rounded-lg bg-ul-gray px-3 py-2 font-mono text-xs text-ul-black">
              {consentUrl}
            </p>
            <div className="mt-3 flex gap-2">
              <button onClick={copyLink} className="flex-1 rounded-xl border border-ul-green py-2 text-center text-sm font-heading font-semibold text-ul-green">
                {copied ? t('auth.copied') : t('auth.copy_link')}
              </button>
              <a href={mailtoHref} className="flex-1 rounded-xl bg-ul-black py-2 text-center text-sm font-heading font-semibold text-white">
                mailto
              </a>
            </div>
          </>
        )}

        <p className="mt-4 text-xs text-neutral-500">{t('auth.consent_pending_footer')}</p>
      </div>
      <button onClick={signOut} className="mt-6 text-sm text-neutral-500 underline">
        Se déconnecter
      </button>
    </div>
  );
}
