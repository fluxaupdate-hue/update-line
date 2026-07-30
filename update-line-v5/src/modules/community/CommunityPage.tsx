import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Send, Flag, EyeOff, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { verifierContenu } from '../../lib/moderation';
import EmptyState from '../../components/EmptyState';

interface Post { id: string; contenu: string; created_at: string; auteur_id: string }

export default function CommunityPage() {
  const { t } = useTranslation();
  const { profile, isMinorUser, refreshProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [contenu, setContenu] = useState('');
  const [contenuError, setContenuError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recrutementActive, setRecrutementActive] = useState(profile?.recrutement_active ?? false);
  const [recrutementLink, setRecrutementLink] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<'ok' | 'error' | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  const isStaff = profile?.role === 'coach' || profile?.role === 'admin_centre';

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('mur_club_posts')
        .select('id, contenu, created_at, auteur_id')
        .eq('masque', false)
        .order('created_at', { ascending: false })
        .limit(20);
      setPosts((data as Post[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handlePost() {
    if (!contenu.trim() || !profile?.id) return;

    // Filtre de premier niveau avant publication. Ce n'est pas exhaustif : le signalement
    // et le retrait par le staff (ci-dessous) couvrent ce que ce filtre ne détecte pas.
    const verification = verifierContenu(contenu);
    if (!verification.autorise) {
      setContenuError(t('community.blocked_content') ?? 'Ce message contient des propos non autorisés.');
      return;
    }
    setContenuError(null);

    const { data, error } = await supabase
      .from('mur_club_posts')
      .insert({ centre_id: profile.centre_id, auteur_id: profile.id, contenu: contenu.trim() })
      .select('id, contenu, created_at, auteur_id')
      .single();
    if (!error && data) {
      setPosts((prev) => [data as Post, ...prev]);
      setContenu('');
    }
  }

  async function handleReport(postId: string) {
    if (!profile?.id) return;
    const { error } = await supabase.from('signalements_contenu').insert({
      post_id: postId,
      signale_par: profile.id,
      motif: 'Signalé depuis le mur du club',
    });
    if (!error) setReportedIds((prev) => new Set(prev).add(postId));
  }

  async function handleHide(postId: string) {
    const { error } = await supabase
      .from('mur_club_posts')
      .update({ masque: true, masque_le: new Date().toISOString() })
      .eq('id', postId);
    if (!error) setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function toggleRecrutement() {
    if (!profile?.id) return;
    const next = !recrutementActive;
    setRecrutementActive(next);

    if (next && isMinorUser) {
      // Pour un mineur, l'opt-in du joueur seul n'active rien tant qu'un parent n'a pas
      // confirmé séparément via un lien sécurisé — jamais automatique.
      const token = crypto.randomUUID();
      await supabase.from('profiles').update({ recrutement_active: true, recrutement_token: token }).eq('id', profile.id);
      setRecrutementLink(`${window.location.origin}/consentement/${token}`);
    } else {
      await supabase.from('profiles').update({ recrutement_active: next }).eq('id', profile.id);
      setRecrutementLink(null);
    }
    refreshProfile();
  }

  async function sendRecrutementEmail() {
    if (!recrutementLink || !profile?.parent_email) return;
    setSendingEmail(true);
    setEmailResult(null);
    const { error } = await supabase.functions.invoke('send-consent-email', {
      body: {
        parentEmail: profile.parent_email,
        childName: profile.nom_complet,
        centreName: null,
        consentUrl: recrutementLink,
        type: 'recrutement',
      },
    });
    setSendingEmail(false);
    setEmailResult(error ? 'error' : 'ok');
  }

  if (loading) return <p className="p-6">{t('common.loading')}</p>;

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
        <Users className="h-6 w-6 text-ul-green" strokeWidth={1.75} /> {t('community.title')}
      </h1>

      {profile?.role === 'joueur' && (
        <div className="card mt-4">
          <h2 className="font-heading text-sm font-semibold">{t('community.recruitment_title')}</h2>
          <label className="mt-2 flex items-center justify-between">
            <span className="text-sm">{t('community.recruitment_toggle')}</span>
            <input
              type="checkbox"
              checked={recrutementActive}
              onChange={toggleRecrutement}
              className="h-5 w-5 accent-[color:var(--color-brand)]"
            />
          </label>
          <p className="mt-1 text-xs text-neutral-500">{t('community.recruitment_hint')}</p>
          {isMinorUser && (
            <p className="mt-1 text-xs text-ul-yellow">{t('community.recruitment_minor_notice')}</p>
          )}
          {recrutementLink && (
            <div className="mt-2 rounded-lg bg-ul-yellow/10 border border-ul-yellow/40 p-2">
              <p className="break-all font-mono text-xs">{recrutementLink}</p>
              <div className="mt-2 flex gap-2">
                {profile?.parent_email && (
                  <button
                    onClick={sendRecrutementEmail}
                    disabled={sendingEmail}
                    className="flex items-center gap-1 text-xs font-medium text-ul-green underline disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" strokeWidth={1.75} />
                    {sendingEmail ? t('common.loading') : t('auth.send_by_email')}
                  </button>
                )}
                <button
                  onClick={() => navigator.clipboard.writeText(recrutementLink)}
                  className="text-xs font-medium text-neutral-600 underline"
                >
                  {t('auth.copy_link')}
                </button>
              </div>
              {emailResult === 'ok' && <p className="mt-1 text-xs text-ul-green">{t('auth.email_sent')}</p>}
            </div>
          )}
        </div>
      )}

      <div className="card mt-4">
        <h2 className="font-heading text-sm font-semibold">{t('community.wall_title')}</h2>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            placeholder={t('community.wall_placeholder') ?? ''}
            value={contenu}
            onChange={(e) => { setContenu(e.target.value); setContenuError(null); }}
            className="flex-1 rounded-lg border border-black/10 p-2 text-sm"
          />
          <button onClick={handlePost} className="btn-primary px-3 text-sm">{t('community.post')}</button>
        </div>
        {contenuError && <p className="mt-1 text-xs text-ul-red">{contenuError}</p>}

        {posts.length === 0 ? (
          <EmptyState icon={<MessageSquare className="h-6 w-6" strokeWidth={1.75} />} title={t('community.no_posts')} />
        ) : (
          <ul className="mt-3 space-y-2">
            {posts.map((p) => (
              <li key={p.id} className="rounded-lg bg-ul-gray p-2 text-sm">
                <p>{p.contenu}</p>
                <div className="mt-1 flex gap-3">
                  {profile?.id !== p.auteur_id && (
                    <button
                      onClick={() => handleReport(p.id)}
                      disabled={reportedIds.has(p.id)}
                      className="flex items-center gap-1 text-xs text-neutral-500 disabled:opacity-50"
                    >
                      <Flag className="h-3 w-3" strokeWidth={1.75} />
                      {reportedIds.has(p.id) ? t('community.reported') : t('community.report')}
                    </button>
                  )}
                  {(isStaff || profile?.id === p.auteur_id) && (
                    <button
                      onClick={() => handleHide(p.id)}
                      className="flex items-center gap-1 text-xs text-ul-red"
                    >
                      <EyeOff className="h-3 w-3" strokeWidth={1.75} />
                      {t('community.hide')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
