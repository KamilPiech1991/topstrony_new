/*!
 * top.strony – Konsultant AI do wyceny (kwalifikator leadów)
 * Wstawienie na stronę:
 *   <div id="ts-wycena"></div>
 *   script src="/wycena-widget.js" z atrybutami data-endpoint="https://wycena.topstrony.pl" i defer
 * data-endpoint – adres Workera Cloudflare (worker.js). Bez niego widget działa
 * w trybie offline: podsumowanie z szablonu, lead przez mailto.
 */
(function () {
  "use strict";

  var script = document.currentScript || document.querySelector('script[src*="wycena-widget"]');
  var CFG = {
    endpoint: (script && script.getAttribute("data-endpoint")) || "",
    target: (script && script.getAttribute("data-target")) || "#ts-wycena",
    phone: "501 784 882",
    email: "biuro@topstrony.pl",
    privacy: "https://topstrony.pl/polityka-prywatnosci/",
    demo: script && script.hasAttribute("data-demo")
  };

  /* ---------- Drzewo pytań (odpowiednik "Edycja" w LeadTok) ---------- */
  var Q = {
    start: {
      text: "Co ma teraz dać Twojej firmie najwięcej nowych zapytań lub klientów?",
      opts: [
        { id: "seo", label: "Więcej zapytań z Google", icon: "search", next: "seo", react: "Świetny kierunek na start." },
        { id: "ads", label: "Skuteczne reklamy online", icon: "trend", next: "ads", react: "Dobrze, reklamy dają efekt najszybciej." },
        { id: "web", label: "Nowa strona lub sklep", icon: "laptop", next: "web", react: "Super, od strony wszystko się zaczyna." },
        { id: "social", label: "Social media, które sprzedają", icon: "heart", next: "social", react: "Social media świetnie budują zaufanie." },
        { id: "brand", label: "Logo i spójny wizerunek", icon: "pen", next: "brand", react: "Mocna marka ułatwia każdą sprzedaż." },
        { id: "full", label: "Cały marketing od podstaw", icon: "rocket", next: "full", react: "Jeden zespół od logo do telefonu, to lubimy." }
      ]
    },
    seo: {
      text: "Gdzie firma chce być lepiej widoczna?",
      opts: [
        { id: "local", label: "W okolicy i w Mapach Google", icon: "pin", next: "when", price: "pozycjonowanie lokalne od 1 200 zł netto miesięcznie", react: "SEO lokalne może szybko pomóc, pierwsze efekty zwykle po 2–3 miesiącach." },
        { id: "pl", label: "W całej Polsce", icon: "globe", next: "when", price: "pozycjonowanie ogólnopolskie od 1 600 zł netto miesięcznie", react: "Wtedy kluczowe są treści i linki, policzymy realny potencjał." },
        { id: "ai", label: "Także w odpowiedziach AI", icon: "spark", next: "when", price: "pozycjonowanie z optymalizacją pod AI od 1 600 zł netto miesięcznie", react: "Dobry wybór, robimy SEO, AEO i GEO jednocześnie." },
        { id: "shopseo", label: "Pozycjonowanie sklepu internetowego", icon: "cart", next: "when", price: "pozycjonowanie sklepu od 2 000 zł netto miesięcznie", react: "SEO sklepu to kategorie, karty produktów i Merchant Center." }
      ]
    },
    ads: {
      text: "Czy kampanie reklamowe są już prowadzone?",
      opts: [
        { id: "fix", label: "Tak, ale wymagają poprawy", icon: "trend", next: "adsch", react: "Zaczniemy od audytu konta, często szybko widać, gdzie ucieka budżet." },
        { id: "new", label: "Nie, chcę zacząć", icon: "rocket", next: "adsch", react: "Ustawimy kampanie z pomiarem każdego leada w GA4." }
      ]
    },
    adsch: {
      text: "Gdzie chcesz się reklamować?",
      opts: [
        { id: "google", label: "Google Ads", icon: "search", next: "when", price: "prowadzenie Google Ads od 1 200 zł netto miesięcznie, budżet reklamowy płacisz bezpośrednio do Google", react: "Google Ads działa najlepiej, gdy klienci sami szukają usługi." },
        { id: "meta", label: "Facebook i Instagram", icon: "heart", next: "when", react: "Meta Ads pokaże ofertę osobom, które jej jeszcze nie szukają." },
        { id: "unsure", label: "Nie wiem, doradźcie", icon: "chat", next: "when", price: "prowadzenie Google Ads od 1 200 zł netto miesięcznie (Meta Ads wyceniamy indywidualnie), budżet reklamowy płacisz bezpośrednio do Google lub Meta", react: "Jasne, dobierzemy kanał do branży i budżetu." }
      ]
    },
    web: {
      text: "Czego dokładnie potrzebujesz?",
      opts: [
        { id: "card", label: "Prosta strona-wizytówka", icon: "doc", next: "content", price: "strona-wizytówka od 2 400 zł netto", react: "Wizytówka to szybki i niedrogi start w sieci." },
        { id: "company", label: "Strona firmowa", icon: "laptop", next: "content", price: "strona firmowa od 3 000 zł netto", react: "Strona firmowa powstaje zwykle w 1–3 tygodnie." },
        { id: "landing", label: "Landing page pod kampanię", icon: "target", next: "content", react: "Landing page to szybki start pod reklamy." },
        { id: "shop", label: "Sklep internetowy", icon: "cart", next: "content", price: "sklep internetowy od 5 500 zł netto", react: "Sklep zwykle zajmuje 3–6 tygodni, z płatnościami i kurierami." },
        { id: "redesign", label: "Odświeżenie obecnej strony", icon: "refresh", next: "content", react: "Redesign to często najszybszy sposób na więcej zapytań." }
      ]
    },
    content: {
      text: "Kto przygotuje treści na stronę?",
      opts: [
        { id: "own", label: "Mamy własne teksty i zdjęcia", icon: "doc", next: "when", react: "Świetnie, to przyspieszy start." },
        { id: "help", label: "Potrzebujemy pomocy z treściami", icon: "pen", next: "when", react: "Napiszemy teksty pod SEO i odpowiedzi AI." }
      ]
    },
    social: {
      text: "Na których kanałach chcesz działać?",
      opts: [
        { id: "fbig", label: "Facebook i Instagram", icon: "heart", next: "when", react: "Ułożymy kalendarz treści, grafiki i karuzele." },
        { id: "reels", label: "TikTok i rolki wideo", icon: "play", next: "when", react: "Rolki mają dziś największe zasięgi." },
        { id: "all", label: "Wszystkie naraz", icon: "spark", next: "when", react: "Jeden spójny plan na wszystkie kanały." }
      ]
    },
    brand: {
      text: "Od czego zaczynamy?",
      opts: [
        { id: "logo", label: "Nowe logo", icon: "pen", next: "when", react: "Zaprojektujemy logo z kolorami i typografią." },
        { id: "rebrand", label: "Odświeżenie marki", icon: "refresh", next: "when", react: "Rebranding uporządkuje wizerunek na stronie i w social mediach." },
        { id: "book", label: "Księga znaku i materiały", icon: "doc", next: "when", react: "Przygotujemy księgę znaku, druk i szablony social." }
      ]
    },
    full: {
      text: "Co firma ma już dziś?",
      opts: [
        { id: "zero", label: "Nic, startujemy od zera", icon: "rocket", next: "when", price: "strona firmowa od 3 000 zł netto, a potem pozycjonowanie lokalne od 1 200 zł netto miesięcznie", react: "Poprowadzimy wszystko: marka, strona, ruch." },
        { id: "noleads", label: "Stronę, ale bez zapytań", icon: "laptop", next: "when", price: "pozycjonowanie lokalne od 1 200 zł netto miesięcznie", react: "Najpierw sprawdzimy, co blokuje zapytania." },
        { id: "noresults", label: "Stronę i reklamy, bez efektów", icon: "trend", next: "when", price: "prowadzenie Google Ads od 1 200 zł netto miesięcznie i pozycjonowanie lokalne od 1 200 zł netto miesięcznie", react: "Zrobimy audyt całego lejka i ułożymy plan." }
      ]
    },
    when: {
      text: "Na jakim etapie jest firma?",
      opts: [
        { id: "30d", label: "Chcę zacząć w ciągu 30 dni", icon: "calendar", next: "summary", react: "Świetnie, przygotujemy konkretny zakres." },
        { id: "3m", label: "Planuję działania w 2–3 miesiące", icon: "clock", next: "summary", react: "Dobrze, zdążymy spokojnie wszystko zaplanować." },
        { id: "audit", label: "Najpierw bezpłatny audyt", icon: "doc", next: "summary", react: "Bezpłatny audyt dostaniesz w 48 h." }
      ]
    }
  };

  var SERVICE = {
    seo: "pozycjonowanie SEO, AEO i GEO", ads: "kampanie Google Ads i Meta Ads", web: "nowy projekt www",
    social: "obsługa social media", brand: "branding i identyfikacja wizualna", full: "kompleksowy marketing"
  };

  var ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M2 19h20"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>',
    rocket: '<path d="M5 15c-1 1-1.5 4-1.5 4s3-.5 4-1.5"/><path d="M9 15 6 12l2-4c3-4 7-5 11-5 0 4-1 8-5 11l-4 2z"/><circle cx="14.5" cy="9.5" r="1.5"/>',
    pin: '<path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h12L22 7H6.5"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-5L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14 5l2-2"/><path d="M20 21v-5h-5"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    send: '<path d="M4 12 20 4l-6 16-3-7z"/>'
  };
  function icon(n) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[n] || "") + "</svg>";
  }

  var CSS = [
    ":host{all:initial;display:block;--g:#3E8310;--g2:#60AD26;--gl:#9BDB66;--bg:#0A0E0B;--card:#121813;--tile:#161d17;--line:#2a322b;--tx:#F3F6F1;--mut:#a9b3a6;font-family:Inter,system-ui,sans-serif;color:var(--tx)}",
    "*{box-sizing:border-box}",
    ".w{max-width:860px;margin:0 auto;background:var(--card);border:1px solid var(--line);border-radius:24px;padding:32px 28px 18px}",
    ".badge{display:flex;width:max-content;margin:0 auto;align-items:center;gap:8px;font:600 12px/1 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--gl);border:1px solid #2f4a1f;background:#14200f;padding:8px 14px;border-radius:999px}",
    ".dot{width:8px;height:8px;border-radius:50%;background:var(--g2);box-shadow:0 0 0 4px rgba(96,173,38,.18)}",
    "h2{font:700 clamp(24px,4vw,34px)/1.15 Poppins,system-ui,sans-serif;text-align:center;margin:18px 0 8px;letter-spacing:-.01em}",
    ".sub{text-align:center;color:var(--mut);font-size:16px;margin:0 0 18px}",
    ".cta{display:flex;width:max-content;max-width:100%;margin:0 auto 26px;align-items:center;gap:8px;background:var(--g);color:#fff;border:0;border-radius:999px;padding:11px 20px;font:600 13px/1 Inter,sans-serif;letter-spacing:.04em;text-transform:uppercase;cursor:default}",
    ".log{display:flex;flex-direction:column;gap:12px}",
    ".bub{align-self:flex-start;max-width:85%;background:var(--tile);border:1px solid var(--line);padding:11px 15px;border-radius:16px 16px 16px 6px;font-size:15px;line-height:1.5;animation:in .25s ease}",
    ".bub.q{font-weight:500}",
    ".bub.ai{background:#132110;border-color:#2f4a1f}",
    ".bub.me{align-self:flex-end;background:var(--g);border-color:var(--g);border-radius:16px 16px 6px 16px;color:#fff}",
    ".tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;background:#0e130f;border-radius:18px;padding:10px;animation:in .25s ease}",
    ".t{position:relative;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;background:var(--tile);border:1px solid var(--line);color:var(--tx);border-radius:14px;padding:18px 12px;font:500 15px/1.3 Inter,sans-serif;cursor:pointer;transition:border-color .15s,transform .15s,background .15s}",
    ".t:hover:not(:disabled){border-color:var(--g2);transform:translateY(-1px)}",
    ".t:focus-visible,.in:focus-visible,.btn:focus-visible{outline:2px solid var(--gl);outline-offset:2px}",
    ".t .ic{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:#1d2a19;color:var(--gl)}",
    ".t svg{width:20px;height:20px}",
    ".t:disabled{cursor:default;opacity:.45}",
    ".t.sel{opacity:1;background:var(--g);border-color:var(--g);color:#fff}.t.sel .ic{background:rgba(255,255,255,.18);color:#fff}",
    ".t.sel:after{content:'';position:absolute;top:-7px;right:-7px;width:20px;height:20px;border-radius:50%;background:var(--g2) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpath d='m5 12 5 5 9-10'/%3E%3C/svg%3E\") center/12px no-repeat;border:2px solid var(--card)}",
    ".typing{display:inline-flex;gap:4px}.typing i{width:6px;height:6px;border-radius:50%;background:var(--mut);animation:b 1s infinite}.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}",
    "form.f{display:flex;flex-wrap:wrap;gap:10px;background:#0e130f;border-radius:18px;padding:12px;animation:in .25s ease}",
    ".in{flex:1 1 220px;min-width:0;background:var(--tile);border:1px solid var(--line);color:var(--tx);border-radius:999px;padding:13px 18px;font:15px Inter,sans-serif}",
    ".in::placeholder{color:#7d877a}",
    ".btn{background:var(--g);color:#fff;border:0;border-radius:999px;padding:13px 22px;font:600 15px Inter,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:8px}",
    ".btn:hover{background:#4a9a14}.btn.ghost{background:transparent;border:1px solid var(--line);color:var(--tx)}",
    ".btn svg{width:16px;height:16px}",
    ".rodo{flex-basis:100%;display:flex;gap:8px;font-size:12px;color:var(--mut);line-height:1.45;padding:0 6px}.rodo a{color:var(--gl)}",
    ".err{flex-basis:100%;color:#ff9a8a;font-size:13px;padding:0 8px;min-height:0}",
    ".hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}",
    ".ask{display:flex;gap:8px;margin-top:16px;border-top:1px solid var(--line);padding-top:14px}",
    ".foot{text-align:center;color:#6f7a6c;font-size:12px;margin-top:14px}.foot a{color:inherit}",
    "@keyframes in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}",
    "@keyframes b{0%,80%,100%{opacity:.3}40%{opacity:1}}",
    "@media (max-width:560px){.w{padding:24px 14px 14px;border-radius:18px}.tiles{grid-template-columns:1fr 1fr}.t{padding:14px 8px;font-size:14px}}",
    "@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}"
  ].join("");

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function track(name, params) {
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({ event: name }, params || {})); } catch (e) {}
  }

  function mount(host) {
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    root.innerHTML = '<style>' + CSS + '</style>' +
      '<div class="w" role="region" aria-label="Bezpłatna wycena – konsultant AI">' +
      '<div class="badge"><span class="dot"></span>Wycena w 24 h</div>' +
      '<h2>Odbierz bezpłatną wycenę i plan działań</h2>' +
      '<p class="sub">3 kliknięcia, a nasz konsultant AI przygotuje podsumowanie</p>' +
      '<div class="cta">' + icon("check").replace('stroke-width="1.8"', 'stroke-width="2.4" width="14" height="14"') + 'Wybierz odpowiedź, aby zacząć</div>' +
      '<div class="log" aria-live="polite"></div>' +
      '<div class="foot">Rozmawiasz z konsultantem AI top.strony. Wolisz człowieka? <a href="tel:+48501784882">Zadzwoń: ' + CFG.phone + '</a></div>' +
      '</div>';

    var log = root.querySelector(".log");
    var state = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), sent: false, path: [], answers: [], price: "", service: null, summary: "", phone: "", email: "", started: false };

    function add(html, cls) {
      var el = document.createElement("div");
      el.className = "bub " + (cls || "");
      el.innerHTML = html;
      log.appendChild(el);
      return el;
    }
    function scrollTo(el) {
      var r = el.getBoundingClientRect();
      if (r.bottom > window.innerHeight || r.top < 0) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    async function typing(ms) {
      var t = add('<span class="typing" aria-label="Konsultant pisze"><i></i><i></i><i></i></span>', "ai");
      await sleep(ms);
      t.remove();
    }

    function ask(key) {
      var node = Q[key];
      add(esc(node.text), "q");
      var box = document.createElement("div");
      box.className = "tiles";
      box.setAttribute("role", "group");
      box.setAttribute("aria-label", node.text);
      node.opts.forEach(function (o) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "t";
        b.innerHTML = '<span class="ic">' + icon(o.icon) + "</span>" + esc(o.label);
        b.addEventListener("click", function () { choose(key, o, box, b); });
        box.appendChild(b);
      });
      log.appendChild(box);
      if (state.started) scrollTo(box);
    }

    async function choose(key, o, box, btn) {
      if (!state.started) { state.started = true; track("ts_wycena_start"); }
      box.querySelectorAll(".t").forEach(function (b) { b.disabled = true; });
      btn.classList.add("sel");
      if (key === "start") state.service = o.id;
      if (o.price) state.price = o.price;
      state.answers.push({ q: Q[key].text, a: o.label });
      await typing(550);
      add(esc(o.react), "ai");
      await sleep(250);
      if (o.next === "summary") return summarize();
      ask(o.next);
    }

    function localSummary() {
      var a = state.answers.map(function (x) { return x.a.charAt(0).toLowerCase() + x.a.slice(1); });
      var when = a[a.length - 1];
      var details = a.slice(1, -1).join(", ");
      var s = "Podsumowując: interesuje Cię " + SERVICE[state.service] + (details ? " – " + details : "") + ". ";
      if (/audyt/.test(when)) s += "Zaczniemy od bezpłatnego audytu, który dostaniesz w 48 h, z listą konkretnych poprawek. ";
      else if (/30 dni/.test(when)) s += "Chcesz ruszyć w ciągu 30 dni, więc dokładną wycenę dostaniesz w ciągu 24 h. ";
      else s += "Planujesz start w ciągu 2–3 miesięcy, więc spokojnie ustalimy zakres, budżet i harmonogram. ";
      if (state.price) s += "Orientacyjnie: " + state.price + ". Ostateczną, stałą cenę ustalimy po krótkiej rozmowie i zapiszemy w umowie. ";
      else s += "Ten zakres wyceniamy indywidualnie, wycenę dostaniesz w 24 h. ";
      s += "Zostaw numer telefonu, a Kamil oddzwoni i w 15 minut ustalicie szczegóły.";
      return s;
    }

    async function summarize() {
      track("ts_wycena_qualified", { ts_service: state.service });
      var t = add('<span class="typing" aria-label="Konsultant przygotowuje podsumowanie"><i></i><i></i><i></i></span>', "ai");
      var text = "";
      if (CFG.endpoint) {
        try {
          var r = await fetch(CFG.endpoint.replace(/\/$/, "") + "/api/summary", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ service: state.service, answers: state.answers, price: state.price, page: location.href })
          });
          if (r.ok) text = (await r.json()).summary || "";
        } catch (e) {}
      } else { await sleep(900); }
      t.remove();
      state.summary = text || localSummary();
      var el = add(esc(state.summary), "ai");
      scrollTo(el);
      await sleep(300);
      askPhone();
    }

    function form(opts) {
      add(esc(opts.prompt), "q");
      var f = document.createElement("form");
      f.className = "f";
      f.noValidate = true;
      f.innerHTML =
        '<input class="in" name="v" type="' + opts.type + '" inputmode="' + opts.mode + '" autocomplete="' + opts.ac + '" placeholder="' + esc(opts.ph) + '" aria-label="' + esc(opts.ph) + '">' +
        '<input class="hp" name="company_site" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<button class="btn" type="submit">' + icon("send") + esc(opts.btn) + '</button>' +
        (opts.skip ? '<button class="btn ghost" type="button" data-skip>' + esc(opts.skip) + '</button>' : "") +
        (opts.rodo ? '<label class="rodo"><input type="checkbox" name="rodo"> <span>Zgadzam się na kontakt w sprawie wyceny. Administratorem danych jest Qamitech Kamil Piech. <a href="' + CFG.privacy + '" target="_blank" rel="noopener">Polityka prywatności</a></span></label>' : "") +
        '<div class="err" role="alert"></div>';
      log.appendChild(f);
      var inp = f.querySelector("input[name=v]");
      var err = f.querySelector(".err");
      scrollTo(f);
      setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 50);
      inp.addEventListener("input", function () { err.textContent = ""; });
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        if (f.querySelector(".hp").value) return; // bot
        var v = inp.value.trim();
        var msg = opts.validate(v);
        if (!msg && opts.rodo && !f.querySelector("[name=rodo]").checked) msg = "Zaznacz zgodę na kontakt, żebyśmy mogli oddzwonić.";
        if (msg) { err.textContent = msg; inp.focus(); return; }
        f.remove();
        add(esc(opts.show ? opts.show(v) : v), "me");
        opts.done(v);
      });
      var sk = f.querySelector("[data-skip]");
      if (sk) sk.addEventListener("click", function () { f.remove(); opts.done(""); });
    }

    function askPhone() {
      form({
        prompt: "Podaj numer telefonu, żebyśmy mogli omówić zakres i wycenę.",
        type: "tel", mode: "tel", ac: "tel", ph: "Numer telefonu", btn: "Wyślij", rodo: true,
        validate: function (v) {
          var d = v.replace(/[^\d]/g, "").replace(/^48(?=\d{9}$)/, "");
          return d.length === 9 ? "" : "Wpisz 9-cyfrowy numer telefonu, np. 501 784 882.";
        },
        done: async function (v) {
          state.phone = v;
          track("generate_lead", { ts_service: state.service, method: "wycena_ai" });
          var sending = postLead("phone"); // lead wychodzi od razu po telefonie
          await typing(450);
          state.sent = await sending;
          add("Dziękujemy! Mamy Twój numer.", "ai");
          askEmail();
        }
      });
    }

    function askEmail() {
      form({
        prompt: "Podaj jeszcze adres e-mail, na który wyślemy wycenę i plan dalszych kroków.",
        type: "email", mode: "email", ac: "email", ph: "Adres e-mail", btn: "Wyślij", skip: "Pomiń",
        validate: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Sprawdź adres e-mail."; },
        done: async function (v) { state.email = v; await finish(); }
      });
    }

    async function postLead(stage) {
      var lead = { stage: stage, id: state.id, service: state.service, answers: state.answers, price: state.price, summary: state.summary, phone: state.phone, email: state.email, page: location.href, ts: new Date().toISOString() };
      if (!CFG.endpoint) return !!CFG.demo;
      try {
        var r = await fetch(CFG.endpoint.replace(/\/$/, "") + "/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead), keepalive: true });
        return r.ok;
      } catch (e) { return false; }
    }

    async function finish() {
      var ok = state.sent;
      if (state.sent && state.email) postLead("email");      // uzupełnienie: tylko e-mail
      else if (!state.sent) ok = state.sent = await postLead("full"); // ponowna próba pełnego zgłoszenia
      await typing(500);
      if (ok) {
        add("Gotowe! Kamil oddzwoni w ciągu 24 h (pn–pt 9:00–20:00)" + (state.email ? ", a wycenę wyślemy na " + esc(state.email) : "") + ". Do usłyszenia!", "ai");
      } else {
        var body = encodeURIComponent("Telefon: " + state.phone + "\nE-mail: " + state.email + "\n\n" + state.summary + "\n\n" + state.answers.map(function (x) { return x.q + " – " + x.a; }).join("\n"));
        add('Nie udało się wysłać zgłoszenia automatycznie. <a style="color:#9BDB66" href="mailto:' + CFG.email + '?subject=' + encodeURIComponent("Wycena – konsultant AI") + '&body=' + body + '">Kliknij, aby wysłać je e-mailem</a> albo zadzwoń: <a style="color:#9BDB66" href="tel:+48501784882">' + CFG.phone + "</a>.", "ai");
      }
      if (CFG.endpoint) chatBox();
    }

    /* Swobodne pytania (jak pole "Zapytaj o cokolwiek" w LeadTok) – tylko z Workerem */
    function chatBox() {
      var wrap = root.querySelector(".w");
      var f = document.createElement("form");
      f.className = "ask";
      f.innerHTML = '<input class="in" placeholder="Zapytaj o cokolwiek, np. ile trwa sklep?" aria-label="Zadaj pytanie konsultantowi" maxlength="400"><button class="btn" type="submit" aria-label="Wyślij pytanie">' + icon("send") + "</button>";
      wrap.insertBefore(f, root.querySelector(".foot"));
      var history = [];
      f.addEventListener("submit", async function (e) {
        e.preventDefault();
        var inp = f.querySelector("input");
        var q = inp.value.trim();
        if (!q) return;
        inp.value = "";
        add(esc(q), "me");
        var t = add('<span class="typing"><i></i><i></i><i></i></span>', "ai");
        var ans = "";
        try {
          var r = await fetch(CFG.endpoint.replace(/\/$/, "") + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, history: history, context: { service: state.service, answers: state.answers } }) });
          if (r.ok) ans = (await r.json()).answer || "";
        } catch (e2) {}
        t.remove();
        ans = ans || "Nie mogę teraz odpowiedzieć. Zadzwoń: " + CFG.phone + " albo napisz: " + CFG.email + ".";
        history.push({ q: q, a: ans });
        history = history.slice(-6);
        scrollTo(add(esc(ans), "ai"));
      });
    }

    ask("start");
  }

  function init() {
    var host = document.querySelector(CFG.target);
    if (!host || host.__tsw) return;
    host.__tsw = true;
    mount(host);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
