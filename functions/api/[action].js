// Cloudflare Pages Function: backend konsultanta AI (/api/summary, /api/chat, /api/lead).
// Port worker.js z paczki topstrony-wycena-ai: działa na tej samej domenie co strona, bez osobnego Workera i CORS.
// Zmienne w Cloudflare Pages → topstrony → Settings → Variables and secrets:
//   ANTHROPIC_API_KEY (sekret) – podsumowanie i odpowiedzi AI; bez niego widget używa podsumowania z szablonu
//   RESEND_API_KEY (sekret, opcjonalnie) – e-mail z leadem; bez niego lead idzie przez Netlify Forms (formularz „wycena”)
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (opcjonalnie)
//   LEAD_TO, LEAD_FROM, MODEL (opcjonalnie)
const ALLOWED = ['https://topstrony.pl', 'https://www.topstrony.pl'];
const NETLIFY_FORMS = 'https://topstrony-2026.netlify.app/';

const KNOWLEDGE = `
Firma: top.strony (Qamitech Kamil Piech), agencja marketingowa z Piaseczna (ul. Strusia). Tel. 501 784 882, biuro@topstrony.pl, pon.–pt. 9:00–20:00, odpowiedź w 24 h.
Mała agencja: projekt prowadzi Kamil Piech (strategia, SEO, kampanie) ze stałymi specjalistami od grafiki, treści i programowania. 8 lat w IT i marketingu, 35 projektów stron i sklepów, ocena 5,0 w Google (20 opinii). Certyfikaty/kursy: Karol Dziedzic, Daniel Boss, WhitePress, Senuto.
Pracujemy z firmami z Piaseczna, Warszawy i okolic (spotkania na miejscu) oraz zdalnie z całej Polski.

Usługi:
1. Strony internetowe – strony firmowe, wizytówki, landing page, redesign, opieka techniczna. Astro (szybsze, bezpieczniejsze, lepiej się pozycjonują) albo lekki WordPress na czystym motywie (gdy klient chce sam edytować). Bez ciężkich page builderów. Czas: zwykle 1–3 tygodnie.
2. Sklepy e-commerce – WooCommerce i Shopify, płatności online, integracje kurierów, Merchant Center, migracja sklepu. Czas: 3–6 tygodni.
3. Pozycjonowanie SEO, AEO i GEO – audyt SEO, SEO lokalne, wizytówka Google, treści i blog, link building, optymalizacja pod ChatGPT, Gemini, Perplexity i AI Overviews (schema.org, llms.txt, FAQ). Stała miesięczna opłata ustalana po audycie. Efekty lokalnie i w Mapach zwykle po 2–3 miesiącach, w trudnych branżach 4–6 miesięcy. Raport co miesiąc.
4. Kampanie Google Ads i Meta Ads – Search, Performance Max, YouTube, Facebook, Instagram, Lead Ads, remarketing, pomiar każdego leada w GA4. Google Ads najlepiej, gdy klienci sami szukają usługi; Meta Ads, gdy trzeba pokazać ofertę osobom, które jej jeszcze nie szukają. Budżet startowy pozwala zebrać dane w 4–6 tygodni; budżet reklamowy klient płaci bezpośrednio do Google/Meta. Audyt kont, które przepalają budżet.
5. Social media – Facebook, Instagram, TikTok: strategia, kalendarz treści, grafiki, karuzele, rolki wideo, publikacja, odpowiedzi na komentarze, raport miesięczny; opcjonalnie Meta Ads.
6. Branding – logo, kolorystyka, typografia, księga znaku, wizytówki i druk, szablony social, rebranding.

Cennik orientacyjny (ceny netto, "od"): strona-wizytówka od 2 400 zł; strona firmowa od 3 000 zł; sklep internetowy / e-commerce od 5 500 zł; pozycjonowanie lokalne od 1 200 zł/mies.; pozycjonowanie ogólnopolskie od 1 600 zł/mies.; pozycjonowanie sklepu e-commerce od 2 000 zł/mies.; prowadzenie Google Ads od 1 200 zł/mies. (plus budżet reklamowy płacony bezpośrednio do Google). Landing page, redesign, Meta Ads, social media i branding wyceniamy indywidualnie. Ostateczna cena zależy od zakresu (liczba podstron, funkcje, integracje, treści). Bezpłatna wycena w 24 h ze stałą ceną zapisaną w umowie. Bezpłatny audyt strony w 48 h (szybkość, SEO, Mapy, AI). Bezpłatna konsultacja 15–20 min.
Proces (7 kroków): 1) konsultacja i brief, wycena w 24 h; 2) analiza rynku i konkurencji; 3) branding i makieta UX; 4) projekt graficzny w Figmie, 2 rundy poprawek w cenie; 5) wdrożenie i SEO on-page (dane strukturalne, llms.txt, GA4, GTM); 6) testy, start i kampanie; 7) co miesiąc rozwój i raporty.
Własność: klient dostaje prawa autorskie i wszystkie dostępy (strona, domena, hosting, GA4, konta reklamowe).
Case studies: Pure Rehab (klinika fizjoterapii, +63% wizyt w 2 miesiące), Sahra Art (sklep z dywanami, +290% wizyt w 3 miesiące), Marmostyl (kamieniarstwo, +27 zapytań po 2. miesiącu).
`;

const STYLE = `Jesteś konsultantem AI agencji top.strony. Piszesz po polsku, profesjonalnie, ciepło i zwięźle, w formie "my" (zespół top.strony), zwracasz się do klienta per "Ty".
Zasady: opierasz się WYŁĄCZNIE na wiedzy poniżej. Kwoty podajesz WYŁĄCZNIE z cennika orientacyjnego, zawsze jako "od ... zł netto" i z zaznaczeniem, że to cena orientacyjna, a dokładna trafia do umowy. Nie wymyślasz innych kwot, rabatów ani sum pakietów; usług spoza cennika nie wyceniasz kwotowo. Nie obiecujesz konkretnych pozycji w Google ani wyników. Jeśli czegoś nie wiesz, kierujesz do Kamila: 501 784 882. Pytania niezwiązane z ofertą grzecznie kierujesz z powrotem do tematu. Bez emoji, bez list, bez markdownu.
WIEDZA:
${KNOWLEDGE}`;

const json = (data, status, headers) =>
  new Response(JSON.stringify(data), { status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });

const clip = (s, n) => String(s || "").slice(0, n);
const answersText = (answers) =>
  (Array.isArray(answers) ? answers : []).slice(0, 8).map((x) => `- ${clip(x.q, 200)} → ${clip(x.a, 120)}`).join("\n");

async function claude(env, system, messages, maxTokens) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: env.MODEL || "claude-haiku-5-5", max_tokens: maxTokens, system, messages }),
  });
  if (!r.ok) throw new Error("anthropic " + r.status);
  const d = await r.json();
  return (d.content || []).filter((c) => c.type === "text").map((c) => c.text).join("").trim();
}

async function sendLead(env, lead) {
  const rows = answersText(lead.answers);
  const isUpdate = lead.stage === "email";
  const text = isUpdate
    ? `Uzupełnienie leada ${clip(lead.id, 20)}: klient podał e-mail ${clip(lead.email, 120)}\nTelefon: ${clip(lead.phone, 30)}`
    :
    `Nowy lead z konsultanta AI (topstrony.pl)\n\nTelefon: ${clip(lead.phone, 30)}\nE-mail: ${clip(lead.email, 120) || "nie podano (klient może go dopisać za chwilę)"}\nUsługa: ${clip(lead.service, 20)}\nCena orientacyjna: ${clip(lead.price, 200) || "indywidualnie"}\n\nOdpowiedzi:\n${rows}\n\nPodsumowanie AI:\n${clip(lead.summary, 1500)}\n\nStrona: ${clip(lead.page, 300)}\nCzas: ${clip(lead.ts, 40)}`;
  const jobs = [];
  if (env.RESEND_API_KEY) {
    jobs.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: env.LEAD_FROM || "Konsultant AI <wycena@topstrony.pl>",
          to: [env.LEAD_TO || "biuro@topstrony.pl"],
          reply_to: lead.email || undefined,
          subject: isUpdate ? `Lead AI – e-mail klienta (${clip(lead.phone, 30)})` : `Lead AI: ${clip(lead.service, 20)} – ${clip(lead.phone, 30)} [${clip(lead.id, 20)}]`,
          text,
        }),
      }).then((r) => r.ok)
    );
  }
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: clip(text, 3900) }),
      }).then((r) => r.ok)
    );
  }
  const res = await Promise.allSettled(jobs);
  return res.some((x) => x.status === "fulfilled" && x.value);
}


async function netlifyLead(lead) {
  const body = new URLSearchParams({
    'form-name': 'wycena',
    name: 'Konsultant AI (topstrony.pl)',
    email: clip(lead.email, 120),
    phone: clip(lead.phone, 30),
    need: clip(lead.service, 40),
    msg: (lead.stage === 'email' ? `Uzupełnienie leada ${clip(lead.id, 20)}: e-mail ${clip(lead.email, 120)}` :
      `Cena orientacyjna: ${clip(lead.price, 200) || 'indywidualnie'}\n\nOdpowiedzi:\n${answersText(lead.answers)}\n\nPodsumowanie AI:\n${clip(lead.summary, 1500)}\n\nStrona: ${clip(lead.page, 300)}`),
    rodo: 'on',
  });
  const r = await fetch(NETLIFY_FORMS, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(), redirect: 'manual' });
  return r.status < 400;
}

export async function onRequestPost({ request, env, params }) {
  const origin = request.headers.get('Origin') || '';
  const host = new URL(request.url).origin;
  if (origin && origin !== host && !ALLOWED.includes(origin)) return json({ error: 'origin' }, 403, {});
  let body;
  try { body = await request.json(); } catch { return json({ error: 'json' }, 400, {}); }
  const action = params.action;
  try {
    if (action === 'summary' || action === 'chat') {
      if (!env.ANTHROPIC_API_KEY) return json({ error: 'ai-off' }, 503, {});
    }
    if (action === 'summary') {
      const msg = `Klient odpowiedział w kwalifikatorze:\n${answersText(body.answers)}\n\nNapisz podsumowanie w 2–3 zdaniach: co klient chce osiągnąć, od czego proponujemy zacząć (konkretna usługa i realny czas z wiedzy), ${body.price ? `podaj cenę orientacyjną dokładnie tak: "${clip(body.price, 200)}"` : 'napisz, że ten zakres wyceniamy indywidualnie'} i na koniec poproś o numer telefonu, żeby ustalić zakres i dokładną wycenę. Maks. 80 słów.`;
      const summary = await claude(env, STYLE, [{ role: 'user', content: msg }], 300);
      return json({ summary }, 200, {});
    }
    if (action === 'chat') {
      const hist = (Array.isArray(body.history) ? body.history : []).slice(-6);
      const messages = [];
      const ctx = answersText(body.context && body.context.answers);
      hist.forEach((x) => { messages.push({ role: 'user', content: clip(x.q, 400) }); messages.push({ role: 'assistant', content: clip(x.a, 1200) }); });
      messages.push({ role: 'user', content: clip(body.question, 400) });
      const sys = STYLE + (ctx ? `\nKontekst z kwalifikatora (nie pytaj o to ponownie):\n${ctx}` : '') + '\nOdpowiadaj w maks. 3 zdaniach.';
      const answer = await claude(env, sys, messages, 350);
      return json({ answer }, 200, {});
    }
    if (action === 'lead') {
      const digits = String(body.phone || '').replace(/\D/g, '');
      if (digits.length < 9) return json({ error: 'phone' }, 400, {});
      let ok = env.RESEND_API_KEY || (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) ? await sendLead(env, body) : false;
      if (!ok) ok = await netlifyLead(body);
      return json({ ok }, ok ? 200 : 502, {});
    }
    return json({ error: 'not found' }, 404, {});
  } catch (e) {
    return json({ error: 'upstream' }, 502, {});
  }
}
