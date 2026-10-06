(() => {
  "use strict";
  const CFG = {
    url: "https://mhhzdbkwivrrrfokolrt.supabase.co",
    key: "sb_publishable_jphHcqppLUGAPQ6K2Ke6Gg_el949UOf",
  };
  const K = window.KK, ACTS = K.acts;
  const qp = new URLSearchParams(location.search);
  const ROOM = ((qp.get("room") || "kk").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12)) || "kk";
  const MODE = qp.has("host") ? "host" : qp.has("screen") ? "screen" : "play";
  const MOCK = qp.has("mock");
  const $ = (s, r = document) => r.querySelector(s);
  const root = $("#app");
  document.body.classList.add("m-" + MODE);

  // ---------- small helpers ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const AS = qp.get("as") || "";
  const lsKey = (k) => `kk:${ROOM}:${AS}${k}`;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(lsKey(k)); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(lsKey(k), JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(lsKey(k)); } catch {} },
  };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() :
    "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)));
  const LET = "ABCDEFGH";
  const fmt = (n) => (Math.round(n * 10) / 10).toString();
  let toastT;
  function toast(msg) {
    let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.className = "on"; clearTimeout(toastT); toastT = setTimeout(() => (t.className = ""), 2600);
  }

  // ---------- scoring rule: right = points, wrong = -penalty, "No idea" or blank = 0 ----------
  const PEN = K.penalty || 0, NOIDEA = "No idea";
  ACTS.forEach((a) => {
    if (a.type === "q" && a.scored) a.qs.forEach((q) => { if (q.a != null) { q.o = q.o.concat([NOIDEA]); q.z = q.o.length - 1; } });
    if (a.type === "match") a.z = a.doors.length;
  });

  // ---------- the running order ----------
  const STEPS = [{ k: "lobby" }];
  ACTS.forEach((a, ai) => {
    const last = ai === ACTS.length - 1;
    STEPS.push({ k: "intro", a: ai });
    if (a.type === "q") a.qs.forEach((_, qi) => { STEPS.push({ k: "open", a: ai, q: qi }); STEPS.push({ k: "reveal", a: ai, q: qi }); });
    if (a.type === "match") { STEPS.push({ k: "open", a: ai }); STEPS.push({ k: "reveal", a: ai }); }
    if (a.type === "talk") a.cards.forEach((_, ci) => STEPS.push({ k: "card", a: ai, c: ci }));
    if (a.type === "wall") STEPS.push({ k: "wall", a: ai });
    if (last) STEPS.push({ k: "final", a: ai });
    else if (!a.chain) { if (a.scored) STEPS.push({ k: "board", a: ai }); STEPS.push({ k: "break", a: ai }); }
  });
  const qidsOf = (st) => {
    const a = ACTS[st.a]; if (!a) return [];
    if (a.type === "q") return [a.qs[st.q].id];
    if (a.type === "match") return a.probs.map((_, i) => a.id + i);
    return [];
  };
  const KEYS = [];
  ACTS.forEach((a) => {
    if (a.type === "q") a.qs.forEach((q) => { if (q.a != null) KEYS.push({ q: q.id, c: q.a, p: q.pts || a.pts || 10, n: PEN, z: q.z }); });
    if (a.type === "match") a.key.forEach((c, i) => KEYS.push({ q: a.id + i, c, p: a.pts || 10, n: PEN, z: a.z }));
  });
  const KEYMAP = Object.fromEntries(KEYS.map((k) => [k.q, k]));
  const pointsFor = (qid, c) => { const k = KEYMAP[qid]; if (!k || c == null || c < 0) return 0; return c === k.c ? k.p : c === k.z ? 0 : -k.n; };
  const signed = (n) => (n > 0 ? "+" + n : n < 0 ? "\u2212" + Math.abs(n) : "0");
  function describe(n) {
    const st = STEPS[n]; if (!st) return "The end";
    const a = ACTS[st.a];
    switch (st.k) {
      case "lobby": return "Lobby: people join";
      case "intro": return `${a.title}: title card`;
      case "open": return a.type === "match" ? `${a.title}: open for answers` : `${a.title}: question ${st.q + 1} of ${a.qs.length}`;
      case "reveal": return a.type === "match" ? `${a.title}: show answers` : `${a.title}: answer ${st.q + 1}`;
      case "card": return `${a.title}: scenario ${LET[st.c]}`;
      case "wall": return "Your Voice: live wall";
      case "board": return "Leaderboard";
      case "break": return "Back to the slides";
      case "final": return "Final results";
    }
  }

  // ---------- backend ----------
  let sb = null, rtOk = false;
  const api = MOCK ? window.kkMock(ROOM) : {
    async rpc(name, args) {
      const { data, error } = await sb.rpc(name, args);
      if (error) throw error;
      return data;
    },
    onState(cb) {
      sb.channel("room-" + ROOM)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "kk_rooms", filter: "code=eq." + ROOM }, (p) => cb(p.new))
        .subscribe((s) => { rtOk = s === "SUBSCRIBED"; });
    },
  };
  if (!MOCK) sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { params: { eventsPerSecond: 5 } } });
  async function rpc(name, args, quiet) {
    try { return await api.rpc(name, Object.assign({ p_room: ROOM }, args)); }
    catch (e) { if (!quiet) toast("Network problem. Trying again."); console.warn(name, e); return null; }
  }

  // ---------- shared state ----------
  const S = { state: { step: 0 }, seq: -1, teams: {}, off: 0, ready: false };
  let me = store.get("me", null);
  let answers = store.get("ans", {});
  let pin = store.get("pin", null);
  let authed = false;
  const nT = () => Math.min(K.teams.length, Math.max(2, S.state.nT || 6));
  const step = () => STEPS[Math.min(STEPS.length - 1, S.state.step || 0)];
  const remain = () => (S.state.t0 && S.state.dur ? S.state.dur - (Date.now() + S.off - S.state.t0) / 1000 : null);
  const isOpen = () => !!S.state.gate;

  function applyState(state, seq) {
    S.seq = seq; S.state = state || { step: 0 };
    const g = S.state.gen ?? null;
    if (MODE === "play" && (store.get("gen", null) ?? null) !== g) {
      me = null; answers = {}; store.del("me"); store.del("ans"); store.del("myv");
    }
    store.set("gen", g);
    S.ready = true;
    render();
  }
  async function pull() {
    const r = await rpc("kk_get", {}, true);
    if (!r) { if (!S.ready) root.innerHTML = `<div class="center"><p class="muted">Connecting…</p></div>`; return; }
    S.off = r.now - Date.now();
    const tc = JSON.stringify(r.teams || {}) !== JSON.stringify(S.teams);
    S.teams = r.teams || {};
    if (r.seq !== S.seq || !S.ready) applyState(r.state, r.seq);
    else if (tc) { if (MODE === "host" && hostTab !== "set" && hostTab !== "voice") render(); else soft(); }
  }
  function loop() {
    const wait = MODE === "play" ? (rtOk ? 8000 + Math.random() * 4000 : 2500 + Math.random() * 1500) : 2000;
    setTimeout(async () => { if (!document.hidden) await pull(); loop(); }, wait);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) pull(); });

  // ---------- host actions (host + screen) ----------
  let busy = false;
  async function go(n) {
    if (busy || !authed) return;
    n = Math.max(0, Math.min(STEPS.length - 1, n));
    busy = true;
    try {
      const st = STEPS[n], cur = S.state, a = ACTS[st.a];
      const ns = { step: n, nT: cur.nT || 6, wallAuto: cur.wallAuto === true };
      if (cur.gen != null) ns.gen = cur.gen;
      if (st.k === "open") { ns.gate = "s" + n; ns.qids = qidsOf(st); ns.dur = a.dur || 20; ns.stamp = 1; }
      if (st.k === "card") { ns.dur = a.dur || 60; ns.stamp = 1; }
      if (st.k === "reveal") {
        const c = await rpc("kk_counts", { p_pin: pin, p_qids: qidsOf(st) });
        if (c && c.ok) { ns.counts = c.by; ns.n = c.n; ns.players = c.players; }
      }
      if (st.k === "board" || st.k === "final") {
        const b = await rpc("kk_board", { p_pin: pin });
        if (b && b.ok) ns.board = { teams: b.teams, top: b.top, players: b.players };
      }
      if (n > 0 && (cur.step || 0) === 0) await rpc("kk_setkeys", { p_pin: pin, p_keys: KEYS });
      const r = await rpc("kk_set", { p_pin: pin, p_state: ns, p_expect: S.seq });
      if (r && r.ok) applyState(r.state, r.seq); else await pull();
    } finally { busy = false; }
  }
  async function patch(obj) {
    if (busy || !authed) return;
    busy = true;
    try {
      const r = await rpc("kk_set", { p_pin: pin, p_state: Object.assign({}, S.state, obj), p_expect: S.seq });
      if (r && r.ok) applyState(r.state, r.seq); else await pull();
    } finally { busy = false; }
  }
  const lock = () => patch({ gate: null, locked: true });

  // ---------- sound (projector only) ----------
  let actx = null, muted = false;
  function beep(f, d = 0.12, type = "sine", vol = 0.08, when = 0) {
    if (MODE !== "screen" || muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + when;
      o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + 0.02);
    } catch {}
  }
  const chime = () => [523, 659, 784].forEach((f, i) => beep(f, 0.5, "triangle", 0.07, i * 0.12));
  const fanfare = () => [392, 523, 659, 784, 1047].forEach((f, i) => beep(f, 0.6, "triangle", 0.08, i * 0.16));

  // ---------- pieces shared by views ----------
  const logo = (cls = "") => `<img class="logo ${cls}" src="logo.png" alt="Student Affairs Council">`;
  function myScore() {
    let s = 0; const upto = S.state.step || 0;
    STEPS.forEach((st, i) => {
      if (st.k !== "reveal" || i > upto) return;
      qidsOf(st).forEach((q) => { s += pointsFor(q, answers[q]); });
    });
    return s;
  }
  function boardHtml(b, big) {
    if (!b || !b.teams || !b.teams.length) return `<p class="muted">No scores yet.</p>`;
    const max = Math.max(1, ...b.teams.map((t) => t.total));
    return `<div class="board ${big ? "big" : ""}">` + b.teams.map((t, i) => `
      <div class="brow ${me && me.team === t.team ? "mine" : ""}">
        <span class="rank">${i + 1}</span>
        <span class="bname">${esc(K.teams[t.team] || "Team " + (t.team + 1))}<small>${t.n} ${t.n === 1 ? "player" : "players"}${t.bonus ? " · bonus " + t.bonus : ""}</small></span>
        <span class="bbar"><i style="width:${Math.max(3, (t.total / max) * 100)}%"></i></span>
        <span class="bval">${fmt(t.total)}</span>
      </div>`).join("") + `</div>`;
  }
  const topHtml = (b, n) => (!b || !b.top ? "" : `<ol class="top">` + b.top.slice(0, n).map((p) =>
    `<li><b>${esc(p.name)}</b><span>${esc(K.teams[p.team] || "")}</span><em>${p.score}</em></li>`).join("") + `</ol>`);

  // =====================================================================
  //  PHONE
  // =====================================================================
  let pickTeam = me ? me.team : null, joinName = "", matchSel = null, sending = false, voiceSent = false;
  function playView() {
    const st = step(), a = ACTS[st.a], s = S.state;
    if (!me) return joinView();
    const head = `<header class="phead">${logo("sm")}<div><b>${esc(me.name)}</b><span>${esc(K.teams[me.team])}</span></div><div class="pill">${myScore()} pts</div></header>`;
    let body = "";
    if (st.k === "lobby") {
      body = `<div class="pcard center"><p class="kick">You are in</p><h1>${esc(me.name)}</h1>
        <p class="lead">Team <b>${esc(K.teams[me.team])}</b></p><p class="muted">Sit with your team. The game starts on the big screen.</p>
        <button class="ghost" data-act="rejoin">Change name or team</button></div>`;
    } else if (st.k === "intro") {
      body = `<div class="pcard center"><p class="kick">${esc(a.kicker)}</p><h1>${esc(a.title)}</h1><p class="lead">${esc(a.rule)}</p></div>`;
    } else if (st.k === "open" && a.type === "q") {
      const q = a.qs[st.q], mine = answers[q.id], open = isOpen();
      body = `<div class="pcard"><p class="kick">${esc(a.kicker)}${a.qs.length > 1 ? ` · ${st.q + 1} of ${a.qs.length}` : ""}<span class="ptimer" id="timer"></span></p>
        <h2>${esc(q.q)}</h2>
        <div class="opts n${q.o.length}">${q.o.map((o, i) => `<button class="opt ${mine === i ? "sel" : ""}" data-act="ans" data-q="${q.id}" data-c="${i}" ${open ? "" : "disabled"}><i>${LET[i]}</i><span>${esc(o)}</span></button>`).join("")}</div>
        <p class="muted center">${!open ? "Time is up. Eyes on the screen." : mine != null ? "Locked in. You can change it until time runs out." : "Tap your answer."}</p></div>`;
    } else if (st.k === "reveal" && a.type === "q") {
      const q = a.qs[st.q], mine = answers[q.id], k = KEYMAP[q.id];
      if (!k) body = `<div class="pcard center"><p class="kick">${esc(a.kicker)}</p><h2>${esc(q.q)}</h2><p class="lead">You said: <b>${mine != null ? esc(q.o[mine]) : "nothing"}</b></p><p class="muted">See how the room answered on the screen.</p></div>`;
      else {
        const ok = mine === k.c, zero = mine == null || mine === k.z, pts = pointsFor(q.id, mine);
        body = `<div class="pcard center res ${ok ? "ok" : zero ? "" : "no"}"><p class="kick">${esc(a.kicker)}</p>
          <div class="mark">${ok ? "✓" : zero ? "–" : "✕"}</div>
          <h1>${ok ? "+" + k.p + " points" : mine == null ? "No answer · 0" : zero ? "No idea · 0" : signed(pts) + " points"}</h1>
          <p class="lead">Answer: <b>${esc(q.o[k.c])}</b></p>${q.why ? `<p class="muted">${esc(q.why)}</p>` : ""}</div>`;
      }
    } else if (st.k === "open" && a.type === "match") {
      if (!matchSel) matchSel = a.probs.map((_, i) => (answers[a.id + i] != null ? answers[a.id + i] : -1));
      const open = isOpen(), done = a.probs.every((_, i) => answers[a.id + i] != null);
      body = `<div class="pcard"><p class="kick">${esc(a.kicker)}<span class="ptimer" id="timer"></span></p><h2>${esc(a.title)}</h2>
        ${a.probs.map((p, i) => `<label class="mrow"><span><i>${LET[i]}</i>${esc(p)}</span>
          <select data-m="${i}" ${open ? "" : "disabled"}><option value="-1">Choose a door…</option>${a.doors.map((d, j) => `<option value="${j}" ${matchSel[i] === j ? "selected" : ""}>${j + 1}. ${esc(d)}</option>`).join("")}<option value="${a.z}" ${matchSel[i] === a.z ? "selected" : ""}>${NOIDEA}</option></select></label>`).join("")}
        <button class="primary" data-act="match" ${open ? "" : "disabled"}>${!open ? "Time is up" : done ? "Update my answers" : "Lock in my answers"}</button>
        <p class="muted center">${done ? "Locked in. You can still change them." : "Anything you leave blank counts as No idea."}</p></div>`;
    } else if (st.k === "reveal" && a.type === "match") {
      let got = 0, bad = 0, net = 0;
      const rows = a.probs.map((p, i) => { const m = answers[a.id + i], ok = m === a.key[i], zero = m == null || m === a.z; if (ok) got++; else if (!zero) bad++; net += pointsFor(a.id + i, m);
        return `<div class="mres ${ok ? "ok" : zero ? "" : "no"}"><b>${ok ? "✓" : zero ? "–" : "✕"}</b><span>${esc(p)}<small>${esc(a.doors[a.key[i]])}</small></span></div>`; }).join("");
      body = `<div class="pcard"><p class="kick">${esc(a.kicker)}</p><h2>${got} right, ${bad} wrong · ${signed(net)} points</h2>${rows}</div>`;
    } else if (st.k === "card") {
      const c = a.cards[st.c];
      body = `<div class="pcard center"><p class="kick">${esc(a.kicker)} · Scenario ${LET[st.c]}<span class="ptimer" id="timer"></span></p><h2 class="serif">${esc(c.t)}</h2><p class="muted">Talk to your team. Raise your hand to answer.</p></div>`;
    } else if (st.k === "wall") {
      const mv = store.get("myv", null);
      body = mv ? `<div class="pcard center"><p class="kick">Your Voice</p><div class="mark sent">✓</div><h2>Sent</h2>
          ${mv.t ? `<p class="lead quote">${esc(mv.t)}</p>` : ""}<p class="muted">${esc(K.host)} has it. One message each, so this is yours.</p></div>`
        : `<div class="pcard"><p class="kick">Your Voice</p><h2>One problem, or one idea</h2>
        <p class="muted">${esc(K.host)} takes these to the SAC General Body Meeting. He can see who sent each one.</p>
        <textarea id="vtext" maxlength="300" rows="4" placeholder="Write it here…"></textarea>
        <label class="chk"><input type="checkbox" id="vname"> Show my name and team on the big screen</label>
        <button class="primary" data-act="voice">Send</button>
        <p class="muted center">You can send only one, and you cannot change it.</p></div>`;
    } else if (st.k === "final") {
      const b = s.board, pos = b && b.teams ? b.teams.findIndex((t) => t.team === me.team) : -1;
      body = `<div class="pcard center"><p class="kick">Final results</p><h1>${myScore()} points</h1>
        ${pos >= 0 ? `<p class="lead">Team ${esc(K.teams[me.team])} finished <b>#${pos + 1}</b></p>` : ""}</div>
        <div class="pcard">${boardHtml(b)}</div>`;
    } else if (st.k === "board") {
      body = `<div class="pcard"><p class="kick">Leaderboard</p>${boardHtml(s.board)}</div>`;
    } else {
      body = `<div class="pcard center"><p class="kick">For now</p><h1>Eyes on the screen</h1><p class="muted">The next game will open here by itself.</p></div>`;
    }
    return head + `<main class="pmain">${body}</main>`;
  }
  function joinView() {
    const n = nT();
    return `<main class="pmain join"><div class="center">${logo("lg")}<p class="kick">${esc(K.sub)}</p><h1 class="title">${esc(K.title)}</h1></div>
      <div class="pcard"><label class="fl">Your name<input id="jname" maxlength="24" autocomplete="given-name" placeholder="First name" value="${esc(joinName)}"></label>
      <p class="fl">Your team</p>
      <div class="teams">${K.teams.slice(0, n).map((t, i) => `<button class="team ${pickTeam === i ? "sel" : ""}" data-act="pick" data-t="${i}"><b>${esc(t)}</b><small data-tc="${i}">${S.teams[i] || 0} in</small></button>`).join("")}</div>
      <button class="primary" data-act="join">Join the game</button></div></main>`;
  }
  async function playAct(act, el) {
    const st = step(), a = ACTS[st.a];
    if (act === "pick") { pickTeam = +el.dataset.t; render(); }
    if (act === "rejoin") { joinName = me.name; pickTeam = me.team; me = null; render(); }
    if (act === "join") {
      const name = ($("#jname").value || "").trim(); joinName = name;
      if (!name) return toast("Type your name first.");
      if (pickTeam == null) return toast("Pick your team.");
      if (sending) return; sending = true;
      const id = store.get("id", null) || uuid(); store.set("id", id);
      const r = await rpc("kk_join", { p_id: id, p_name: name, p_team: pickTeam });
      sending = false;
      if (r && r.ok) { me = { id, name: r.name, team: r.team }; store.set("me", me); render(); pull(); }
      else if (r) toast(r.err === "full" ? "The room is full." : "Could not join. Try again.");
    }
    if (act === "ans") {
      if (!isOpen()) return;
      const q = el.dataset.q, c = +el.dataset.c, prev = answers[q];
      answers[q] = c; store.set("ans", answers); render();
      const r = await rpc("kk_submit", { p_pid: me.id, p_gate: S.state.gate, p_answers: [{ q, c }] });
      if (!r || !r.ok) {
        if (r && r.err === "nojoin") { me = null; store.del("me"); toast("Please join again."); }
        else if (r && r.err === "closed") { toast("Too late, time was up."); if (prev == null) delete answers[q]; else answers[q] = prev; }
        store.set("ans", answers); render();
      }
    }
    if (act === "match") {
      if (!isOpen()) return;
      const sel = matchSel || [];
      const arr = sel.map((c, i) => ({ q: a.id + i, c: c < 0 ? a.z : c }));
      const r = await rpc("kk_submit", { p_pid: me.id, p_gate: S.state.gate, p_answers: arr });
      if (r && r.ok) { arr.forEach((x) => (answers[x.q] = x.c)); store.set("ans", answers); toast("Locked in."); render(); }
      else if (r && r.err === "closed") toast("Too late, time was up.");
      else if (r && r.err === "nojoin") { me = null; store.del("me"); render(); }
    }
    if (act === "voice") {
      const t = ($("#vtext").value || "").trim();
      if (t.length < 3) return toast("Write a little more.");
      if (store.get("myv", null) || sending) return; sending = true;
      const show = $("#vname").checked;
      const r = await rpc("kk_voice_send", { p_pid: me.id, p_body: t, p_show: show });
      sending = false;
      if (r && r.ok) { store.set("myv", { t, show }); toast("Sent. Thank you."); voiceSent = true; render(); }
      else if (r && r.err === "dup") { store.set("myv", { t: "", show }); toast("You have already sent one."); render(); }
      else if (r && r.err === "nojoin") { me = null; store.del("me"); toast("Please join again."); render(); }
      else if (r) toast("Could not send. Try again.");
    }
  }

  // =====================================================================
  //  PROJECTOR
  // =====================================================================
  let live = { n: 0, players: 0 }, voices = [], lastStepSeen = -1;
  function frame(inner, cls = "") {
    return `<section class="stage ${cls}"><div class="rule"></div>${inner}
      <footer class="foot"><span>${esc(K.title)}</span><span><b id="jc">${Object.values(S.teams).reduce((x, y) => x + y, 0)}</b> joined · ${esc(K.joinUrl)}</span></footer></section>`;
  }
  const head = (a, extra = "") => `<p class="kick">${esc(a.kicker)}${extra}</p>`;
  const timerEl = () => `<div class="timer" id="timer"></div>`;
  function screenView() {
    const st = step(), a = ACTS[st.a], s = S.state;
    if (st.k === "lobby") {
      const n = nT();
      return frame(`<div class="lobby"><div class="lq"><div class="qr" id="qr"></div><p class="url">${esc(K.joinUrl)}</p></div>
        <div class="lt">${logo("md")}<p class="kick">${esc(K.sub)}</p><h1 class="huge">${esc(K.title)}</h1>
        <p class="lead">Scan, type your name, pick your team.</p>
        <div class="tgrid">${K.teams.slice(0, n).map((t, i) => `<div class="tcell"><b>${esc(t)}</b><span data-tc="${i}">${S.teams[i] || 0}</span></div>`).join("")}</div></div></div>`);
    }
    if (st.k === "intro") return frame(`<div class="mid">${head(a)}<h1 class="huge">${esc(a.title)}</h1><div class="orn"></div><p class="lead">${esc(a.rule)}</p></div>`);
    if (st.k === "break") return frame(`<div class="mid">${logo("xl")}<p class="kick">Back to the slides</p></div>`, "quiet");
    if ((st.k === "open" || st.k === "reveal") && a.type === "q") {
      const q = a.qs[st.q], rev = st.k === "reveal", k = KEYMAP[q.id];
      const cnt = rev ? (s.counts && s.counts[q.id]) || {} : {};
      const tot = Object.values(cnt).reduce((x, y) => x + y, 0);
      const pts = k ? ` · ${k.p} points` : "";
      return frame(`${rev ? "" : timerEl()}${head(a, a.qs.length > 1 ? ` · ${st.q + 1} of ${a.qs.length}${pts}` : pts)}
        <h1 class="qtext ${q.q.length > 52 ? "long" : ""}">${esc(q.q)}</h1>
        <div class="sopts n${q.o.length}">${q.o.map((o, i) => {
          const c = cnt[i] || 0, pc = tot ? Math.round((c / tot) * 100) : 0;
          return `<div class="sopt ${rev ? (k && k.c === i ? "right" : k ? "dim" : "poll") : ""}"><u style="width:${rev ? pc : 0}%"></u><i>${LET[i]}</i><span>${esc(o)}</span>${rev ? `<em>${pc}%</em>` : ""}</div>`;
        }).join("")}</div>
        <p class="status">${rev ? esc(q.why || "") : s.locked ? "Time is up" : `<b id="livec">${live.n}</b> of <span id="livep">${live.players}</span> answered`}</p>`);
    }
    if ((st.k === "open" || st.k === "reveal") && a.type === "match") {
      const rev = st.k === "reveal";
      return frame(`${rev ? "" : timerEl()}${head(a)}<h1 class="mtitle">${esc(a.title)}</h1>
        <div class="mgrid ${rev ? "rev" : ""}"><div>${a.probs.map((p, i) => {
          let ans = "";
          if (rev) { const c = (s.counts && s.counts[a.id + i]) || {}; const tot = Object.values(c).reduce((x, y) => x + y, 0); const pc = tot ? Math.round(((c[a.key[i]] || 0) / tot) * 100) : 0; ans = `<b>${esc(a.doors[a.key[i]])}</b><em>${pc}% got it</em>`; }
          return `<div class="mline"><i>${LET[i]}</i><span>${esc(p)}</span>${ans}</div>`;
        }).join("")}</div>${rev ? "" : `<div>${a.doors.map((d, i) => `<div class="mline door"><i>${i + 1}</i><span>${esc(d)}</span></div>`).join("")}</div>`}</div>
        <p class="status">${rev ? "" : s.locked ? "Time is up" : `<b id="livec">${live.n}</b> of <span id="livep">${live.players}</span> locked in`}</p>`);
    }
    if (st.k === "card") {
      const c = a.cards[st.c];
      return frame(`${timerEl()}${head(a, ` · Scenario ${LET[st.c]}`)}<div class="mid tight"><h1 class="scen">${esc(c.t)}</h1><div class="orn"></div><p class="lead">Talk to your team. Hands up to answer.</p></div>`);
    }
    if (st.k === "wall") {
      const vis = voices.filter((v) => !v.hidden).slice(-18).reverse();
      return frame(`${head(a, ` · ${voices.filter((v) => !v.hidden).length} so far`)}<h1 class="mtitle">${esc(a.rule)}</h1>
        <div class="wall" id="wall">${vis.map((v) => `<div class="note">${esc(v.body)}${v.show && v.name ? `<small>${esc(v.name)}${K.teams[v.team] ? " · " + esc(K.teams[v.team]) : ""}</small>` : ""}</div>`).join("") || `<p class="lead muted">Waiting for the first one…</p>`}</div>`);
    }
    if (st.k === "board") return frame(`<p class="kick">Leaderboard</p><div class="bwrap"><div>${boardHtml(s.board, true)}</div><div class="side"><p class="kick">Top scorers</p>${topHtml(s.board, 5)}</div></div>`);
    if (st.k === "final") {
      const b = s.board || { teams: [], top: [] }, w = b.teams[0];
      return frame(`<p class="kick">Final results</p>
        <div class="bwrap fin"><div><p class="lead">Winning team</p><h1 class="huge gold">${w ? esc(K.teams[w.team]) : "–"}</h1>${boardHtml(b, true)}</div>
        <div class="side"><p class="kick">Karakorampati</p>${topHtml(b, 3)}</div></div>`);
    }
    return frame("");
  }
  function drawQr() {
    const el = $("#qr"); if (!el || el.dataset.done) return;
    const u = new URLSearchParams(); if (ROOM !== "kk") u.set("room", ROOM); if (MOCK) u.set("mock", "1");
    const url = location.origin + location.pathname + (u.toString() ? "?" + u : "");
    const q = window.qrcode(0, "M"); q.addData(url); q.make();
    el.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); el.dataset.done = 1;
  }

  // =====================================================================
  //  HOST REMOTE
  // =====================================================================
  let players = [], hostTab = "run", bonusTeam = 0;
  function hostNotes() {
    const st = step(), a = ACTS[st.a];
    if (st.k === "lobby") return "Wait until most people have joined, then press Next.";
    if ((st.k === "open" || st.k === "reveal") && a.type === "q") { const q = a.qs[st.q]; return q.a != null ? `Answer: ${LET[q.a]}. ${q.o[q.a]}. ${q.why || ""}` : "Poll. No right answer."; }
    if (a && a.type === "match") return "Key: " + a.key.map((d, i) => `${LET[i]}-${d + 1}`).join(", ");
    if (st.k === "card") return a.cards[st.c].notes + " Give points from the Points tab.";
    if (st.k === "wall") return "Open the Voice tab. Tap Show on the ones you want on the big screen, then read them out.";
    if (st.k === "break") return "Switch to your slides. Press Next when you are ready for the next game.";
    return "";
  }
  function hostView() {
    const s = S.state, n = s.step || 0, joined = Object.values(S.teams).reduce((x, y) => x + y, 0);
    const tabs = [["run", "Run"], ["pts", "Points"], ["voice", "Voice"], ["ppl", "People"], ["set", "Setup"]];
    let body = "";
    if (hostTab === "run") {
      body = `<div class="hnow"><small>Step ${n + 1} of ${STEPS.length} · ${joined} joined${rtOk || MOCK ? "" : " · slow link"}</small>
        <h2>${esc(describe(n))}</h2><p id="hlive" class="hlive"></p><p class="notes">${esc(hostNotes())}</p></div>
        <button class="primary big" data-act="next" ${n >= STEPS.length - 1 ? "disabled" : ""}>Next<small>${esc(describe(n + 1))}</small></button>
        <div class="row2"><button class="ghost" data-act="prev" ${n <= 0 ? "disabled" : ""}>Back</button>
        <button class="ghost" data-act="lock" ${isOpen() ? "" : "disabled"}>Stop the clock</button></div>
        <details><summary>Jump to a game</summary><div class="jump">${STEPS.map((st, i) => (st.k === "intro" || st.k === "lobby" || st.k === "final" ? `<button class="ghost" data-act="jump" data-n="${i}">${esc(st.k === "lobby" ? "Lobby" : st.k === "final" ? "Final results" : ACTS[st.a].title)}</button>` : "")).join("")}</div></details>`;
    }
    if (hostTab === "pts") {
      body = `<h2>Give points to a team</h2><div class="teams">${K.teams.slice(0, nT()).map((t, i) => `<button class="team ${bonusTeam === i ? "sel" : ""}" data-act="bteam" data-t="${i}"><b>${esc(t)}</b><small>${S.teams[i] || 0} in</small></button>`).join("")}</div>
        <div class="row3">${[5, 10, 20].map((p) => `<button class="primary" data-act="bonus" data-p="${p}">+${p}</button>`).join("")}</div>
        <button class="ghost" data-act="bonus" data-p="-10">Take back 10</button>
        <p class="muted">Team score is the average of its players, plus these points.</p>
        <button class="ghost" data-act="peek">Check standings (only you see this)</button><div id="peek"></div>`;
    }
    if (hostTab === "voice") {
      body = `<h2>${voices.length} messages received</h2><p class="muted">Nothing goes on the big screen until you tap Show.</p>
        <label class="chk"><input type="checkbox" id="wauto" ${s.wallAuto === true ? "checked" : ""}> Show new messages on the screen straight away</label>
        <div class="row2"><button class="ghost" data-act="vcopy">Copy all</button><button class="ghost" data-act="vcsv">Download CSV</button></div>
        <div class="vlist">${voices.slice().reverse().map((v) => `<div class="vrow ${v.hidden ? "" : "live"}"><p>${esc(v.body)}<small>${esc(v.name || "No name")}${K.teams[v.team] ? " · " + esc(K.teams[v.team]) : ""} · ${v.show ? "name will show on screen" : "name stays off screen"}${v.hidden ? "" : " · ON SCREEN"}</small></p><button class="ghost" data-act="vhide" data-id="${v.id}" data-h="${v.hidden ? 0 : 1}">${v.hidden ? "Show" : "Hide"}</button></div>`).join("") || `<p class="muted">Nothing yet.</p>`}</div>`;
    }
    if (hostTab === "ppl") {
      body = `<h2>${players.filter((p) => !p.hidden).length} players</h2><p class="muted">Tap a name to remove it from the game and the leaderboard.</p>
        <div class="plist">${players.map((p) => `<button class="ghost ${p.hidden ? "hid" : ""}" data-act="phide" data-id="${p.id}" data-h="${p.hidden ? 0 : 1}">${esc(p.name)}<small>${esc(K.teams[p.team] || "")}${p.hidden ? " · removed" : ""}</small></button>`).join("")}</div>`;
    }
    if (hostTab === "set") {
      const base = location.origin + location.pathname, r = ROOM !== "kk" ? "&room=" + ROOM : "", m = MOCK ? "&mock" : "";
      body = `<h2>Setup</h2><p class="muted">Room: <b>${esc(ROOM)}</b></p>
        <label class="fl">Number of teams (set this in the lobby)<select id="nt" ${n === 0 ? "" : "disabled"}>${[2, 3, 4, 5, 6, 7, 8].map((x) => `<option ${nT() === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
        <p class="fl">Projector link</p><p class="link">${esc(base + "?screen" + r + m)}</p>
        <button class="ghost" data-act="copyscreen">Copy projector link</button>
        <details><summary>Start over (rehearsal only)</summary><p class="muted">Removes every player and score in this room and sends everyone back to the join page.</p>
        <input id="rst" placeholder="Type RESET"><button class="ghost danger" data-act="reset">Start over</button></details>
        <button class="ghost" data-act="logout">Sign out of host</button>`;
    }
    return `<header class="phead">${logo("sm")}<div><b>Host remote</b><span>${esc(K.title)}</span></div></header>
      <nav class="tabs">${tabs.map(([k, l]) => `<button class="${hostTab === k ? "on" : ""}" data-act="tab" data-t="${k}">${l}</button>`).join("")}</nav>
      <main class="pmain host">${body}</main>`;
  }
  function pinView() {
    return `<main class="pmain join"><div class="center">${logo("lg")}<p class="kick">${MODE === "host" ? "Host remote" : "Projector screen"}</p><h1 class="title">${esc(K.title)}</h1></div>
      <div class="pcard"><label class="fl">Host passphrase<input id="pin" type="password" autocomplete="off"></label><button class="primary" data-act="pin">Enter</button></div></main>`;
  }
  async function hostAct(act, el) {
    if (act === "pin") {
      const v = ($("#pin").value || "").trim(); if (!v) return;
      const ok = await rpc("kk_auth", { p_pin: v });
      if (ok === true) { pin = v; store.set("pin", v); authed = true; await rpc("kk_setkeys", { p_pin: pin, p_keys: KEYS }); render(); refreshHost(); }
      else toast("Wrong passphrase.");
      return;
    }
    if (act === "tab") { hostTab = el.dataset.t; render(); refreshHost(); }
    if (act === "next") go((S.state.step || 0) + 1);
    if (act === "prev") go((S.state.step || 0) - 1);
    if (act === "jump") go(+el.dataset.n);
    if (act === "lock") lock();
    if (act === "bteam") { bonusTeam = +el.dataset.t; render(); }
    if (act === "bonus") {
      const p = +el.dataset.p, r = await rpc("kk_bonus_add", { p_pin: pin, p_team: bonusTeam, p_points: p, p_note: describe(S.state.step || 0) });
      if (r && r.ok) toast(`${p > 0 ? "+" : ""}${p} to ${K.teams[bonusTeam]}`);
    }
    if (act === "peek") { const b = await rpc("kk_board", { p_pin: pin }); if (b && b.ok) $("#peek").innerHTML = boardHtml(b) + topHtml(b, 5); }
    if (act === "vhide") { await rpc("kk_voice_hide", { p_pin: pin, p_id: +el.dataset.id, p_hidden: el.dataset.h === "1" }); refreshHost(); }
    if (act === "phide") { await rpc("kk_player_hide", { p_pin: pin, p_id: el.dataset.id, p_hidden: el.dataset.h === "1" }); refreshHost(); }
    if (act === "vcopy" || act === "vcsv") {
      const rows = voices.map((v) => ({ when: new Date(v.at).toLocaleString("en-IN"), point: v.body, name: v.name || "", team: K.teams[v.team] || "", shown: v.hidden ? "" : "yes" }));
      if (act === "vcopy") { try { await navigator.clipboard.writeText(rows.map((r, i) => `${i + 1}. ${r.point}${r.name ? " (" + r.name + (r.team ? ", " + r.team : "") + ")" : ""}`).join("\n")); toast("Copied."); } catch { toast("Could not copy."); } }
      else {
        const csv = "﻿When,Message,Name,Team,Shown on screen\n" + rows.map((r) => [r.when, r.point, r.name, r.team, r.shown].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
        const u = URL.createObjectURL(new Blob([csv], { type: "text/csv" })), l = document.createElement("a");
        l.href = u; l.download = "your-voice-points.csv"; l.click(); setTimeout(() => URL.revokeObjectURL(u), 2000);
      }
    }
    if (act === "copyscreen") { try { await navigator.clipboard.writeText($(".link").textContent); toast("Copied."); } catch { toast("Could not copy."); } }
    if (act === "reset") {
      if (($("#rst").value || "").trim() !== "RESET") return toast("Type RESET first.");
      const r = await rpc("kk_reset", { p_pin: pin }); if (r && r.ok) { toast("Started over."); pull(); }
    }
    if (act === "logout") { store.del("pin"); pin = null; authed = false; render(); }
  }
  async function refreshHost() {
    if (!authed) return;
    const st = step();
    if (MODE === "host" && hostTab === "ppl") { const r = await rpc("kk_players_list", { p_pin: pin }, true); if (r && r.ok && JSON.stringify(r.rows) !== JSON.stringify(players)) { players = r.rows; render(); } }
    if ((MODE === "host" && hostTab === "voice") || (MODE === "screen" && st.k === "wall")) {
      const r = await rpc("kk_voices_list", { p_pin: pin }, true);
      if (r && r.ok && JSON.stringify(r.rows) !== JSON.stringify(voices)) {
        const grew = r.rows.filter((v) => !v.hidden).length > voices.filter((v) => !v.hidden).length;
        voices = r.rows; if (MODE === "screen" && grew) beep(880, 0.15, "sine", 0.05);
        if (!(MODE === "host" && document.activeElement && document.activeElement.tagName === "INPUT" && document.activeElement.type !== "checkbox")) render();
      }
    }
    if (isOpen() && (MODE === "screen" || hostTab === "run")) {
      const r = await rpc("kk_counts", { p_pin: pin, p_qids: S.state.qids || [] }, true);
      if (r && r.ok) { live = { n: r.n, players: r.players }; soft(); }
    }
  }

  // ---------- render + ticking ----------
  function render() {
    if (!S.ready) return;
    const st = step();
    if (MODE === "play") {
      if (!(st.k === "open" && ACTS[st.a].type === "match")) matchSel = null;
      const jn = $("#jname"), vt = $("#vtext"), vn = $("#vname"), keep = { vt: vt ? vt.value : "", vn: vn ? vn.checked : false, foc: document.activeElement && document.activeElement.id };
      if (jn) joinName = jn.value;
      root.innerHTML = playView();
      const vt2 = $("#vtext"), vn2 = $("#vname");
      if (vt2 && keep.vt && !voiceSent) vt2.value = keep.vt;
      if (vn2 && keep.vn) vn2.checked = true;
      voiceSent = false;
      if (keep.foc && $("#" + keep.foc)) { const f = $("#" + keep.foc); f.focus(); if (f.setSelectionRange && f.value != null) { try { f.setSelectionRange(f.value.length, f.value.length); } catch {} } }
    }
    else if (!authed) root.innerHTML = pinView();
    else if (MODE === "host") root.innerHTML = hostView();
    else {
      const n = S.state.step || 0;
      if (n !== lastStepSeen) {
        if (st.k === "reveal") chime(); else if (st.k === "final") fanfare(); else if (st.k === "open") beep(660, 0.2, "triangle");
        if (st.k === "open") live = { n: 0, players: live.players };
        lastStepSeen = n;
      }
      root.innerHTML = screenView(); drawQr();
    }
    tick();
  }
  function soft() {
    document.querySelectorAll("[data-tc]").forEach((el) => { const v = S.teams[el.dataset.tc] || 0; el.textContent = MODE === "play" ? v + " in" : v; });
    const c = $("#livec"), p = $("#livep"); if (c) c.textContent = live.n; if (p) p.textContent = live.players;
    const j = $("#jc"); if (j) j.textContent = Object.values(S.teams).reduce((x, y) => x + y, 0);
  }
  let lastTickSec = null, autoLocking = false;
  function tick() {
    const t = $("#timer"), r = remain(), open = isOpen(), st = step();
    const showing = r != null && (open || st.k === "card");
    if (t) {
      if (!showing) t.textContent = S.state.locked ? "0" : "";
      else { const sec = Math.max(0, Math.ceil(r)); t.textContent = sec; t.classList.toggle("low", sec <= 5); t.style.setProperty("--p", Math.max(0, Math.min(1, r / S.state.dur)));
        if (MODE === "screen" && sec !== lastTickSec) { if (sec <= 5 && sec > 0) beep(440, 0.08, "square", 0.04); if (sec === 0) beep(220, 0.5, "sawtooth", 0.05); lastTickSec = sec; } }
    }
    const h = $("#hlive");
    if (h) h.textContent = open ? `${live.n} of ${live.players} answered · ${Math.max(0, Math.ceil(r ?? 0))}s left` : showing ? `${Math.max(0, Math.ceil(r))}s left` : S.state.locked ? "Clock stopped. Press Next to show the answer." : "";
    if (authed && open && r != null && r <= -0.8 && !autoLocking) { autoLocking = true; lock().finally(() => setTimeout(() => (autoLocking = false), 1500)); }
  }

  // ---------- events ----------
  root.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    const act = el.dataset.act;
    if (MODE === "play") playAct(act, el); else hostAct(act, el);
  });
  root.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.m != null && matchSel) matchSel[+t.dataset.m] = +t.value;
    if (t.id === "wauto") patch({ wallAuto: t.checked });
    if (t.id === "nt") patch({ nT: +t.value });
  });
  root.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "pin") hostAct("pin"); if (e.key === "Enter" && e.target.id === "jname") e.target.blur(); });
  if (MODE === "screen") {
    let lastKey = 0;
    document.addEventListener("keydown", (e) => {
      if (!authed || e.target.tagName === "INPUT") return;
      const now = Date.now();
      if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); if (now - lastKey > 500) { lastKey = now; go((S.state.step || 0) + 1); } }
      if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); if (now - lastKey > 500) { lastKey = now; go((S.state.step || 0) - 1); } }
      if (e.key === "f" || e.key === "F") { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); }
      if (e.key === "m" || e.key === "M") { muted = !muted; toast(muted ? "Sound off" : "Sound on"); }
    });
  }

  // ---------- start ----------
  (async () => {
    root.innerHTML = `<div class="center"><p class="muted">Connecting…</p></div>`;
    if (MODE !== "play" && pin) { const ok = await rpc("kk_auth", { p_pin: pin }, true); authed = ok === true; if (authed) rpc("kk_setkeys", { p_pin: pin, p_keys: KEYS }, true); else if (ok === false) { pin = null; store.del("pin"); } }
    api.onState((row) => { if (row && row.seq > S.seq) applyState(row.state, row.seq); });
    await pull();
    if (!S.ready) { S.ready = true; render(); }
    loop();
    setInterval(tick, 250);
    if (MODE !== "play") setInterval(refreshHost, 1500);
  })();
})();
