/* SwarmTriage decision core — verbatim port of the Drexathon core.
   Source of record: ~/workspace/drexathon-2026-11/app.py
     - mock_drex()  -> decideDemo() below (same keywords, same probabilities)
     - route()      -> route() below (same thresholds, same order, same text)
   DEMO ENGINE: heuristic stand-in, labelled everywhere in the UI.
   LIVE SWAP POINT: in live mode, decideDemo() is replaced by a server-side
   POST /v1/systemone call (Nace Drex) returning the same shape:
     { wants_human:{noul}, is_interested:{noul}, is_unsubscribe:{noul},
       category:{choice, confidence}, urgency:{score, confidence}, mode }
   The browser never holds NACE_API_KEY. */
"use strict";

function _p(t, words, base, hit) {
  base = base === undefined ? 0.06 : base;
  hit = hit === undefined ? 0.88 : hit;
  return words.some(function (w) { return t.indexOf(w) !== -1; }) ? hit : base;
}

/* === app.py mock_drex, 1:1 === */
function decideDemo(state) {
  var t = String(state).toLowerCase();
  var wants_human = _p(t, ["human", "speak directly", "call me"]);
  var unsub = _p(t, ["unsubscribe", "do not email"]);
  var interested;
  if (t.indexOf("tell me more") !== -1 || t.indexOf("pilot") !== -1) interested = 0.82;
  else if (t.indexOf("interview") !== -1) interested = 0.74;
  else interested = 0.18;
  var category, urgency;
  if (t.indexOf("grant") !== -1) { category = "grant"; urgency = 2; }
  else if (t.indexOf("tell me more") !== -1 || t.indexOf("pilot") !== -1) { category = "partner"; urgency = 1; }
  else if (t.indexOf("interview") !== -1) { category = "interview"; urgency = 2; }
  else if (unsub > 0.5) { category = "admin"; urgency = 1; }
  else if (t.indexOf("invoice") !== -1) { category = "admin"; urgency = 0; }
  else { category = "partner"; urgency = 1; }
  return {
    wants_human: { noul: wants_human },
    is_interested: { noul: interested },
    is_unsubscribe: { noul: unsub },
    category: { choice: category, confidence: 0.81 },
    urgency: { score: urgency, confidence: 0.77 },
    mode: "DEMO ENGINE — not a Drex result"
  };
}

/* === app.py route, 1:1 (order matters) === */
function route(a) {
  if (a.is_unsubscribe.noul >= 0.70)
    return { action: "SUPPRESS", why: "Unsubscribe probability >= 0.70 — remove from all queues, never contact again.", cls: "suppress" };
  if (a.wants_human.noul >= 0.70)
    return { action: "HUMAN HANDOFF", why: "Wants-human probability >= 0.70 — a human (Mike) follows up personally, agent leaves the thread.", cls: "handoff" };
  if (a.category.choice === "grant" && a.urgency.score >= 2)
    return { action: "ACT TODAY", why: "Grant with a deadline and urgency >= 2 — surface to Mike today with the closing date.", cls: "today" };
  if (a.is_interested.noul >= 0.60)
    return { action: "CONVERSATIONAL REPLY", why: "Interest probability >= 0.60 — reply in a real conversation within 10 minutes, no form letter.", cls: "reply" };
  return { action: "FILE / NO ACTION", why: "No threshold crossed — file it, no outreach.", cls: "file" };
}

/* The five typed questions Drex answers in one System One call. */
var QUESTIONS = [
  { id: "wants_human", type: "noul", label: "wants_human · noul", hint: "probability the sender wants a human, not an agent" },
  { id: "is_interested", type: "noul", label: "is_interested · noul", hint: "probability the sender is genuinely interested" },
  { id: "is_unsubscribe", type: "noul", label: "is_unsubscribe · noul", hint: "probability this is an unsubscribe / do-not-contact request" },
  { id: "category", type: "choice", label: "category · choice", hint: "interview | press | grant | partner | support | spam | admin" },
  { id: "urgency", type: "score", label: "urgency · score 0–3", hint: "0 routine, 1 this week, 2 today, 3 immediate" }
];

/* The 5 sample items from app.py ITEMS, verbatim. */
var SAMPLE_ITEMS = [
  { id: "msg-1", source: "email", label: "Reporter interview", text: "Hi - loved the Fellowship piece. I'd like to interview Mike this week for a story. Can I speak directly with a human to set it up? - Anna, reporter" },
  { id: "msg-2", source: "email", label: "Unsubscribe", text: "Unsubscribe me please. Do not email me again." },
  { id: "msg-3", source: "pdf-grant-notice", label: "Grant PDF", text: "Pollination Project seed grant: applications close Nov 30, 2026 11:59 PM ET. Awards up to $1,000 for early-stage changemakers. Referee required." },
  { id: "msg-4", source: "email", label: "Partner reply", text: "Interesting project. Tell me more about how the agent interviews work and what a pilot would look like?" },
  { id: "msg-5", source: "scan-invoice", label: "Invoice scan", text: "INVOICE #4471 - Amount due $0.00 - PAID IN FULL - thank you for your business." }
];

window.SwarmCore = { decideDemo: decideDemo, route: route, QUESTIONS: QUESTIONS, SAMPLE_ITEMS: SAMPLE_ITEMS };
