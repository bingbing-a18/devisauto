exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') {
    return {statusCode:405, body:'Method Not Allowed'};
  }

  try {
    const{to, subject, html} = JSON.parse(event.body);
    if(!to || !subject || !html) {
      return {statusCode:400, body:JSON.stringify({error:'Champs manquants'})};
    }

    const res = await fetch('https://api.resend.com/emails', {
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

    const data = await res.json();
    return {
      statusCode: res.ok ? 200 : 400,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    };
  } catch(e) {
    return {statusCode:500, body:JSON.stringify({error:e.message})};
  }
};
