/* SwarmTriage — Slice 5: pricing behaviour.
   Registry snapshot is a labelled copy of the check performed in this
   build loop against PRICES.json v2026-11-13.1 on 2026-11-14 — it is
   NOT a live fetch. If the registry changes, this snapshot must be
   re-checked and updated in the same run that renders the new entry.
   Interest form is UI state only: nothing sends, nothing persists. */
"use strict";
(function () {
  var REGISTRY_SNAPSHOT = {
    file: "PRICES.json",
    version: "2026-11-13.1",
    checked: "2026-11-14",
    itemCount: 55,
    searchedFields: ["id", "name", "ref"],
    searchedTerms: ["triage", "swarm"],
    triageHits: 0,
    x402: [
      { id: "x402-hire-brief", price: "$0.10 per call", state: "GATED-DEPLOY" },
      { id: "x402-lab-data", price: "$0.25 per call", state: "GATED-DEPLOY" },
      { id: "x402-tip", price: "$1.00", state: "GATED-DEPLOY" }
    ]
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* --- Registry re-check explainer (snapshot, labelled) --- */
  var recheckBtn = $("registryRecheck");
  var recheckOut = $("registryRecheckOut");
  if (recheckBtn && recheckOut) {
    recheckBtn.addEventListener("click", function () {
      var rows = REGISTRY_SNAPSHOT.x402.map(function (e) {
        return "<li><span class=\"mono\">" + esc(e.id) + "</span> — " + esc(e.price) + " · " + esc(e.state) + "</li>";
      }).join("");
      recheckOut.innerHTML =
        "<span style=\"display:block;margin-top:10px\">Snapshot of the check run in this build loop on " + esc(REGISTRY_SNAPSHOT.checked) +
        " against <span class=\"mono\">" + esc(REGISTRY_SNAPSHOT.file) + "</span> v" + esc(REGISTRY_SNAPSHOT.version) +
        " (" + REGISTRY_SNAPSHOT.itemCount + " items): fields <span class=\"mono\">" + esc(REGISTRY_SNAPSHOT.searchedFields.join(" / ")) +
        "</span> searched for “" + esc(REGISTRY_SNAPSHOT.searchedTerms.join("” / “")) + "” → <strong>" + REGISTRY_SNAPSHOT.triageHits +
        " SwarmTriage entries</strong>. Adjacent agent-facing entries found:</span>" +
        "<ul style=\"margin:6px 0 0;padding-left:20px\">" + rows + "</ul>" +
        "<span style=\"display:block;margin-top:6px\">This is a dated snapshot rendered on this page, not a live registry fetch. A newer registry version requires a fresh check before any figure on this page changes.</span>";
      recheckBtn.disabled = true;
      recheckBtn.textContent = "Registry snapshot shown below";
    });
  }

  /* --- Register interest (UI state only) --- */
  var form = $("pricingInterestForm");
  var out = $("piOut");
  var log = $("piLog");
  var err = $("piError");
  var entries = [];
  if (!form || !out || !log) return;

  function deskName(id) {
    var cfg = window.SWARMTRIAGE_CONFIG;
    if (cfg && cfg.DESKS) {
      for (var i = 0; i < cfg.DESKS.length; i++) {
        if (cfg.DESKS[i].id === id) return cfg.DESKS[i].name;
      }
    }
    return id;
  }

  function renderLog() {
    if (!entries.length) {
      log.innerHTML = "<li class=\"empty-note\">No interest recorded yet this session.</li>";
      return;
    }
    log.innerHTML = entries.map(function (e) {
      return "<li><strong>" + esc(e.shape) + "</strong> · " + esc(e.desk) +
        " · " + esc(e.email) + (e.note ? " — “" + esc(e.note) + "”" : "") +
        " <span class=\"caption\">(page-only record, " + esc(e.when) + ")</span></li>";
    }).join("");
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var email = ($("piEmail").value || "").trim();
    var shape = $("piShape").value;
    var deskId = $("piDesk").value;
    var note = ($("piNote").value || "").trim();
    if (!email || email.indexOf("@") < 1 || email.indexOf(".") < 0) {
      if (err) { err.style.display = "block"; err.textContent = "Please enter an email address with an @ and a domain, so the record names who to reach when pricing lands."; }
      out.innerHTML = "";
      return;
    }
    if (err) { err.style.display = "none"; err.textContent = ""; }
    var entry = {
      email: email, shape: shape, desk: deskName(deskId), note: note,
      when: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    };
    entries.unshift(entry);
    renderLog();
    out.innerHTML =
      "<div class=\"notice notice-success\" role=\"note\" style=\"margin-top:14px\">" +
      "<strong class=\"lead\">Interest recorded — on this page only</strong>" +
      "Shape: <strong>" + esc(entry.shape) + "</strong> · Starting desk: <strong>" + esc(entry.desk) + "</strong> · Reach: " + esc(entry.email) + ". " +
      "Nothing was sent or saved; a reload clears this record. When a SwarmTriage entry enters <span class=\"mono\">PRICES.json</span>, this section will show its figure and state verbatim — and a human, not a checkout bot, is the follow-up path. If you would rather talk to a person now, say so in the note next time and a human handoff is the next step." +
      "</div>";
    form.reset();
    var shapeSel = $("piShape"); if (shapeSel) shapeSel.value = "Network";
  });
})();
