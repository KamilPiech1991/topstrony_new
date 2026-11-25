// Cloudflare Pages Function: formularz kontaktowy.
// Strona stoi na Cloudflare Pages, a zgłoszenia nadal obsługuje Netlify Forms
// (projekt topstrony-2026). POST z formularza przekazujemy do Netlify po stronie serwera.
const NETLIFY_FORMS = 'https://topstrony-2026.netlify.app/';

export async function onRequest(context) {
  const { request, next } = context;
  if (request.method !== 'POST') return next();

  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/x-www-form-urlencoded') && !type.includes('multipart/form-data')) {
    return next();
  }

  const body = new URLSearchParams(await request.formData());
  if (!body.get('form-name')) return next();

  const r = await fetch(NETLIFY_FORMS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    redirect: 'manual',
  });
  const ok = r.status < 400;

  const url = new URL(request.url);
  // Wysyłka przez JS (fetch na "/") — zwracamy sam status.
  if (url.pathname === '/') {
    return new Response(ok ? 'OK' : 'Błąd', { status: ok ? 200 : 502 });
  }
  // Wysyłka bez JS (action="/kontakt/dziekujemy/") — przekierowanie na stronę podziękowania.
  if (!ok) return new Response('Nie udało się wysłać formularza. Zadzwoń: 501 784 882', { status: 502 });
  return Response.redirect(url.origin + url.pathname, 303);
}
