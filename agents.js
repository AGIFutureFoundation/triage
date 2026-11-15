/* SwarmTriage agent-to-agent layer (Slice 4) — packet feed in agent-net
   shapes (PROTOCOL v1) + the "API for agents" try-it.
   REAL vs DEMO, kept apart everywhere:
   - The network feed in the page (static HTML) renders the 4 real
     agent-net packets from queue/index.json (generated 2026-11-13)
     with their real SHA-256 content / chain hashes and the real
     Merkle root — VERIFIED data, never recomputed here.
   - The SwarmTriage decision feed below is a DEMO feed: packets in
     the exact agent-net/1 shape, generated on this page from the
     exact decision core. Their chain hashes are real SHA-256 digests
     of the packet text, computed in-page with SubtleCrypto — but the
     packets are NOT committed to the agent-net repo, and are labelled
     demo. If SubtleCrypto is unavailable (non-secure context), the
     feed falls back to a labelled FNV-1a demo hash and says so.
   Claim-by-commit here is UI state only: first claim wins on this
   page, nothing is written anywhere. */
"use strict";
(function () {
  var core = window.SwarmCore;
  var feedHost = document.getElementById("demoFeed");
  var chainHost = document.getElementById("chainStrip");
  var algoNote = document.getElementById("hashAlgoNote");
  var tryForm = document.getElementById("apiTryForm");
  if (!feedHost) return;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function shortHash(h) { return h ? h.slice(0, 16) + "…" : "—"; }

  /* --- Hashing: real SHA-256 via SubtleCrypto; labelled FNV fallback --- */
  var HAS_SUBTLE = !!(window.crypto && crypto.subtle && window.TextEncoder);
  if (algoNote) algoNote.textContent = HAS_SUBTLE
    ? "Demo-feed chain hashes on this page are real SHA-256 digests of each packet's text, computed in your browser (SubtleCrypto) and chained onto the previous packet's hash — the same construction as agent-net's hash.json, on demo packets only."
    : "This browser context has no SubtleCrypto, so demo-feed hashes below are FNV-1a demo hashes (labelled, shape only) — not SHA-256. The real network hashes in the static feed above are SHA-256 from agent-net's index.";
  function fnvHex(text) {
    var h1 = 0x811c9dc5, out = "";
    for (var round = 0; round < 8; round++) {
      var h = h1 ^ (round * 0x9e3779b9);
      for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i) + round; h = Math.imul(h, 0x01000193); }
      out += ("0000000" + (h >>> 0).toString(16)).slice(-8);
    }
    return out; // 64 hex chars, FNV-1a based — demo shape only
  }
  function hashText(text) {
    if (!HAS_SUBTLE) return Promise.resolve(fnvHex(text));
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
    });
  }

  /* ============ Demo decision-packet feed (agent-net/1 shape) ============ */
  var PROJECT_OF = { "msg-1": "fellowship", "msg-3": "foundation", "msg-4": "agicorp", "msg-6": "builderspace" };
  function nextStation(action, source) {
    var s = [];
    if (/pdf|scan/.test(source)) s.push("ndi: grounded before deciding");
    if (action === "ACT TODAY") s.push("adobe-express: decision card (spec 02, STAGED)");
    if (action === "CONVERSATIONAL REPLY") s.push("claude: draft slot (flag off in demo)");
    if (action === "HUMAN HANDOFF") s.push("human: a human follows up, agent leaves thread");
    if (action === "SUPPRESS") s.push("suppression: absolute, no draft, no re-queue");
    return s.length ? s.join(" · ") : "file: no further station";
  }
  var byId = {};
  if (core) {
    core.SAMPLE_ITEMS.concat([{ id: "msg-6", source: "email", label: "BuilderSpace pilot", text: "Hi, we run a coding meetup in a tour town. Tell me more about BuilderSpace sessions and what a pilot would look like for our builders?" }])
      .forEach(function (it) { byId[it.id] = it; });
  }
  var GENESIS = "0000000000000000000000000000000000000000000000000000000000000000";
  var packets = [], prevHash = GENESIS;
  function addPacket(p) {
    p.prev = prevHash;
    return hashText(p.id + "|" + p.from + "|" + p.to + "|" + p.kind + "|" + p.project + "|" + p.body + "|" + p.prev).then(function (h) {
      p.hash = h; prevHash = h; packets.push(p); return p;
    });
  }
  function nextId() { return "DEMO-20261114-" + String(packets.length + 1).padStart(3, "0"); }
  function submitPacket(item, fromAgent, project) {
    return addPacket({
      id: nextId(), from: fromAgent, to: "swarmtriage", kind: "task",
      project: project || PROJECT_OF[item.id] || "agicorp", status: "done", needs: "decision",
      title: "Decide one item — " + item.id + " · " + item.label,
      body: "item: { source: " + item.source + ", text: \"" + item.text + "\" } · questions: [wants_human, is_interested, is_unsubscribe, category, urgency]"
    });
  }
  function decisionPacket(item, submitter, project) {
    var a = core.decideDemo(item.text), r = core.route(a);
    return addPacket({
      id: nextId(), from: "swarmtriage", to: submitter, kind: "result",
      project: project || PROJECT_OF[item.id] || "agicorp", status: "done", needs: "review",
      title: "Decision — " + item.id + " → " + r.action,
      body: "answers: wants_human " + a.wants_human.noul + " · is_interested " + a.is_interested.noul + " · is_unsubscribe " + a.is_unsubscribe.noul + " · category " + a.category.choice + " (" + a.category.confidence + ") · urgency " + a.urgency.score + "/3 (" + a.urgency.confidence + ") · action: " + r.action + " · rule: " + r.why + " · stations: " + nextStation(r.action, item.source) + " · mode: DEMO ENGINE — not a Drex result"
    });
  }
  function renderChain() {
    if (!chainHost) return;
    chainHost.innerHTML = packets.map(function (p, i) {
      return (i ? "<span class='chain-arrow' aria-hidden='true'>→</span>" : "") +
        "<span class='chain-node' title='hash " + esc(p.hash || "") + "'><strong>" + esc(p.id.replace("DEMO-20261114-", "…-")) + "</strong><span class='mono'>" + esc(shortHash(p.hash)) + "</span></span>";
    }).join("");
  }
  function renderFeed() {
    feedHost.innerHTML = "";
    packets.slice().reverse().forEach(function (p) {
      var card = document.createElement("article");
      card.className = "packet-card";
      var statusChip = p.status === "done" ? "chip-live" : (p.status === "claimed" ? "chip-info" : "chip-demo");
      card.innerHTML =
        "<div class='pk-top'><span class='mono'><strong>" + esc(p.id) + "</strong></span>" +
        "<span class='chip " + statusChip + "'>" + esc(p.status) + "</span><span class='chip'>" + esc(p.kind) + "</span><span class='chip'>" + esc(p.project) + "</span></div>" +
        "<h4>" + esc(p.title) + "</h4>" +
        "<div class='packet'>packet: agent-net/1\nfrom: " + esc(p.from) + " · to: " + esc(p.to) + " · needs: " + esc(p.needs) + "\n" + esc(p.body) + "</div>" +
        "<p class='caption mono'>hash " + esc(shortHash(p.hash)) + " · prev " + esc(shortHash(p.prev)) + "</p>" +
        (p.claimedBy ? "<p class='small'>Claimed by <strong>" + esc(p.claimedBy) + "</strong> — first claim wins; this packet is taken.</p>" : "") +
        (p.status === "open" ? "<div class='action-row'><button class='btn btn-on-light pk-claim' type='button'>Claim this packet</button></div><p class='caption'>Claim-by-commit, PROTOCOL §3 — on this page the claim is UI state only; in the repo it is a claim.md + commit, and the first committed claim wins.</p>" : "");
      var btn = card.querySelector(".pk-claim");
      if (btn) btn.addEventListener("click", function () { p.status = "claimed"; p.claimedBy = "you (demo visitor)"; renderFeed(); });
      feedHost.appendChild(card);
    });
    renderChain();
  }
  /* Seed: two completed round-trips, one open+claimable, one claimed. */
  (function seed() {
    if (!core) { feedHost.innerHTML = "<div class='state-block'><h3>Decision core unavailable</h3><p class='small'>The demo feed needs decision-core.js. The static network feed and API documentation above are unaffected.</p></div>"; return; }
    var openItem = byId["msg-6"];
    submitPacket(byId["msg-3"], "field-agent")
      .then(function () { return decisionPacket(byId["msg-3"], "field-agent"); })
      .then(function () { return submitPacket(byId["msg-1"], "inbox-agent"); })
      .then(function () { return decisionPacket(byId["msg-1"], "inbox-agent"); })
      .then(function () {
        return addPacket({
          id: nextId(), from: "inbox-agent", to: "swarmtriage", kind: "task", project: "builderspace",
          status: "open", needs: "decision", title: "Decide one item — msg-6 · BuilderSpace pilot",
          body: "item: { source: email, text: \"" + openItem.text + "\" } · questions: [wants_human, is_interested, is_unsubscribe, category, urgency] · Unclaimed — first committed claim wins (PROTOCOL §3)."
        });
      })
      .then(function () {
        return addPacket({
          id: nextId(), from: "field-agent", to: "swarmtriage", kind: "task", project: "agicorp",
          status: "claimed", needs: "decision", claimedBy: "swarm-gather (demo)", title: "Decide one item — msg-4 · Partner reply",
          body: "item: { source: email, text: \"" + byId["msg-4"].text + "\" } · Claimed in this demo feed — a second claim is refused, first claim wins."
        });
      })
      .then(renderFeed)
      .catch(function () { feedHost.innerHTML = "<div class='state-block'><h3>Demo feed could not be built</h3><p class='small'>Hashing failed in this browser context. The static network feed and API documentation above are unaffected.</p></div>"; });
  })();

  /* ============ API try-it: submit in the documented shape ============ */
  if (tryForm && core) {
    tryForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var fromEl = document.getElementById("apiFrom"), projEl = document.getElementById("apiProject"),
          srcEl = document.getElementById("apiSource"), textEl = document.getElementById("apiText"),
          outEl = document.getElementById("apiOut");
      if (!textEl || !outEl) return;
      var text = textEl.value.trim();
      if (!text) { outEl.innerHTML = "<div class='notice notice-danger' style='margin:0'><strong class='lead'>An item text is required.</strong>The decide call takes one grounded item per packet.</div>"; textEl.focus(); return; }
      var item = { id: "msg-live", source: srcEl ? srcEl.value : "pasted", label: "Try-it item", text: text };
      var fromAgent = (fromEl && fromEl.value.trim()) || "your-agent";
      var project = projEl ? projEl.value : "agicorp";
      var t0 = performance.now();
      var a = core.decideDemo(text), r = core.route(a);
      var ms = performance.now() - t0;
      var req = { packet: "agent-net/1", from: fromAgent, item: { source: item.source, text: text }, questions: ["wants_human", "is_interested", "is_unsubscribe", "category", "urgency"] };
      hashText(text + prevHash).then(function (digest) {
        var res = { packet: "agent-net/1", packet_id: "demo-" + digest.slice(0, 16), answers: a, action: r.action, rule: r.why, mode: "DEMO ENGINE — not a Drex result", demo_engine_ms_this_device: Number(ms.toFixed(3)) };
        return submitPacket(item, fromAgent, project).then(function (sub) {
          return decisionPacket(item, fromAgent, project).then(function (dec) { return { sub: sub, dec: dec, res: res }; });
        });
      }).then(function (x) {
        outEl.innerHTML =
          "<h4>Request packet — as documented</h4><div class='packet'>" + esc(JSON.stringify(req, null, 2)) + "</div>" +
          "<h4>Decision packet — returned</h4><div class='packet'>" + esc(JSON.stringify(x.res, null, 2)) + "</div>" +
          "<p class='caption'>Both packets were also appended to the demo feed above (" + esc(x.sub.id) + " → " + esc(x.dec.id) + "), chained onto the feed's previous hash. Demo engine only — in live mode the same shapes return from the server-side Drex call, mode: LIVE Drex.</p>";
        renderFeed();
      });
    });
  }
})();
