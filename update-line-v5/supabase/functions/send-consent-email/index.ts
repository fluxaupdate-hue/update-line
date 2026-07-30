// Supabase Edge Function : envoie un vrai email (via Resend) au parent avec le lien de
// consentement, au lieu de compter uniquement sur le bouton "mailto" côté client.
//
// Déploiement :
//   1. Créer un compte gratuit sur https://resend.com (100 emails/jour gratuits, largement
//      suffisant pour démarrer)
//   2. Récupérer une clé API Resend
//   3. supabase secrets set RESEND_API_KEY=re_xxxxxxxx
//   4. supabase functions deploy send-consent-email
//
// Le front-end appelle cette fonction avec supabase.functions.invoke('send-consent-email', ...)
// Si RESEND_API_KEY n'est pas configuré, la fonction répond une erreur claire et le front-end
// bascule sur le lien "mailto" existant (voir PendingConsentPage.tsx) — rien n'est cassé
// tant que l'email n'est pas configuré, c'est juste moins automatique.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('CONSENT_EMAIL_FROM') ?? 'Update Line <onboarding@resend.dev>';

interface RequestBody {
  parentEmail: string;
  childName: string;
  centreName: string | null;
  consentUrl: string;
  type: 'consentement' | 'recrutement';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'RESEND_API_KEY non configuré côté serveur.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { parentEmail, childName, centreName, consentUrl, type }: RequestBody = await req.json();

    const subject =
      type === 'recrutement'
        ? `${childName} souhaite activer le mode Recruteur sur Update Line`
        : `${childName} s'inscrit sur Update Line`;

    const body =
      type === 'recrutement'
        ? `<p>Bonjour,</p><p><strong>${childName}</strong> souhaite rendre son profil visible aux recruteurs vérifiés sur Update Line.</p><p>Pour valider ou refuser cette demande, ouvrez ce lien sécurisé :</p><p><a href="${consentUrl}">${consentUrl}</a></p>`
        : `<p>Bonjour,</p><p><strong>${childName}</strong> souhaite s'inscrire sur Update Line via le centre <strong>${centreName ?? '—'}</strong>.</p><p>Aucune donnée ni fonctionnalité n'est accessible tant que vous n'avez pas confirmé votre accord. Ouvrez ce lien sécurisé pour confirmer :</p><p><a href="${consentUrl}">${consentUrl}</a></p>`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [parentEmail],
        subject,
        html: body,
      }),
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text();
      return new Response(JSON.stringify({ error: errText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
