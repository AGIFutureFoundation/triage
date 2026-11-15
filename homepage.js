/* SwarmTriage homepage (Slice 2) — live interactive demo on the exact
   decision core (decision-core.js). Demo engine only: every result is
   labelled, timings are local compute measured in this browser with
   performance.now() — never Drex latency. Reduced motion: no staged
   delays, results render immediately. */
"use strict";
(function () {
  var core = window.SwarmCore;
  if (!core) return;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var input = document.getElementById("demoInput");
  var runBtn = document.getElementById("demoRun");
  var traceHost = document.getElementById("demoTrace");
  var outHost = document.getElementById("demoOut");
  var samplesHost = document.getElementById("demoSamples");
  var allBtn = document.getElementById("demoRunAll");
  var allOut = document.getElementById("demoAllOut");
  if (!input || !runBtn || !outHost) return;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pct(v) { return Math.round(v * 100) + "%"; }

  /* Sample chips — the 5 app.py items, verbatim text. */
  if (samplesHost) {
    core.SAMPLE_ITEMS.forEach(function (item) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "sample-btn";
      b.textContent = item.id + " · " + item.label;
      b.addEventListener("click", function () { input.value = item.text; input.focus(); });
      samplesHost.appendChild(b);
    });
  }

  function isDocLike(text) {
    var t = text.toLowerCase();
    return t.indexOf("invoice") !== -1 || t.indexOf("grant") !== -1 || t.indexOf("pdf") !== -1 || t.indexOf("scan") !== -1;
  }

  function traceSteps(text) {
    var steps = [
      { name: "Reader agent", note: "Reads the raw item end to end. Gathers only — never decides." },
      { name: "Extractor agent", note: "Pulls the grounded facts: who, what is asked, any deadline, any amount." },
      { name: "Skeptic agent", note: "Challenges the read: checks suppress and wants-a-human signals first, flags ambiguity." }
    ];
    if (isDocLike(text)) {
      steps.push({ name: "NDI — document step", note: "Document-shaped item: parsed and grounded to text before deciding. (Station label — live NDI runs with the Nace key.)" });
    }
    steps.push({ name: "Drex — one call, five questions", note: "wants_human · is_interested · is_unsubscribe (noul) · category (choice) · urgency (score 0–3). Demo engine stands in, labelled." });
    steps.push({ name: "Rules — deterministic, in order", note: "First threshold crossed wins. The rule that fired is always shown with the decision." });
    return steps;
  }

  function renderTrace(steps, upto) {
    if (!traceHost) return;
    traceHost.innerHTML = steps.map(function (s, i) {
      var cls = i < upto ? "done" : (i === upto ? "active" : "");
      var ico = i < upto ? "✓" : (i === upto ? "…" : "·");
      return "<li class='" + cls + "'><span class='t-ico' aria-hidden='true'>" + ico + "</span><span><span class='t-name'>" + esc(s.name) + "</span><span class='t-note'>" + esc(s.note) + "</span></span></li>";
    }).join("");
  }

  /* viz-bars (DESIGN-POLISH §4.4): every probability bar carries the tick
     for its rule threshold, and the threshold in its text label. */
  function barRow(label, value, threshold) {
    var tick = threshold == null ? "" : "<span class='bar-tick' style='left:" + Math.round(threshold * 100) + "%' aria-hidden='true'></span>";
    var tlabel = threshold == null ? "" : " · threshold " + threshold.toFixed(2);
    return "<div class='bar-row'><span>" + esc(label + tlabel) + "</span><span class='bar-track'><span class='bar-fill' style='width:" + Math.round(value * 100) + "%'></span>" + tick + "</span><strong>" + pct(value) + "</strong></div>";
  }
  var BAR_LEGEND = "<p class='bar-legend'>Ticks mark the rule thresholds on each bar (0.70 unsubscribe / wants-human · 0.60 interest). A fill past its tick has crossed that rule's threshold; the rules fire in order, first crossed wins — the rule text below names the one that fired.</p>";

  function renderResult(text, answers, routed, ms) {
    var next = {
      "SUPPRESS": "The sender is removed from every queue. No reply is drafted and nothing is sent — suppression is absolute.",
      "HUMAN HANDOFF": "A human follows up personally and the agent leaves the thread. In the live service this flags Mike the same day.",
      "ACT TODAY": "The item is surfaced today with its deadline. Designed outputs (a one-pager or decision card) are produced at the Adobe Express station.",
      "CONVERSATIONAL REPLY": "Claude drafts a real reply for human approval (flag off in demo — no draft is generated here). Target: a genuine conversation within 10 minutes of a real inbound item.",
      "FILE / NO ACTION": "Filed with its packet. No outreach, no draft, no follow-up."
    }[routed.action] || "";
    outHost.innerHTML =
      "<div class='decision-panel " + esc(routed.cls) + "' role='status'>" +
      "<span class='chip chip-demo'>Demo engine — not a Drex result</span>" +
      "<h3 style='margin-top:10px'>" + esc(routed.action) + "</h3>" +
      "<p class='small' style='color:var(--text)'><strong>Rule that fired:</strong> " + esc(routed.why) + "</p>" +
      barRow("wants_human · noul", answers.wants_human.noul, 0.70) +
      barRow("is_interested · noul", answers.is_interested.noul, 0.60) +
      barRow("is_unsubscribe · noul", answers.is_unsubscribe.noul, 0.70) +
      BAR_LEGEND +
      "<div class='bar-row'><span>category · choice</span><span><strong>" + esc(answers.category.choice) + "</strong> <span class='caption'>(confidence " + pct(answers.category.confidence) + ")</span></span><span></span></div>" +
      "<div class='bar-row'><span>urgency · score</span><span><strong>" + answers.urgency.score + " / 3</strong> <span class='caption'>(confidence " + pct(answers.urgency.confidence) + ")</span></span><span></span></div>" +
      "<p class='small'><strong>What happens next:</strong> " + esc(next) + "</p>" +
      "<p class='caption'>Demo-engine compute on this device: " + ms.toFixed(3) + " ms (measured just now with performance.now()). Local heuristic timing only — not a Drex latency figure. Item decided: “" + esc(text.slice(0, 140)) + (text.length > 140 ? "…”" : "”") + "</p>" +
      "</div>";
  }

  function run() {
    var text = input.value.trim();
    if (!text) {
      outHost.innerHTML = "<div class='notice notice-danger' style='margin:0'><strong class='lead'>Paste an item first.</strong>Or pick one of the five sample items above — they are the exact items from the decision core.</div>";
      input.focus();
      return;
    }
    var steps = traceSteps(text);
    var t0 = performance.now();
    var answers = core.decideDemo(text);
    var routed = core.route(answers);
    var ms = performance.now() - t0;
    if (reduced || !traceHost) {
      if (traceHost) renderTrace(steps, steps.length);
      renderResult(text, answers, routed, ms);
      return;
    }
    var i = 0;
    renderTrace(steps, 0);
    outHost.innerHTML = "";
    (function tick() {
      i++;
      if (i < steps.length) { renderTrace(steps, i); setTimeout(tick, 340); }
      else { renderTrace(steps, steps.length); renderResult(text, answers, routed, ms); }
    })();
  }
  runBtn.addEventListener("click", run);

  /* Verify-all: run the 5 samples through the core, in this browser. */
  if (allBtn && allOut) {
    allBtn.addEventListener("click", function () {
      var rows = core.SAMPLE_ITEMS.map(function (item) {
        var t0 = performance.now();
        var a = core.decideDemo(item.text);
        var r = core.route(a);
        var ms = performance.now() - t0;
        return "<tr><td class='mono'>" + esc(item.id) + "</td><td>" + esc(item.label) + "</td><td>" + esc(a.category.choice) + "</td><td><strong>" + esc(r.action) + "</strong></td><td>" + ms.toFixed(3) + " ms</td></tr>";
      }).join("");
      allOut.innerHTML = "<table class='results'><thead><tr><th>Item</th><th>Sample</th><th>Category</th><th>Action</th><th>Demo-engine compute (this device)</th></tr></thead><tbody>" + rows + "</tbody></table><p class='caption'>All five expected routes: msg-1 HUMAN HANDOFF · msg-2 SUPPRESS · msg-3 ACT TODAY · msg-4 CONVERSATIONAL REPLY · msg-5 FILE / NO ACTION. Timings are local demo-engine compute, freshly measured — not Drex results.</p>";
    });
  }
})();
