/* SwarmTriage console (Slice 3) — workspace on the exact decision core.
   DEMO inbox: msg-1..msg-5 verbatim app.py samples; msg-6..msg-10 written
   to the same shapes so every desk + action is exercised. Decisions are
   computed live by decision-core.js (demo engine, labelled). Approve /
   edit / send back change UI state ONLY — nothing sends or is stored. */
"use strict";
(function () {
  var core = window.SwarmCore, cfg = window.SWARMTRIAGE_CONFIG || {};
  if (!core) return;
  var $ = function (id) { return document.getElementById(id); };
  var listHost = $("consoleList"), detailHost = $("consoleDetail"), deskHost = $("consoleDeskSwitch"),
      deskNote = $("consoleDeskNote"), countsHost = $("consoleCounts"), filterHost = $("consoleFilters"), logHost = $("consoleLog");
  if (!listHost || !detailHost) return;
  var DESK_OF = { "msg-1": "fellowship", "msg-2": "agicorp", "msg-3": "foundation", "msg-4": "agicorp", "msg-5": "agicorp" };
  var EXTRA = [
    { id: "msg-6", desk: "builderspace", source: "email", label: "BuilderSpace pilot", text: "Hi, we run a coding meetup in a tour town. Tell me more about BuilderSpace sessions and what a pilot would look like for our builders?" },
    { id: "msg-7", desk: "fellowship", source: "email", label: "Interview request", text: "Hello, I would like to interview a Fellowship steward about the Ask Humanity project this week for our newsletter." },
    { id: "msg-8", desk: "foundation", source: "scan-invoice", label: "Invoice scan", text: "INVOICE #9920 - Amount due $0.00 - PAID IN FULL - thank you for your business." },
    { id: "msg-9", desk: "builderspace", source: "pdf-grant-notice", label: "Grant notice", text: "Grant notice for builder programmes: grant applications close Dec 12, 2026. Awards support tour-town coding spaces." },
    { id: "msg-10", desk: "fellowship", source: "email", label: "Unsubscribe", text: "Please unsubscribe me from Fellowship mail. Do not email me again." }
  ];
  var ITEMS = core.SAMPLE_ITEMS.map(function (s) {
    return { id: s.id, desk: DESK_OF[s.id], source: s.source, label: s.label, text: s.text, sample: true };
  }).concat(EXTRA);
  ITEMS.forEach(function (it) { it.answers = core.decideDemo(it.text); it.routed = core.route(it.answers); it.review = "pending"; it.note = ""; });
  var state = { desk: "agicorp", filter: "all", selected: null }, deskName = {};
  (cfg.DESKS || []).forEach(function (d) { deskName[d.id] = d.name; });
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pct(v) { return Math.round(v * 100) + "%"; }
  /* viz-bars (DESIGN-POLISH §4.4): tick at the rule threshold + threshold in the label. */
  function barRow(l, v, th) { var tick = th == null ? "" : "<span class='bar-tick' style='left:" + Math.round(th * 100) + "%' aria-hidden='true'></span>"; var tl = th == null ? "" : " · threshold " + th.toFixed(2); return "<div class='bar-row'><span>" + esc(l + tl) + "</span><span class='bar-track'><span class='bar-fill' style='width:" + Math.round(v * 100) + "%'></span>" + tick + "</span><strong>" + pct(v) + "</strong></div>"; }
  var BAR_LEGEND = "<p class='bar-legend'>Ticks mark the rule thresholds (0.70 unsubscribe / wants-human · 0.60 interest); rules fire in order, first crossed wins.</p>";
  function traceFor(it) {
    var s = [["Reader agent", "Read the raw item end to end. Gathered only — no decision taken."],
      ["Extractor agent", "Grounded facts: source " + it.source + " · desk " + (deskName[it.desk] || it.desk) + " · " + it.text.length + " characters."],
      ["Skeptic agent", "Checked suppress and wants-a-human signals first; challenged the read."]];
    if (/pdf|scan|invoice/.test(it.source)) s.push(["NDI — document step", "Document-shaped item: parsed and grounded to the text shown. Live NDI runs with the Nace key."]);
    s.push(["Drex — one call, five questions", "Demo engine stands in for Drex, labelled. Five answers below."]);
    s.push(["Rules — deterministic, in order", "First threshold crossed wins: " + it.routed.action + "."]);
    return s;
  }
  function nextText(a) {
    return { "SUPPRESS": "Suppression is absolute: the sender leaves every queue, no reply is drafted. Approving records a human confirmed it.",
      "HUMAN HANDOFF": "A human follows up personally; the agent leaves the thread. Approving flags the handoff — nothing sends from here.",
      "ACT TODAY": "Surfaced today with its deadline. A designed one-pager / decision card is an Adobe Express output (spec 02, STAGED).",
      "CONVERSATIONAL REPLY": "Claude drafts a real reply for approval once its flag is on (off in demo — the editor holds your own draft). Never a form letter.",
      "FILE / NO ACTION": "Filed with its packet. No outreach, no draft, no follow-up." }[a] || "";
  }
  function log(msg) { if (!logHost) return; var li = document.createElement("li"); li.textContent = msg + " — UI state only, nothing sent."; logHost.prepend(li); }
  function mine() { return ITEMS.filter(function (it) { return it.desk === state.desk; }); }
  function renderDesks() {
    if (!deskHost) return; deskHost.innerHTML = "";
    (cfg.DESKS || []).forEach(function (d) {
      var m = ITEMS.filter(function (it) { return it.desk === d.id; });
      var p = m.filter(function (it) { return it.review === "pending"; }).length;
      var b = document.createElement("button");
      b.type = "button"; b.className = "desk-btn"; b.textContent = d.name + " (" + m.length + ")";
      b.setAttribute("aria-pressed", d.id === state.desk ? "true" : "false");
      b.addEventListener("click", function () { state.desk = d.id; state.selected = null; renderAll(); renderDetail(); });
      deskHost.appendChild(b);
      if (d.id === state.desk && deskNote) deskNote.textContent = "Desk: " + d.name + " — " + d.note + " " + p + " of " + m.length + " items still need review.";
    });
  }
  var FILTERS = [["all", "All"], ["pending", "Needs review"], ["approved", "Approved"], ["edited", "Edited"], ["sent-back", "Sent back"]];
  function renderFilters() {
    if (!filterHost) return; filterHost.innerHTML = "";
    FILTERS.forEach(function (f) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "sample-btn" + (state.filter === f[0] ? " on" : ""); b.textContent = f[1];
      b.setAttribute("aria-pressed", state.filter === f[0] ? "true" : "false");
      b.addEventListener("click", function () { state.filter = f[0]; renderAll(); });
      filterHost.appendChild(b);
    });
  }
  function renderCounts() {
    if (!countsHost) return; var m = mine();
    var by = function (r) { return m.filter(function (it) { return it.review === r; }).length; };
    countsHost.textContent = m.length + " items · " + by("pending") + " need review · " + by("approved") + " approved · " + by("edited") + " edited · " + by("sent-back") + " sent back. Demo inbox — demo-engine decisions.";
  }
  function renderList() {
    var rows = mine().filter(function (it) { return state.filter === "all" || it.review === state.filter; });
    if (!rows.length) { listHost.innerHTML = "<div class='state-block'><h3>Nothing here under this filter</h3><p class='small'>No items match on the " + esc(deskName[state.desk] || state.desk) + " desk. Switch the filter or the desk — every desk holds demo items.</p></div>"; return; }
    listHost.innerHTML = "";
    rows.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "inbox-item" + (state.selected === it.id ? " sel" : "");
      b.setAttribute("aria-pressed", state.selected === it.id ? "true" : "false");
      b.innerHTML = "<span class='ii-top'><span class='mono'>" + esc(it.id) + "</span><span class='chip'>" + esc(it.source) + "</span>" +
        (it.review !== "pending" ? "<span class='chip chip-info'>" + esc(it.review) + "</span>" : "") + "</span>" +
        "<span class='ii-label'>" + esc(it.label) + (it.sample ? "" : " · demo") + "</span>" +
        "<span class='ii-snip'>" + esc(it.text.slice(0, 96)) + (it.text.length > 96 ? "…" : "") + "</span>" +
        "<span class='ii-act'><strong>" + esc(it.routed.action) + "</strong> · urgency " + it.answers.urgency.score + "/3</span>";
      b.addEventListener("click", function () { state.selected = it.id; renderList(); renderDetail(); });
      listHost.appendChild(b);
    });
  }
  function renderDetail() {
    var it = ITEMS.filter(function (x) { return x.id === state.selected; })[0];
    if (!it) { detailHost.innerHTML = "<div class='state-block'><h3>Pick an item</h3><p class='small'>Choose an item to see its full text, the gather-agent trace, the Drex decision with its five answers, the exact rule that fired, and the review actions. Review actions change UI state only — nothing sends.</p></div>"; return; }
    var trace = traceFor(it).map(function (s) {
      return "<li class='done'><span class='t-ico' aria-hidden='true'>✓</span><span><span class='t-name'>" + esc(s[0]) + "</span><span class='t-note'>" + esc(s[1]) + "</span></span></li>";
    }).join("");
    detailHost.innerHTML = "<div class='console-detail'>" +
      "<span class='chip chip-demo'>Demo engine — not a Drex result</span> <span class='chip'>" + esc(it.id) + " · " + esc(it.source) + " · " + esc(deskName[it.desk] || it.desk) + "</span>" +
      (it.review !== "pending" ? " <span class='chip chip-info'>Review: " + esc(it.review) + "</span>" : "") +
      "<h3>" + esc(it.label) + "</h3><p class='item-text'>" + esc(it.text) + "</p>" +
      "<h4>Agent trace</h4><ol class='trace'>" + trace + "</ol>" +
      "<div class='decision-panel " + esc(it.routed.cls) + "'><h4 style='margin-top:0'>Decision: " + esc(it.routed.action) + "</h4>" +
      barRow("wants_human · noul", it.answers.wants_human.noul, 0.70) + barRow("is_interested · noul", it.answers.is_interested.noul, 0.60) + barRow("is_unsubscribe · noul", it.answers.is_unsubscribe.noul, 0.70) +
      BAR_LEGEND +
      "<div class='bar-row'><span>category · choice</span><span><strong>" + esc(it.answers.category.choice) + "</strong> <span class='caption'>(confidence " + pct(it.answers.category.confidence) + ")</span></span><span></span></div>" +
      "<div class='bar-row'><span>urgency · score</span><span><strong>" + it.answers.urgency.score + " / 3</strong> <span class='caption'>(confidence " + pct(it.answers.urgency.confidence) + ")</span></span><span></span></div>" +
      "<p class='small' style='color:var(--text)'><strong>Rule that fired:</strong> " + esc(it.routed.why) + "</p>" +
      "<p class='small'><strong>What happens next:</strong> " + esc(nextText(it.routed.action)) + "</p>" +
      (it.note ? "<p class='small'><strong>Reviewer note / draft:</strong> " + esc(it.note) + "</p>" : "") + "</div>" +
      "<div class='action-row'><button class='btn btn-on-light' type='button' id='rvApprove'>Approve decision</button>" +
      "<button class='btn btn-secondary' type='button' id='rvEdit' style='color:var(--text);border-color:var(--line-strong)'>Edit note / draft</button>" +
      "<button class='btn btn-secondary' type='button' id='rvBack' style='color:var(--text);border-color:var(--line-strong)'>Send back</button></div>" +
      "<div id='rvForm'></div><p class='caption'>UI state only: these update this page and the activity log. Nothing is sent, saved, or shared — a reload resets the console.</p></div>";
    var form = $("rvForm");
    function setReview(r, msg) { it.review = r; log(it.id + " (" + (deskName[it.desk] || it.desk) + "): " + msg); renderAll(); renderDetail(); }
    $("rvApprove").addEventListener("click", function () { setReview("approved", "decision APPROVED (" + it.routed.action + ")"); });
    $("rvEdit").addEventListener("click", function () {
      form.innerHTML = "<label class='field-label' for='rvNote'>Reviewer note / draft reply</label><p class='field-help'>For a CONVERSATIONAL REPLY this holds the draft a human approves. Claude's slot is flag-off in demo, so this text is yours.</p><textarea id='rvNote' rows='4'>" + esc(it.note) + "</textarea><div class='action-row'><button class='btn btn-on-light' type='button' id='rvSave'>Save edit</button></div>";
      var ta = $("rvNote"); ta.focus();
      $("rvSave").addEventListener("click", function () { it.note = ta.value.trim(); setReview("edited", "note/draft EDITED"); });
    });
    $("rvBack").addEventListener("click", function () {
      form.innerHTML = "<label class='field-label' for='rvWhy'>Why is this going back?</label><p class='field-help'>In the live service, send-back returns the item to the gather swarm for a re-read. Here it records the reason in UI state only.</p><textarea id='rvWhy' rows='3' placeholder='e.g. Re-read — the deadline line looks wrong.'></textarea><div class='action-row'><button class='btn btn-danger' type='button' id='rvSendBack'>Confirm send back</button></div>";
      var ta = $("rvWhy"); ta.focus();
      $("rvSendBack").addEventListener("click", function () { it.note = ta.value.trim(); setReview("sent-back", "SENT BACK" + (it.note ? " — " + it.note : "")); });
    });
  }
  function renderAll() { renderDesks(); renderFilters(); renderCounts(); renderList(); }
  renderAll(); renderDetail();
})();
