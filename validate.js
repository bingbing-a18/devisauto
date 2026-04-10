const SUPABASE_URL = 'https://pppwgezgbgnaqjjgnqic.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcHdnZXpnYmduYXFqamducWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MjA4NzMsImV4cCI6MjA5MTI5Njg3M30.B0ku4RTichsI5HR5CKWUW8lY6h_vlieobevAhfhQKAg';
const RESEND_KEY = 're_MsaweGbq_7zfidg3B5dD8VNkam6Kypea3';

export default async function handler(req, res) {
  const { id, action, token } = req.query;

  if (!id || !action || !token) {
    return res.status(400).send('<h2>Lien invalide</h2>');
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString();
    if (decoded !== id + '_' + action) {
      return res.status(403).send('<h2>Lien invalide ou expiré</h2>');
    }
  } catch(e) {
    return res.status(403).send('<h2>Lien invalide</h2>');
  }

  const { createClient } = await import('@supabase/supabase-js');
  const db = createClient(SUPABASE_URL, SUPABASE_KEY);

  const statut = action === 'accepte' ? 'Accepté' : 'Refusé';
  const validation = action === 'accepte' ? 'accepte' : 'refuse';

  // Update devis
  const { data: devis, error } = await db.from('devis')
    .update({ statut, validation })
    .eq('id', id)
    .select('*, profiles(email, garage_name)')
    .single();

  if (error) {
    return res.status(500).send('<h2>Erreur lors de la mise à jour</h2>');
  }

  // Get garage owner email via user_id
  const { data: profile } = await db.from('profiles')
    .select('email, garage_name')
    .eq('id', devis.user_id)
    .single();

  // Send notification email to garage owner
  if (profile?.email) {
    const isAccept = action === 'accepte';
    const icon = isAccept ? '✅' : '❌';
    const actionText = isAccept ? 'accepté' : 'refusé';
    const color = isAccept ? '#059669' : '#dc2626';
    const bg = isAccept ? '#f0fdf4' : '#fef2f2';
    const border = isAccept ? '#bbf7d0' : '#fecaca';

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + RESEND_KEY
      },
      body: JSON.stringify({
        from: 'DevisAuto <onboarding@resend.dev>',
        to: [profile.email],
        subject: icon + ' Devis ' + (devis.numero || '') + ' — ' + actionText + ' par ' + (devis.client_name || 'le client'),
        html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
          <div style="background:#0f1623;padding:20px 24px;border-radius:10px 10px 0 0">
            <h1 style="color:white;margin:0;font-size:18px">DevisAuto</h1>
            <p style="color:#94a3b8;margin:4px 0 0;font-size:12px">Notification en temps réel</p>
          </div>
          <div style="background:${bg};border:1px solid ${border};border-radius:0 0 10px 10px;padding:28px 24px">
            <div style="font-size:48px;text-align:center;margin-bottom:16px">${icon}</div>
            <h2 style="color:${color};text-align:center;margin:0 0 16px;font-size:22px">
              Devis ${actionText} !
            </h2>
            <div style="background:white;border:1px solid #e2e5ea;border-radius:8px;padding:16px;margin-bottom:16px">
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:6px 0;font-size:13px;color:#6b7280">N° Devis</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#0f1623;text-align:right">${devis.numero || '—'}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#6b7280">Client</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#0f1623;text-align:right">${devis.client_name || '—'}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#6b7280">Véhicule</td><td style="padding:6px 0;font-size:13px;color:#374151;text-align:right">${[devis.veh_brand, devis.veh_model, devis.veh_plate].filter(Boolean).join(' ')}</td></tr>
                <tr style="border-top:2px solid #e2e5ea"><td style="padding:10px 0 0;font-size:14px;font-weight:700;color:#0f1623">Total TTC</td><td style="padding:10px 0 0;font-size:18px;font-weight:800;color:#ea580c;text-align:right">${(devis.total_ttc || 0).toLocaleString('fr-FR', {minimumFractionDigits:2})} €</td></tr>
              </table>
            </div>
            <p style="font-size:13px;color:#4b5563;text-align:center;margin:0">
              Connectez-vous sur <a href="https://devisauto.vercel.app" style="color:#ea580c;font-weight:700">DevisAuto</a> pour voir le détail.
            </p>
          </div>
        </div>`
      })
    });
  }

  const isAccept = action === 'accepte';
  const color = isAccept ? '#059669' : '#dc2626';
  const icon = isAccept ? '✅' : '❌';
  const msg = isAccept ? 'Devis accepté !' : 'Devis refusé.';
  const desc = isAccept
    ? 'Votre accord a bien été enregistré. Le garage va vous contacter prochainement.'
    : "Votre refus a bien été enregistré. N'hésitez pas à contacter le garage pour toute question.";

  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${msg}</title>
      <style>
        body{font-family:Arial,sans-serif;background:#f4f5f7;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
        .card{background:white;border-radius:16px;padding:48px 40px;max-width:440px;width:90%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.1)}
        .icon{font-size:56px;margin-bottom:16px}
        h1{color:${color};font-size:24px;margin:0 0 12px}
        p{color:#4b5563;font-size:15px;line-height:1.6;margin:0}
        .brand{margin-top:28px;font-size:12px;color:#9ca3af}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">${icon}</div>
        <h1>${msg}</h1>
        <p>${desc}</p>
        <div class="brand">DevisAuto</div>
      </div>
    </body>
    </html>
  `);
}
