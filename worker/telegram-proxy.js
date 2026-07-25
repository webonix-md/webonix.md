/* Cloudflare Worker — прокси между формами на сайте и Telegram Bot API.
   Токен и chat_id хранятся как секреты воркера (env.TG_BOT_TOKEN, env.TG_CHAT_ID),
   а не в коде сайта — так браузер посетителя их никогда не видит.

   Деплой: Cloudflare Dashboard → Workers & Pages → Create Worker → вставить этот код.
   Секреты: Settings → Variables and Secrets → добавить TG_BOT_TOKEN и TG_CHAT_ID. */

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      return new Response('Invalid JSON', { status: 400 });
    }

    const lines = ['🎯 <b>Новая заявка с сайта</b>', ''];
    if (data.page) lines.push('📄 <b>Источник:</b> ' + data.page);
    if (data.name) lines.push('👤 <b>Имя:</b> ' + data.name);
    if (data.phone) lines.push('📞 <b>Телефон:</b> ' + data.phone);
    if (data.url) lines.push('🔗 <b>Сайт:</b> ' + data.url);
    if (data.message) lines.push('💬 <b>Сообщение:</b> ' + data.message);
    if (data.messenger) lines.push('📩 <b>Мессенджер:</b> ' + data.messenger);

    const tgRes = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TG_CHAT_ID,
        text: lines.join('\n'),
        parse_mode: 'HTML'
      })
    });

    return new Response(JSON.stringify({ ok: tgRes.ok }), {
      status: tgRes.ok ? 200 : 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
