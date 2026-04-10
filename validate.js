import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://pppwgezgbgnaqjjgnqic.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcHdnZXpnYmduYXFqamducWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MjA4NzMsImV4cCI6MjA5MTI5Njg3M30.B0ku4RTichsI5HR5CKWUW8lY6h_vlieobevAhfhQKAg';

export default async function handler(req, res) {
  const { id, action, token } = req.query;

  if (!id || !action || !token) {
    return res.status(400).send('<h2>Lien invalide</h2>');
  }

  // Verify token
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    if (decoded !== id + '_' + action) {
      return res.status(403).send('<h2>Lien invalide ou expiré</h2>');
    }
  } catch(e) {
    return res.status(403).send('<h2>Lien invalide</h2>');
  }

  const db = createClient(SUPABASE_URL, SUPABASE_KEY);

  const statut = action === 'accepte' ? 'Accepté' : 'Refusé';
  const validation = action === 'accepte' ? 'accepte' : 'refuse';

  const { error } = await db.from('devis')
    .update({ statut, validation })
    .eq('id', id);

  if (error) {
    return res.status(500).send('<h2>Erreur lors de la mise à jour</h2>');
  }

  const isAccept = action === 'accepte';
  const color = isAccept ? '#059669' : '#dc2626';
  const icon = isAccept ? '✅' : '❌';
  const msg = isAccept ? 'Devis accepté !' : 'Devis refusé.';
  const desc = isAccept
    ? 'Votre accord a bien été enregistré. Le garage va vous contacter prochainement.'
    : 'Votre refus a bien été enregistré. N\'hésitez pas à contacter le garage pour toute question.';

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
