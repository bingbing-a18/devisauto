export default async function handler(req, res) {
  if(req.method !== 'POST') {
    return res.status(405).json({error:'Method Not Allowed'});
  }
  try {
    const{to, subject, html} = req.body;
    if(!to || !subject || !html) {
      return res.status(400).json({error:'Champs manquants'});
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer re_MsaweGbq_7zfidg3B5dD8VNkam6Kypea3'
      },
      body: JSON.stringify({
        from: 'DevisAuto <onboarding@resend.dev>',
        to: [to],
        subject,
        html
      })
    });
    const data = await response.json();
    return res.status(response.ok ? 200 : 400).json(data);
  } catch(e) {
    return res.status(500).json({error: e.message});
  }
}
