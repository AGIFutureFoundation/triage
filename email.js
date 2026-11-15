/* SwarmTriage — Slice 6: email branding behaviour.
   Template previews only: nothing sends, nothing is saved, and no
   address entered here leaves the page. The three templates (decision
   digest, alert, welcome) are static HTML in index.html; this script
   owns the template switcher, the desk / recipient personalisation,
   and the designed <-> plain-text view toggle.
   Personalisation follows the standing email-voice rule: copy is from
   AGI's perspective, and the human-handoff name follows the desk —
   Mike generally, Russell on Foundation matters, a Fellowship steward
   on the Fellowship desk. */
"use strict";
(function () {
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var HANDOFF = {
    agicorp: "Mike",
    builderspace: "Mike",
    foundation: "Russell",
    fellowship: "a Fellowship steward"
  };
  var DESK_NAMES = {
    agicorp: "AGI Corp",
    builderspace: "BuilderSpace",
    foundation: "Foundation",
    fellowship: "Fellowship"
  };

  /* --- Template switcher: one preview at a time --- */
  var switcher = $("emailTplSwitch");
  var panels = {
    digest: $("tpl-digest"),
    alert: $("tpl-alert"),
    welcome: $("tpl-welcome")
  };
  var current = "digest";
  function showTemplate(id) {
    if (!panels[id]) return;
    current = id;
    Object.keys(panels).forEach(function (k) {
      if (panels[k]) panels[k].hidden = k !== id;
    });
    if (switcher) {
      switcher.querySelectorAll("[data-tpl]").forEach(function (b) {
        var on = b.getAttribute("data-tpl") === id;
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
  }
  if (switcher) {
    switcher.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-tpl]");
      if (b) showTemplate(b.getAttribute("data-tpl"));
    });
  }

  /* --- Designed / plain-text view toggle ---
     The plain-text view is the same copy with no header art and no
     styling: the proof that every template reads fully with images
     off (spec 04 — substantive copy is never baked into the image). */
  var view = "designed";
  function showView(v) {
    view = v;
    document.querySelectorAll(".tpl-designed").forEach(function (el) {
      el.hidden = v !== "designed";
    });
    document.querySelectorAll(".tpl-text").forEach(function (el) {
      el.hidden = v !== "text";
    });
    ["emailViewDesigned", "emailViewText"].forEach(function (id) {
      var b = $(id);
      if (b) {
        var on = (id === "emailViewDesigned") === (v === "designed");
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      }
    });
    var note = $("emailViewNote");
    if (note) {
      note.textContent = v === "text"
        ? "Plain-text view: identical words, no header art, no styling. If a template only made sense designed, it would fail here — these do not."
        : "Designed view: header art is the Adobe Express spec 04 placeholder (STAGED). All substantive copy is real text below it.";
    }
  }
  var vd = $("emailViewDesigned");
  var vt = $("emailViewText");
  if (vd) vd.addEventListener("click", function () { showView("designed"); });
  if (vt) vt.addEventListener("click", function () { showView("text"); });

  /* --- Personalisation: desk + recipient first name (page state only) --- */
  function personalise() {
    var deskSel = $("emailDesk");
    var nameIn = $("emailName");
    var deskId = deskSel ? deskSel.value : "agicorp";
    var deskName = DESK_NAMES[deskId] || "AGI Corp";
    var handoff = HANDOFF[deskId] || "Mike";
    var raw = nameIn ? (nameIn.value || "").trim() : "";
    var first = raw ? raw.split(/\s+/)[0] : "there";
    document.querySelectorAll("[data-desk-name]").forEach(function (el) {
      el.textContent = deskName;
    });
    document.querySelectorAll("[data-handoff-name]").forEach(function (el) {
      el.textContent = handoff;
    });
    document.querySelectorAll("[data-recipient-name]").forEach(function (el) {
      el.textContent = first;
    });
    var note = $("emailNote");
    if (note) {
      note.textContent = "Previewing for the " + deskName + " desk" +
        (raw ? ", addressed to " + first : "") +
        ". Human handoff in every template names " + handoff + " on this desk. Nothing sends from this page.";
    }
  }
  var deskSelEl = $("emailDesk");
  var nameEl = $("emailName");
  if (deskSelEl) deskSelEl.addEventListener("change", personalise);
  if (nameEl) nameEl.addEventListener("input", personalise);

  showTemplate("digest");
  showView("designed");
  personalise();

  /* Exposed for headless verification only. */
  window.SwarmEmail = { showTemplate: showTemplate, showView: showView, personalise: personalise,
    state: function () { return { template: current, view: view }; },
    esc: esc };
})();
