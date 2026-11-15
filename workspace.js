/* SwarmTriage — Slice 7: accounts / workspaces scaffolding behaviour.
   SCAFFOLD ONLY: there is no auth backend, no account is created, no
   session is started, and nothing entered here is sent, saved, or
   shared. Every form on this section changes page state only and says
   so at the point of use. The shapes here — sign-in, workspace/desk
   model, roles, invites — are the contract the live backend will
   implement in the watched live-flip; flipping to live is a server-side
   change, never a UI rewrite (same pattern as config.js).
   Desk data is read from config.js DESKS so there is one source. */
"use strict";
(function () {
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  var cfg = window.SWARMTRIAGE_CONFIG || {};
  var DESKS = Array.isArray(cfg.DESKS) ? cfg.DESKS : [];

  var HANDOFF = {
    agicorp: "Mike",
    builderspace: "Mike",
    foundation: "Russell",
    fellowship: "a Fellowship steward"
  };
  var DESK_SCOPE = {
    agicorp: "Product, store and agent operations. SwarmTriage's home desk.",
    fellowship: "Interviews, press and community. No commercial components on Fellowship surfaces.",
    foundation: "Grants, programmes and research.",
    builderspace: "Tour, sessions and builder-employer matching."
  };

  var ROLES = {
    owner: {
      label: "Owner",
      summary: "Owns the workspace. Full control, including the actions no other role can take.",
      can: ["View every desk in the workspace", "Approve, edit and send back any decision", "Invite and remove members, assign any role", "Manage suppression and the human-handoff queue", "Delete the workspace and transfer ownership"],
      cannot: ["Bypass suppression — no role can re-queue a suppressed address", "Send without the live approval step once live mode is on"]
    },
    steward: {
      label: "Steward (Admin)",
      summary: "Runs a desk day to day. Converts intake into packets, keeps separation structural.",
      can: ["View desks in scope", "Approve, edit and send back decisions in scope", "Invite members into desks in scope, assign Reviewer or Viewer", "Convert intake into agent-net packets with a named from and one holding scope"],
      cannot: ["Delete the workspace or transfer ownership", "Assign the Owner role", "Act on a desk outside scope"]
    },
    reviewer: {
      label: "Reviewer (Operator)",
      summary: "The human in charge of decisions. Reviews what Drex routed and decides what happens next.",
      can: ["View assigned desks", "Approve, edit and send back decisions in assigned desks", "Hold the draft slot for a CONVERSATIONAL REPLY (Claude drafts once its flag is on)", "Flag a human handoff — the agent leaves the thread"],
      cannot: ["Invite or remove members", "Change roles or workspace settings", "Act on a desk not assigned"]
    },
    viewer: {
      label: "Viewer",
      summary: "Read-only. Sees the work and the reasoning, changes nothing.",
      can: ["View assigned desks: inbox, agent trace, decision, probabilities and the rule that fired", "View the packet feed for desks in scope", "Export nothing and send nothing — viewing only"],
      cannot: ["Approve, edit or send back any decision", "Invite members or change any setting", "Submit items except through the public demo on this page"]
    },
    agent: {
      label: "Agent (service identity)",
      summary: "A registered agent in the agentic network — not a person. Submits and reads back packets only.",
      can: ["Submit one item per packet via POST /v1/decide in the agent-net/1 shape", "Read back its own decision packets (five answers, action, rule, mode)", "Claim an open packet — first committed claim wins"],
      cannot: ["Approve a human send — a packet never authorises an external effect by itself", "Access a holding scope outside its registered project", "Hold a human role or a desk seat"]
    }
  };

  /* --- Session activity log (page state only) --- */
  var logHost = $("wsLog");
  var logEntries = [];
  function log(msg) {
    logEntries.unshift(msg + " — page state only, nothing sent or saved.");
    if (!logHost) return;
    logHost.innerHTML = logEntries.map(function (e) {
      return "<li>" + esc(e) + "</li>";
    }).join("");
  }

  /* --- Sign-in shape: validation + scaffold outcome only --- */
  var signinForm = $("wsSigninForm");
  var signinErr = $("wsSigninError");
  var signinOut = $("wsSigninOut");
  function signinError(msg) {
    if (signinErr) { signinErr.style.display = "block"; signinErr.textContent = msg; }
    if (signinOut) signinOut.innerHTML = "";
  }
  if (signinForm) {
    signinForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var email = ($("wsEmail").value || "").trim();
      var pw = $("wsPassword") ? $("wsPassword").value : "";
      if (!email || email.indexOf("@") < 1 || email.indexOf(".") < 0) {
        signinError("That email address looks incomplete — check for a missing '@' or domain, then try the shape again.");
        return;
      }
      if (!pw || pw.length < 8) {
        signinError("The password shape needs at least 8 characters in this scaffold. No password is checked, stored, or sent — this only exercises the form's own rule.");
        return;
      }
      if (signinErr) { signinErr.style.display = "none"; signinErr.textContent = ""; }
      if (signinOut) {
        signinOut.innerHTML =
          "<div class=\"notice notice-success\" role=\"note\" style=\"margin-top:14px\">" +
          "<strong class=\"lead\">Shape complete — no sign-in happened</strong>" +
          "This scaffold accepted the form's own validation for <strong>" + esc(email) + "</strong> and stopped there, by design. " +
          "There is no auth backend in this build: no account was looked up, no session was created, and the password you typed was never read beyond its length, never stored, and never left this page. " +
          "In the live service this same form posts to a server-side session endpoint — see the live-flip list below." +
          "</div>";
      }
      log("Sign-in shape submitted for " + email + " (validation passed, no authentication attempted)");
    });
  }
  var magicBtn = $("wsMagicBtn");
  if (magicBtn) {
    magicBtn.addEventListener("click", function () {
      var email = ($("wsEmail").value || "").trim();
      if (!email || email.indexOf("@") < 1 || email.indexOf(".") < 0) {
        signinError("Enter an email address above first — the magic-link shape needs an address to name, even though no link is sent from this scaffold.");
        return;
      }
      if (signinErr) { signinErr.style.display = "none"; signinErr.textContent = ""; }
      if (signinOut) {
        signinOut.innerHTML =
          "<div class=\"notice\" role=\"note\" style=\"margin-top:14px\">" +
          "<strong class=\"lead\">Magic-link shape — no link sent</strong>" +
          "In the live service a single-use sign-in link would be emailed to <strong>" + esc(email) + "</strong> and expire shortly after issue. " +
          "In this scaffold nothing is emailed, no token is generated, and no address is recorded beyond this page." +
          "</div>";
      }
      log("Magic-link shape requested for " + email + " (no link generated or sent)");
    });
  }

  /* --- Desk model preview: switcher + detail --- */
  var deskHost = $("wsDeskSwitch");
  var deskDetail = $("wsDeskDetail");
  var currentDesk = "agicorp";
  function deskById(id) {
    for (var i = 0; i < DESKS.length; i++) if (DESKS[i].id === id) return DESKS[i];
    return null;
  }
  function renderDeskDetail() {
    var d = deskById(currentDesk);
    if (!d || !deskDetail) return;
    var handoff = HANDOFF[d.id] || "Mike";
    var scope = DESK_SCOPE[d.id] || d.note;
    deskDetail.innerHTML =
      "<h4 style=\"margin-top:0\">" + esc(d.name) + " desk</h4>" +
      "<p class=\"small\" style=\"color:var(--text)\"><strong>Scope:</strong> " + esc(scope) + "</p>" +
      "<p class=\"small\"><strong>Model note (config.js):</strong> " + esc(d.note) + "</p>" +
      "<p class=\"small\"><strong>Human handoff names:</strong> " + esc(handoff) + " — anyone who asks for a human on this desk is flagged to that person the same day and the agent leaves the thread.</p>" +
      "<p class=\"small\"><strong>Separation:</strong> one holding scope per packet. Work for another holding is a separate packet on its own desk — never mixed into this one.</p>" +
      "<p class=\"caption\">Preview only — switching desks here changes this panel and the role preview's scope line. It does not sign you into anything.</p>";
  }
  function renderDeskSwitch() {
    if (!deskHost) return;
    deskHost.innerHTML = "";
    DESKS.forEach(function (d) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "desk-btn";
      b.textContent = d.name;
      b.setAttribute("aria-pressed", d.id === currentDesk ? "true" : "false");
      b.addEventListener("click", function () {
        currentDesk = d.id;
        renderDeskSwitch();
        renderDeskDetail();
        renderRole();
      });
      deskHost.appendChild(b);
    });
  }

  /* --- Role preview: what the selected role can do on the current desk --- */
  var roleSel = $("wsRoleSelect");
  var roleOut = $("wsRoleOut");
  function renderRole() {
    if (!roleOut) return;
    var key = roleSel ? roleSel.value : "reviewer";
    var r = ROLES[key];
    if (!r) return;
    var d = deskById(currentDesk);
    var deskName = d ? d.name : "AGI Corp";
    var can = r.can.map(function (c) { return "<li class=\"perm-yes\">Can: " + esc(c) + "</li>"; }).join("");
    var cannot = r.cannot.map(function (c) { return "<li class=\"perm-no\">Cannot: " + esc(c) + "</li>"; }).join("");
    roleOut.innerHTML =
      "<h4 style=\"margin-top:0\">Previewing as: " + esc(r.label) + " · " + esc(deskName) + " desk</h4>" +
      "<p class=\"small\" style=\"color:var(--text)\">" + esc(r.summary) + "</p>" +
      "<ul class=\"perm-list\">" + can + cannot + "</ul>" +
      "<p class=\"caption\">This preview is explanatory page state. It does not grant, check, or enforce any permission — enforcement lives in the live backend that this scaffold specifies.</p>";
  }
  if (roleSel) roleSel.addEventListener("change", renderRole);

  /* --- Invite shape: validation + session log only --- */
  var inviteForm = $("wsInviteForm");
  var inviteErr = $("wsInviteError");
  var inviteOut = $("wsInviteOut");
  var inviteLog = $("wsInviteLog");
  var invites = [];
  function renderInvites() {
    if (!inviteLog) return;
    if (!invites.length) {
      inviteLog.innerHTML = "<li class=\"empty-note\">No invites shaped yet this session.</li>";
      return;
    }
    inviteLog.innerHTML = invites.map(function (e) {
      return "<li><strong>" + esc(e.email) + "</strong> · " + esc(e.desk) + " desk · " + esc(e.role) +
        " <span class=\"caption\">(shape only — no email sent, " + esc(e.when) + ")</span></li>";
    }).join("");
  }
  if (inviteForm) {
    inviteForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var email = ($("wsInviteEmail").value || "").trim();
      var deskId = $("wsInviteDesk").value;
      var roleKey = $("wsInviteRole").value;
      if (!email || email.indexOf("@") < 1 || email.indexOf(".") < 0) {
        if (inviteErr) { inviteErr.style.display = "block"; inviteErr.textContent = "Please enter an email address with an @ and a domain — the invite shape needs a real-shaped address to record."; }
        if (inviteOut) inviteOut.innerHTML = "";
        return;
      }
      if (inviteErr) { inviteErr.style.display = "none"; inviteErr.textContent = ""; }
      var d = deskById(deskId);
      var entry = {
        email: email,
        desk: d ? d.name : deskId,
        role: ROLES[roleKey] ? ROLES[roleKey].label : roleKey,
        when: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      };
      invites.unshift(entry);
      renderInvites();
      if (inviteOut) {
        inviteOut.innerHTML =
          "<div class=\"notice notice-success\" role=\"note\" style=\"margin-top:14px\">" +
          "<strong class=\"lead\">Invite shaped — no email sent</strong>" +
          "In the live service, <strong>" + esc(entry.email) + "</strong> would receive an invite to the <strong>" + esc(entry.desk) + "</strong> desk as <strong>" + esc(entry.role) + "</strong>, " +
          "expiring unused after a set window. Here the invite exists only in the list below and the session log — nothing was sent, saved, or shared." +
          "</div>";
      }
      log("Invite shaped: " + entry.email + " -> " + entry.desk + " / " + entry.role + " (no email sent)");
      inviteForm.reset();
    });
  }

  renderDeskSwitch();
  renderDeskDetail();
  renderRole();
  renderInvites();

  /* Exposed for headless verification only. */
  window.SwarmWorkspace = {
    renderDeskDetail: renderDeskDetail, renderRole: renderRole, renderInvites: renderInvites,
    state: function () { return { desk: currentDesk, invites: invites.length, log: logEntries.length }; },
    ROLES: ROLES, esc: esc
  };
})();
