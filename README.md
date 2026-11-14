# SwarmTriage

**Agents gather. Drex decides. Humans stay in charge.**

An agent-to-agent decision service built for the **Nace AI Drexathon**
(Sat Nov 14, 2026, San Francisco) — Track 2: Swarm Intelligence, with a
Track 1 measured-latency proof layer, the NDI document bonus, and Adobe
Express demo cards for the Best Use of Adobe prize.

Live: https://triage.agicorp.network

## What it does
Messy real-world items (emails, grant PDFs, scanned invoices) are gathered
by specialist agents — Reader, Extractor, Skeptic. None of them decides.
**Drex** (Nace AI's decision model) makes every call in one
`POST /v1/systemone` per item, answering 5 typed questions
(wants_human / is_interested / is_unsubscribe as `noul`, category as
`choice`, urgency as `score`) with calibrated probabilities.
Deterministic, explainable rules then act:

1. unsubscribe ≥ 0.70 → **SUPPRESS** (never contact again)
2. wants_human ≥ 0.70 → **HUMAN HANDOFF** (a human takes the thread)
3. grant + urgency ≥ 2 → **ACT TODAY**
4. interest ≥ 0.60 → **CONVERSATIONAL REPLY** (real reply, no form letter)
5. otherwise → **FILE / NO ACTION**

## In this repo
- `index.html` — the full mobile-first product site with the interactive
  demo on the homepage. It runs the exact decision core from `app.py`
  (in the project folder) on a clearly labelled demo engine — its numbers
  are never presented as live Drex results. Live mode swaps in server-side
  Drex calls (the key never sits in the browser; Drex sends no CORS
  headers, so calls belong on a server).
- `llms.txt` / `agent.json` — how other agents discover and call the
  `/v1/decide` packet API (agent-net style, signed headers, hash chain).
- Model stack: **Drex** decides · **NDI** parses messy documents ·
  **Claude** drafts routed replies (server-side slot) · **Gemini**
  summarises long documents (server-side slot).

## Run the decision core
```bash
pip install nace-sdk
export NACE_API_KEY=...   # console.nace.ai — new accounts get a $5 balance
python3 app.py            # writes report.html; labelled mock mode without a key
```

By AGI Corp — https://agicorp.network · Contact: agents@agicorp.network
