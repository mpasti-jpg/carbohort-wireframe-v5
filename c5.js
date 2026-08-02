/* =========================================================================
   c5.js - wspolny silnik mechanik layoutu V5 dla stron produktowych.
   Wyekstrahowany 1:1 z inline'owego <script> we wzorcowej stronie
   v5/carbomat.html (2026-08-02). Kod jest w calosci odporny na brak
   elementow (kazda funkcja ma guard), wiec strona moze uzyc dowolnego
   podzbioru mechanik: subnaw + scrollspy, taby wariantu, akordeony
   (panelSet), sceny recept, pin osi sezonu, filtr legendy, dok dr Jurka.
   carbomat.html celowo NIE zostal ruszony - przy najblizszej okazji warto
   go przepiac na ten plik, zeby nie doszlo do rozjazdu mechanik.
   Wymaga: cw.js (dok dr Jurka, mega-menu) zaladowanego wczesniej.
   ========================================================================= */
/* ===== CARBOMAT ECO – V5: mechanika layoutu wg makiet 24.07 =====
   Celowo minimalna (bez animacji – dopracujemy je osobno, sekcja po sekcji):
   scrollspy + pasek postępu, przełącznik wariantu, akordeony (Czym jest /
   Sezon / FAQ), karty recept, dok dr. Jurka po zejściu z hero. */
(function () {
  "use strict";
  var doc = document;
  doc.documentElement.classList.add("cx-js");
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  var reducedMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* --- Rozwijanie/zwijanie paneli (wspólne dla wszystkich akordeonów) --------
     Animujemy wysokość mierzoną z wnętrza panelu: `grid-template-rows: 0fr→1fr`
     nie interpoluje się we wszystkich silnikach, a wysokość owszem. Po otwarciu
     wracamy na `auto`, żeby treść mogła swobodnie rosnąć. */
  function panelSet(panel, open, instant) {
    if (!panel) return;
    var inner = panel.firstElementChild;
    panel.inert = !open;
    if (!inner) return;
    if (instant || reducedMQ.matches) {
      panel.style.transition = "none";
      panel.style.height = open ? "auto" : "0px";
      void panel.offsetHeight;
      panel.style.transition = "";
      return;
    }
    var from = panel.getBoundingClientRect().height;
    var to = open ? inner.getBoundingClientRect().height : 0;
    if (Math.abs(from - to) < 0.5) { if (open) panel.style.height = "auto"; return; }
    panel.style.height = from + "px";
    void panel.offsetHeight;                 /* wymuszenie klatki startowej */
    panel.style.height = to + "px";
    if (open) {
      var done = function (e) {
        if (e.target !== panel || e.propertyName !== "height") return;
        panel.removeEventListener("transitionend", done);
        if (!panel.inert) panel.style.height = "auto";   /* stan wciąż otwarty */
      };
      panel.addEventListener("transitionend", done);
    }
  }

  /* Górne menu scrolluje się ze stroną (nie jest sticky) – subnav klei się
     do top:0, więc pomiar wysokości navbara nie jest już potrzebny. */

  /* --- Nawigacja produktowa: scrollspy + pasek postępu czytania ------------ */
  var spyLinks = $$("[data-spy]");
  var chapters = $$("[data-chapter]");
  function updateSpy() {
    var mid = window.innerHeight * 0.4;
    var current = null;
    chapters.forEach(function (sec) {
      if (sec.getBoundingClientRect().top < mid) current = sec.getAttribute("data-chapter");
    });
    spyLinks.forEach(function (a) {
      var on = a.getAttribute("data-spy") === current;
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }

  /* --- Który dla mnie: taby przewijające do bloków (oba widoczne) ---------- */
  var tabsBar = $("[data-tabs]");
  var tabBtns = $$("[data-tab]");
  var varBlocks = $$("[data-variant-block]");
  var subnavEl = $(".cx-subnav");
  function subnavH() { return subnavEl ? subnavEl.offsetHeight : 0; }
  if (tabsBar) {
    /* realna wysokość tabów – używana przez lepki packshot w bloku wariantu */
    var syncTabsH = function () {
      doc.documentElement.style.setProperty("--c5-tabs-h", tabsBar.offsetHeight + "px");
    };
    syncTabsH();
    window.addEventListener("resize", syncTabsH);
    tabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var block = doc.getElementById(btn.getAttribute("aria-controls"));
        if (!block) return;
        var offset = subnavH() + tabsBar.offsetHeight + 16;
        window.scrollTo({ top: Math.round(block.getBoundingClientRect().top + window.scrollY - offset), behavior: "smooth" });
      });
    });
  }
  function updateTabs() {
    if (!tabsBar || !varBlocks.length) return;
    var line = subnavH() + tabsBar.offsetHeight + 24;   /* pod przyklejonymi belkami */
    var current = varBlocks[0].getAttribute("data-variant-block");
    varBlocks.forEach(function (b) {
      if (b.getBoundingClientRect().top <= line) current = b.getAttribute("data-variant-block");
    });
    tabBtns.forEach(function (b) {
      b.setAttribute("aria-selected", b.getAttribute("data-tab") === current ? "true" : "false");
    });
  }

  /* --- Siatka sezonu: zdjęcia produktów jako filtry ------------------------- */
  var legend = $(".c5-legend");
  var filterBtns = $$("[data-filter]");
  var chartDots = $$(".c5-chart .c5-dot");
  var activeFilter = null;
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var prod = btn.getAttribute("data-filter");
      activeFilter = activeFilter === prod ? null : prod;      /* ponowny klik = zdejmij filtr */
      filterBtns.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-filter") === activeFilter ? "true" : "false");
      });
      if (legend) {
        if (activeFilter) { legend.setAttribute("data-filtering", ""); } else { legend.removeAttribute("data-filtering"); }
      }
      chartDots.forEach(function (d) {
        d.classList.toggle("is-off", !!activeFilter && d.getAttribute("data-prod") !== activeFilter);
      });
    });
  });

  /* --- Czym jest: akordeon 5 tematów + podmiana etykiety wizualu ----------- */
  var factBtns = $$("[data-fact]");
  var factViz = $$("[data-fact-viz]");
  factBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      if (open) return; /* zawsze jeden temat otwarty */
      factBtns.forEach(function (b) {
        var panel = doc.getElementById(b.getAttribute("aria-controls"));
        var fact = b.closest(".c5-fact");
        var on = b === btn;
        b.setAttribute("aria-expanded", on ? "true" : "false");
        if (fact) fact.setAttribute("data-open", on ? "true" : "false");
        panelSet(panel, on);
        if (on) {
          factViz.forEach(function (v) {
            v.setAttribute("data-on", v.getAttribute("data-fact-viz") === b.getAttribute("data-fact") ? "true" : "false");
          });
        }
      });
    });
  });

  /* --- Jak stosować: akordeon kart na scenie ---------------------------------
     Nieaktywna karta = sam pasek tytułu; klik rozwija opis, zwija poprzednią
     i podmienia zdjęcie sceny (etykietę placeholdera). */
  $$(".c5-scene").forEach(function (scene) {
    var cards = $$("[data-card]", scene);
    if (cards.length < 2) return;
    var photoBox = $(".wf-ph", scene);
    function activate(card) {
      cards.forEach(function (c) {
        var on = c === card;
        c.classList.toggle("is-on", on);
        var head = $(".c5-scene__cardhead", c);
        var body = $(".c5-scene__cardbody", c);
        if (head) head.setAttribute("aria-expanded", on ? "true" : "false");
        panelSet(body, on);
      });
      /* każda karta ma swoje zdjęcie sceny – tu tylko neutralny znacznik wariantu */
      var photo = card.getAttribute("data-scene-photo");
      if (photoBox && photo) photoBox.setAttribute("data-photo", photo);
    }
    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        if (!card.classList.contains("is-on")) activate(card);
      });
    });
    var startowa = cards.filter(function (c) { return c.classList.contains("is-on"); })[0];
    if (startowa && photoBox) photoBox.setAttribute("data-photo", startowa.getAttribute("data-scene-photo"));
  });

  /* --- Sezon: oś czasu sterowana scrollem -------------------------------------
     Blok kroków przykleja się DOŁEM do krawędzi ekranu w momencie, gdy widoczne
     są wszystkie trzy (jeszcze zamknięte). Dalszy scroll otwiera je po kolei:
     1 → 2 → 3 (zawsze jeden otwarty), po trzecim blok odkleja się i strona
     przewija się normalnie. Klik w tytuł przewija do fazy danego kroku.
     Poniżej 900 px i przy reduced-motion: zwykły akordeon na klik. */
  var seasonWideMQ = window.matchMedia("(min-width: 900px)");
  var seasonPin = $("[data-season-pin]");
  var seasonBlock = seasonPin ? $(".c5-season", seasonPin) : null;
  var seasonSpacer = seasonPin ? $("[data-season-spacer]", seasonPin) : null;
  var seasonHead = $("[data-season-head]");
  var seasonBtns = $$("[data-season]");
  var seasonIdx = null;
  var seasonOpenH = 0;
  var seasonStep = 0;
  var seasonHeadTop = 0;
  var seasonHeadH = 0;
  var seasonHeadWrap = seasonPin ? $("[data-season-headwrap]", seasonPin) : null;

  function seasonPinOn() { return !!seasonBlock && seasonWideMQ.matches && !reducedMQ.matches; }
  function setSeason(idx, instant) {
    if (seasonIdx === idx) return;
    seasonIdx = idx;
    seasonBtns.forEach(function (b, i) {
      var panel = doc.getElementById(b.getAttribute("aria-controls"));
      var row = b.closest(".c5-season__row");
      var on = i === idx;
      b.setAttribute("aria-expanded", on ? "true" : "false");
      if (row) row.setAttribute("data-open", on ? "true" : "false");
      panelSet(panel, on, instant);
    });
  }
  function seasonGap() {
    return seasonBlock ? (parseFloat(window.getComputedStyle(seasonBlock).bottom) || 0) : 0;
  }
  /* Pozycja kontenera (jego `top` w oknie) w dwóch momentach granicznych:
     – gdy blok kroków dobija dołem do krawędzi ekranu,
     – gdy nagłówek H2+lead dojeżdża do swojej pozycji sticky.
     Cykl otwierania startuje dopiero, gdy zaszły OBA (czyli przy mniejszym C). */
  function seasonBlockPinC() { return window.innerHeight - seasonGap() - seasonOpenH; }
  /* Nagłówek leży na górze kontenera pinu (absolutna rozpórka), więc przykleja
     się dokładnie wtedy, gdy `top` kontenera zrówna się z jego offsetem sticky. */
  function measureSeasonHead() {
    if (!seasonHead) return;
    seasonHeadTop = parseFloat(window.getComputedStyle(seasonHead).top) || 0;
    seasonHeadH = seasonHead.offsetHeight;
  }
  function seasonHeadStickC() { return seasonHead ? seasonHeadTop : Infinity; }
  function sizeSeasonPin() {
    if (!seasonPin || !seasonBlock) return;
    if (!seasonPinOn()) {
      seasonPin.style.height = "";
      if (seasonSpacer) seasonSpacer.style.height = "";
      if (seasonHeadWrap) seasonHeadWrap.style.height = "";
      setSeason(0);
      return;
    }
    setSeason(0, true);                             /* pomiar w stanie „jeden krok otwarty" */
    seasonOpenH = seasonBlock.offsetHeight;
    measureSeasonHead();
    seasonStep = Math.max(260, Math.round(window.innerHeight * 0.55));
    /* Cykl rusza dopiero, gdy zaszły OBA zdarzenia (blok przy dole, nagłówek
       u góry) – czyli przy mniejszym `top` kontenera. Różnica między nimi to
       „przedbieg" z wszystkimi krokami zamkniętymi. Kontener dobieramy tak,
       by blok odkleił się dokładnie na końcu trzeciej fazy. */
    var span = seasonStep * 3;
    var startC = seasonStartTop();
    var pinH = Math.round(window.innerHeight - seasonGap() - startC + span);
    if (seasonSpacer) seasonSpacer.style.height = (pinH - seasonOpenH) + "px";
    seasonPin.style.height = pinH + "px";
    /* Rozpórka nagłówka kończy się tam, gdzie blok puszcza dół – od tego miejsca
       dolna krawędź wypycha nagłówek w górę (naturalne odjeżdżanie, bez znikania). */
    if (seasonHeadWrap) {
      seasonHeadWrap.style.height = Math.round(seasonHeadTop + seasonHeadH - startC + span) + "px";
    }
  }
  function seasonSpan() { return seasonStep * 3; }
  function seasonStartTop() { return Math.min(seasonBlockPinC(), seasonHeadStickC()); }
  function updateSeason() {
    if (!seasonPinOn() || !seasonOpenH) return;
    var span = seasonSpan();
    var p = span > 0 ? (seasonStartTop() - seasonPin.getBoundingClientRect().top) / span : 0;
    if (p < 0) { setSeason(-1); return; }            /* wszystkie zamknięte, zanim się przyklei */
    setSeason(Math.min(2, Math.floor(p * 3)));
  }
  seasonBtns.forEach(function (btn, i) {
    btn.addEventListener("click", function () {
      if (seasonPinOn()) {
        /* przewiń do środka fazy tego kroku – scroll otworzy go sam */
        var pinTopDoc = seasonPin.getBoundingClientRect().top + window.scrollY;
        var target = pinTopDoc - seasonStartTop() + ((i + 0.5) / 3) * seasonSpan();
        window.scrollTo({ top: Math.round(target), behavior: "smooth" });
      } else if (btn.getAttribute("aria-expanded") !== "true") {
        setSeason(i);
      }
    });
  });

  /* --- FAQ: jedno pytanie otwarte, odpowiedź w prawej kolumnie ------------- */
  var faqItems = $$(".c5-faq__item");
  faqItems.forEach(function (item) {
    var btn = $(".c5-faq__q", item);
    var ans = $(".c5-faq__a", item);
    if (!btn || !ans) return;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      faqItems.forEach(function (it) {
        var b = $(".c5-faq__q", it);
        var a = $(".c5-faq__a", it);
        var on = it === item && !open;
        if (b) b.setAttribute("aria-expanded", on ? "true" : "false");
        panelSet(a, on);
        if (on) { it.setAttribute("data-open", ""); } else { it.removeAttribute("data-open"); }
      });
    });
  });

  /* --- Moduł „zadaj pytanie" pod FAQ ------------------------------------------
     Klik w dowolne miejsce ramki lub w przycisk = otwarcie doka dr. Jurka.
     Klik w tabletkę = otwarcie doka + wpisanie pytania do jego pola
     (użytkownik tylko wysyła – bez przepisywania). */
  var askBox = $("[data-ask-box]");
  var askInput = $("[data-ask-input]");
  var askBtn = $("[data-jurek-open]");
  var jurekDock = $("[data-jurek-dock]");
  var jurekInput = $("[data-jurek-input]");
  function openJurek(question) {
    var opened = jurekDock && jurekDock.getAttribute("data-open") === "true";
    if (!opened && askBtn) askBtn.click(); /* mechanizm otwarcia z cw.js */
    if (question && jurekInput) {
      jurekInput.value = question;
      jurekInput.focus();
    }
  }
  if (askBox) {
    askBox.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-ask-chip]");
      openJurek(chip ? chip.textContent.trim() : null);
    });
  }
  if (askInput) {
    /* dostęp z klawiatury: fokus w polu ramki też otwiera dok */
    askInput.addEventListener("focus", function () { openJurek(null); askInput.blur(); });
  }

  /* --- Dok dr. Jurka: pojawia się po zejściu z hero ------------------------- */
  var dock = $("[data-jurek-dock]");
  var hero = doc.getElementById("hero");
  function updateDock() {
    if (!dock || !hero) return;
    var past = window.scrollY > hero.offsetHeight * 0.6;
    dock.classList.toggle("cx-dockhide", !past);
  }

  /* --- Subnawigacja: wjeżdża od góry dopiero, gdy główne menu wyjedzie ------ */
  var navbarEl = $(".wf-navbar");
  function updateSubnav() {
    if (!subnavEl) return;
    var past = window.scrollY > (navbarEl ? navbarEl.offsetHeight : 72);
    subnavEl.classList.toggle("is-on", past);
  }

  /* Start: wysokości paneli zgodne z zapisanym w HTML stanem, bez animacji */
  $$(".c5-fact").forEach(function (f) {
    panelSet($(".c5-fact__panel", f), f.getAttribute("data-open") === "true", true);
  });
  $$(".c5-scene__card").forEach(function (c) {
    panelSet($(".c5-scene__cardbody", c), c.classList.contains("is-on"), true);
  });
  $$(".c5-faq__item").forEach(function (it) {
    panelSet($(".c5-faq__a", it), it.hasAttribute("data-open"), true);
  });
  $$(".c5-season__row").forEach(function (r) {
    panelSet($(".c5-season__panel", r), r.getAttribute("data-open") === "true", true);
  });

  function onScroll() {
    updateSubnav();
    updateSpy();
    updateTabs();
    updateSeason();
    updateDock();
  }
  function onResize() { sizeSeasonPin(); onScroll(); }
  onResize();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("load", onResize);
  if (window.matchMedia) {
    /* zmiana szerokości okna / preferencji ruchu przełącza tryb osi sezonu */
    ["change"].forEach(function (ev) {
      seasonWideMQ.addEventListener && seasonWideMQ.addEventListener(ev, onResize);
      reducedMQ.addEventListener && reducedMQ.addEventListener(ev, onResize);
    });
  }
})();
