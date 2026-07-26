/* =====================================================================
   CarboHort wireframe — project interactions (cw.js).
   Vanilla, dependency-free, defensive (every block no-ops if its markup
   is absent on the page). Drives the chrome + shared widgets. Page-specific
   modules (shop filters, configurator, B2B) are appended in their phase.
   ===================================================================== */
(function () {
  "use strict";
  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  /* --- Page scrim (shared by mega-menus) ------------------------------- */
  function scrim() { return $("[data-cw-scrim]"); }
  function showScrim(on) { var s = scrim(); if (s) s.setAttribute("data-open", on ? "true" : "false"); }

  /* --- Mega-menus (disclosure: button + .cw-mega panel) ---------------- */
  var openMega = null;
  function closeMega(focusTrigger) {
    if (!openMega) return;
    var t = openMega.trigger, p = openMega.panel;
    p.setAttribute("data-open", "false");
    t.setAttribute("aria-expanded", "false");
    openMega = null;
    showScrim(false);
    if (focusTrigger && t) t.focus();
  }
  function openMegaFor(trigger) {
    var panel = $("#" + trigger.getAttribute("aria-controls"));
    if (!panel) return;
    if (openMega) closeMega(false);
    panel.setAttribute("data-open", "true");
    trigger.setAttribute("aria-expanded", "true");
    openMega = { trigger: trigger, panel: panel };
    showScrim(true);
  }
  $$("[data-mega-trigger]").forEach(function (t) {
    t.addEventListener("click", function (e) {
      e.preventDefault();
      var isOpen = t.getAttribute("aria-expanded") === "true";
      if (isOpen) closeMega(true); else openMegaFor(t);
    });
  });
  // outside click on scrim closes
  var sc = scrim();
  if (sc) sc.addEventListener("click", function () { closeMega(false); });

  /* --- Mobile nav toggle ----------------------------------------------- */
  $$("[data-navtoggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = $("#" + btn.getAttribute("aria-controls"));
      if (!panel) return;
      var open = panel.getAttribute("data-open") === "true";
      panel.setAttribute("data-open", open ? "false" : "true");
      btn.setAttribute("aria-expanded", open ? "false" : "true");
    });
  });

  /* --- dr Jurek floating dock ------------------------------------------ */
  var dock = $("[data-jurek-dock]");
  var dockBackdrop = $("[data-jurek-backdrop]");
  var lastJurekTrigger = null;
  function setDock(open) {
    if (!dock) return;
    dock.setAttribute("data-open", open ? "true" : "false");
    if (dockBackdrop) dockBackdrop.setAttribute("data-open", open ? "true" : "false");
    if (open) { var inp = $("[data-jurek-input]", dock); if (inp) inp.focus(); }
    else if (lastJurekTrigger) { lastJurekTrigger.focus(); lastJurekTrigger = null; }
  }
  $$("[data-jurek-open]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); lastJurekTrigger = b; setDock(true); });
  });
  $$("[data-jurek-close]").forEach(function (b) { b.addEventListener("click", function () { setDock(false); }); });
  if (dockBackdrop) dockBackdrop.addEventListener("click", function () { setDock(false); });
  var jForm = $("[data-jurek-form]");
  if (jForm) {
    jForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var inp = $("[data-jurek-input]", dock); var msgs = $("[data-jurek-msgs]", dock);
      if (!inp || !msgs || !inp.value.trim()) return;
      if (dock && dock.getAttribute("data-open") !== "true") setDock(true);
      var u = doc.createElement("div"); u.className = "cw-msg cw-msg--user"; u.textContent = inp.value.trim(); msgs.appendChild(u);
      var a = doc.createElement("div"); a.className = "cw-msg";
      a.textContent = "Demo: w wersji docelowej dr Jurek dobierze odpowiedź na bazie wiedzy CarboHort.";
      msgs.appendChild(a); inp.value = ""; msgs.scrollTop = msgs.scrollHeight;
    });
  }

  /* --- Accordion (wf-accordion) ---------------------------------------- */
  $$(".wf-accordion__trigger").forEach(function (t) {
    var panel = t.nextElementSibling;
    var expanded = t.getAttribute("aria-expanded") === "true";
    if (panel && panel.classList.contains("wf-accordion__panel")) panel.hidden = !expanded;
    t.addEventListener("click", function () {
      var open = t.getAttribute("aria-expanded") === "true";
      t.setAttribute("aria-expanded", open ? "false" : "true");
      if (panel && panel.classList.contains("wf-accordion__panel")) panel.hidden = open;
    });
  });

  /* --- Tabs (wf-tabs: [data-tab] buttons + [data-panel] regions) ------- */
  $$("[data-tabs]").forEach(function (group) {
    var tabs = $$("[data-tab]", group);
    function select(name) {
      tabs.forEach(function (tb) {
        var on = tb.getAttribute("data-tab") === name;
        tb.setAttribute("aria-selected", on ? "true" : "false");
        tb.tabIndex = on ? 0 : -1;
      });
      $$("[data-panel]", group).forEach(function (p) {
        p.hidden = p.getAttribute("data-panel") !== name;
      });
    }
    tabs.forEach(function (tb) {
      tb.addEventListener("click", function () { select(tb.getAttribute("data-tab")); });
      tb.addEventListener("keydown", function (e) {
        var i = tabs.indexOf(tb), n = tabs.length;
        if (e.key === "ArrowRight") { e.preventDefault(); tabs[(i + 1) % n].focus(); tabs[(i + 1) % n].click(); }
        if (e.key === "ArrowLeft") { e.preventDefault(); tabs[(i - 1 + n) % n].focus(); tabs[(i - 1 + n) % n].click(); }
      });
    });
    var initial = group.getAttribute("data-tabs") || (tabs[0] && tabs[0].getAttribute("data-tab"));
    if (initial) select(initial);
  });

  /* --- Esc closes any open overlay ------------------------------------- */
  doc.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (openMega) { closeMega(true); return; }
    if (dock && dock.getAttribute("data-open") === "true") { setDock(false); return; }
  });

  /* --- Cart badge (demo: sessionStorage count) ------------------------- */
  try {
    var n = parseInt(sessionStorage.getItem("cw_cart") || "0", 10) || 0;
    $$("[data-cart-count]").forEach(function (el) {
      el.textContent = String(n);
      el.hidden = n === 0;
    });
  } catch (_) {}
})();
