/* SwarmTriage shell JS (Slice 1) — menu pattern (DS v2 §7.1), desk
   switcher UI state, model-stack state labels, state-pattern demos.
   Slice 8 adds the lazy view loader at the foot: only this shell
   (config + decision core + this file) loads up front, staying under
   the DS v2 §11 30 KB JS budget; each view's script loads on approach
   and shell + any single view also stays under 30 KB. No framework. */
"use strict";
(function () {
  var cfg = window.SWARMTRIAGE_CONFIG || {};

  /* --- Mobile menu: toggle, Escape closes, focus moves in/out --- */
  var btn = document.getElementById("menuBtn");
  var panel = document.getElementById("menuPanel");
  if (btn && panel) {
    function closeMenu() {
      panel.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      btn.focus();
    }
    btn.addEventListener("click", function () {
      var open = panel.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        var first = panel.querySelector("a");
        if (first) first.focus();
      }
    });
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        panel.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* --- Desk switcher: UI state only in Slice 1 --- */
  var deskHost = document.getElementById("deskSwitch");
  var deskNote = document.getElementById("deskNote");
  if (deskHost && Array.isArray(cfg.DESKS)) {
    cfg.DESKS.forEach(function (desk, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "desk-btn";
      b.textContent = desk.name;
      b.setAttribute("aria-pressed", desk.id === "agicorp" ? "true" : "false");
      b.addEventListener("click", function () {
        deskHost.querySelectorAll(".desk-btn").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        if (deskNote) deskNote.textContent = "Desk: " + desk.name + " — " + desk.note + " (Model demo — the console's desk switcher scopes the real inbox.)";
      });
      deskHost.appendChild(b);
      if (desk.id === "agicorp" && deskNote) {
        deskNote.textContent = "Desk: " + desk.name + " — " + desk.note + " (Model demo — the console's desk switcher scopes the real inbox.)";
      }
    });
  }

  /* --- Model-stack state labels, straight from config --- */
  function setText(id, text) { var el = document.getElementById(id); if (el && text) el.textContent = text; }
  setText("ndiState", cfg.NDI_STATE);
  setText("claudeState", cfg.CLAUDE_STATE);
  setText("geminiState", cfg.GEMINI_STATE);
  setText("adobeState", cfg.ADOBE_STATE);

  /* --- State-pattern demos (§7.13): each button shows its state --- */
  function demo(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }
  var emptyBtn = document.getElementById("demoEmpty");
  var loadBtn = document.getElementById("demoLoading");
  var errBtn = document.getElementById("demoError");
  var okBtn = document.getElementById("demoSuccess");
  if (emptyBtn) emptyBtn.addEventListener("click", function () {
    demo("stateDemoOut", "<h4>No items on this desk yet</h4><p class='small'>Items routed to this desk will appear here with their decision and the rule that fired. Connect an inbox or submit an item through the agent API to see the first decision.</p>");
  });
  if (loadBtn) loadBtn.addEventListener("click", function () {
    demo("stateDemoOut", "<div aria-busy='true'><span class='visually-hidden'>Loading…</span><div class='skeleton w85'></div><div class='skeleton tall'></div><div class='skeleton w60'></div><p class='small'>Loading decisions…</p></div>");
  });
  if (errBtn) errBtn.addEventListener("click", function () {
    demo("stateDemoOut", "<div class='notice notice-danger' style='margin:0'><strong class='lead'>That decision could not be loaded.</strong>Nothing was lost — the item and its packet are unchanged. <button class='btn btn-secondary' type='button'>Try again</button></div>");
  });
  if (okBtn) okBtn.addEventListener("click", function () {
    demo("stateDemoOut", "<div class='notice notice-success' style='margin:0'><strong class='lead'>Decision recorded.</strong>Packet pkt_demo_shell is in the feed with its probabilities and the rule that fired. Next: a person reviews it in the console.</div>");
  });

  /* --- Slice 8: lazy view loader (performance budget fix) ---
     Each view script is an IIFE that wires its own section on execution,
     so executing it after the DOM exists is safe. A view loads once,
     when: its section comes within 800px of the viewport, the URL hash
     names it, or a nav link to it is activated. Without
     IntersectionObserver, all views load immediately (the Slice 1–7
     behaviour). A failed load is recorded, never silently retried. */
  var VIEW_SCRIPTS = [
    { section: "demo", src: "homepage.js" },
    { section: "console", src: "console.js" },
    { section: "agents", src: "agents.js" },
    { section: "pricing", src: "pricing.js" },
    { section: "email", src: "email.js" },
    { section: "workspace", src: "workspace.js" }
  ];
  var viewState = {}; // src -> "loading" | "loaded" | "error"
  function loadView(src) {
    if (viewState[src]) return;
    viewState[src] = "loading";
    var s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = function () { viewState[src] = "loaded"; };
    s.onerror = function () { viewState[src] = "error"; };
    document.body.appendChild(s);
  }
  function loadSection(sectionId) {
    VIEW_SCRIPTS.forEach(function (v) { if (v.section === sectionId) loadView(v.src); });
  }
  function loadForHash() {
    var h = (window.location.hash || "").replace(/^#/, "");
    if (h) loadSection(h);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { loadSection(en.target.id); io.unobserve(en.target); }
      });
    }, { rootMargin: "800px 0px" });
    VIEW_SCRIPTS.forEach(function (v) {
      var el = document.getElementById(v.section);
      if (el) io.observe(el);
    });
  } else {
    VIEW_SCRIPTS.forEach(function (v) { loadView(v.src); });
  }
  loadForHash();
  window.addEventListener("hashchange", loadForHash);
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function () { loadSection(a.getAttribute("href").slice(1)); });
  });
  /* Exposed for headless verification only. */
  window.SwarmLoader = { state: function () { return viewState; }, loadSection: loadSection };
})();
