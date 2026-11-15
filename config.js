/* SwarmTriage app config — the single place model-stack state lives.
   Flip a flag here (server-side) to change a slot's state; the UI reads
   these values and labels itself. Never put a key value in this file —
   keys are referenced by name only (agent-net PROTOCOL §9). */
"use strict";
window.SWARMTRIAGE_CONFIG = {
  /* Drex (Nace) — decides. Live only after a real NACE_API_KEY call is
     verified. Until then: demo engine = exact app.py core. */
  DREX_MODE: "demo", // "demo" | "live"
  DREX_ENDPOINT: "POST /v1/systemone (console.nace.ai, server-side)",
  DREX_KEY_REF: "NACE_API_KEY (server env, by name only)",

  /* Claude (Anthropic) — drafts replies after a CONVERSATIONAL REPLY route.
     API access exists; live call unverified. */
  CLAUDE_ENABLED: false,
  CLAUDE_STATE: "Slot built — integration behind this flag, demo mode until a live call is verified.",

  /* Gemini (Google) — long-document summary slot. No key on file. */
  GEMINI_ENABLED: false,
  GEMINI_STATE: "Slot built — awaiting key.",

  /* NDI (Nace Perception) — document step: PDFs / scans / spreadsheets /
     emails -> grounded text before Drex decides. */
  NDI_STATE: "Station in the pipeline — document -> grounded text. Runs on the Nace key via the console Perception API once live mode flips.",

  /* Adobe Express — designed-output step (cards, one-pagers, summaries). */
  ADOBE_STATE: "Account being set up today — asset specs STAGED in app/adobe-assets/, production pending the account.",
  ADOBE_ASSETS_STATE: "STAGED", // STAGED | VERIFIED (per asset, in its spec file)

  /* Desks — one per corporate holding (Reach Holding Mode). */
  DESKS: [
    { id: "agicorp", name: "AGI Corp", note: "SwarmTriage home desk — product, store, agent operations." },
    { id: "fellowship", name: "Fellowship", note: "AGI Fellowship Church — interviews, press, community. No commercial components on Fellowship surfaces." },
    { id: "foundation", name: "Foundation", note: "AGI Future Foundation — grants, programmes, research." },
    { id: "builderspace", name: "BuilderSpace", note: "BuilderSpace — tour, sessions, builder-employer matching." }
  ],

  /* Sponsor facts of record (Nace pricing docs, 2026-11-14). */
  NACE_FACTS: {
    signupBalance: "$5.00 signup balance per official pricing docs (console: bonus gated on adding a card)",
    inputPrice: "$0.03 / 1M input tokens",
    outputPrice: "output free",
    charging: "only HTTP 200s charged"
  }
};
