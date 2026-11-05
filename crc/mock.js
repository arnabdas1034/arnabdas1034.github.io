// Offline practice backend (?mock). Same calls as the real server, kept in this browser only.
// Host passphrase in practice mode: demo
window.kkMock = function (ROOM) {
  const KEY = "kkmock:" + ROOM, PIN = "demo";
  const bc = "BroadcastChannel" in window ? new BroadcastChannel(KEY) : null;
  const subs = [];
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch { return fresh(); } };
  const fresh = () => ({ state: { step: 0 }, seq: 0, players: {}, answers: {}, keys: {}, bonus: [], voices: [], vid: 0 });
  const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));
  const tell = (d) => { const m = { state: d.state, seq: d.seq }; if (bc) bc.postMessage(m); subs.forEach((f) => f(m)); };
  if (bc) bc.onmessage = (e) => subs.forEach((f) => f(e.data));
  const livePlayers = (d) => Object.values(d.players).filter((p) => !p.hidden && !p.gone);
  const no = { ok: false, err: "pin" };
  const F = {
    kk_auth: (a) => a.p_pin === PIN,
    kk_get() { const d = load(), teams = {}; livePlayers(d).forEach((p) => (teams[p.team] = (teams[p.team] || 0) + 1)); return { state: d.state, seq: d.seq, now: Date.now(), teams }; },
    kk_set(a) {
      if (a.p_pin !== PIN) return no; const d = load();
      if (a.p_expect != null && a.p_expect !== d.seq) return { ok: false, err: "stale" };
      const s = Object.assign({}, a.p_state); if ("stamp" in s) { delete s.stamp; s.t0 = Date.now(); }
      d.state = s; d.seq++; save(d); tell(d); return { ok: true, seq: d.seq, state: s };
    },
    kk_join(a) {
      const d = load(), n = String(a.p_name || "").replace(/\s+/g, " ").trim().slice(0, 24);
      if (!n) return { ok: false, err: "name" };
      const ex = d.players[a.p_id];
      if (ex) { ex.name = n; if ((d.state.step || 0) === 0 || ex.gone) ex.team = a.p_team; ex.gone = false; }
      else d.players[a.p_id] = { id: a.p_id, name: n, team: a.p_team, hidden: false, gone: false, at: Date.now() };
      save(d); return { ok: true, name: n, team: d.players[a.p_id].team };
    },
    kk_submit(a) {
      const d = load(), s = d.state;
      if (!s.gate || s.gate !== a.p_gate) return { ok: false, err: "closed" };
      const p = d.players[a.p_pid]; if (!p || p.gone) return { ok: false, err: "nojoin" };
      d.answers[a.p_pid] = d.answers[a.p_pid] || {};
      a.p_answers.forEach((x) => { if ((s.qids || []).includes(x.q) && x.c >= 0 && x.c <= 9) d.answers[a.p_pid][x.q] = x.c; });
      save(d); return { ok: true };
    },
    kk_setkeys(a) { if (a.p_pin !== PIN) return no; const d = load(); a.p_keys.forEach((k) => (d.keys[k.q] = { c: k.c, p: k.p, n: k.n || 0, z: k.z })); save(d); return { ok: true }; },
    kk_counts(a) {
      if (a.p_pin !== PIN) return no; const d = load(), by = {}, who = new Set();
      livePlayers(d).forEach((p) => { const an = d.answers[p.id] || {}; a.p_qids.forEach((q) => { if (an[q] != null && an[q] >= 0) { by[q] = by[q] || {}; by[q][an[q]] = (by[q][an[q]] || 0) + 1; who.add(p.id); } }); });
      return { ok: true, by, n: who.size, players: livePlayers(d).length };
    },
    kk_board(a) {
      if (a.p_pin !== PIN) return no; const d = load();
      const sc = livePlayers(d).map((p) => { const an = d.answers[p.id] || {}; let s = 0; Object.keys(an).forEach((q) => { const k = d.keys[q]; if (!k || an[q] < 0) return; s += an[q] === k.c ? k.p : an[q] === k.z ? 0 : -k.n; }); const pb = d.bonus.filter((b) => b.pid === p.id).reduce((x, b) => x + b.points, 0); return { id: p.id, name: p.name, team: p.team, score: s + pb, bonus: pb, at: p.at }; });
      const tm = {}; sc.forEach((p) => { tm[p.team] = tm[p.team] || { team: p.team, n: 0, sum: 0 }; tm[p.team].n++; tm[p.team].sum += p.score; });
      const teams = Object.values(tm).map((t) => { const avg = Math.round((t.sum / t.n) * 10) / 10, bonus = d.bonus.filter((b) => b.pid == null && b.team === t.team).reduce((x, b) => x + b.points, 0); return { team: t.team, n: t.n, avg, bonus, total: avg + bonus }; }).sort((x, y) => y.total - x.total || x.team - y.team);
      sc.sort((x, y) => y.score - x.score || x.at - y.at);
      const top = sc.slice(0, 10).map(({ name, team, score }) => ({ name, team, score }));
      return { ok: true, teams, top, all: sc.map(({ at, ...r }) => r), players: sc.length };
    },
    kk_bonus_add(a) { if (a.p_pin !== PIN) return no; const d = load(); d.bonus.push({ team: a.p_team, points: a.p_points }); save(d); return { ok: true }; },
    kk_bonus_player(a) { if (a.p_pin !== PIN) return no; const d = load(); if (!d.players[a.p_pid] || d.players[a.p_pid].gone) return { ok: false, err: "who" }; d.bonus.push({ pid: a.p_pid, points: a.p_points }); save(d); return { ok: true }; },
    kk_mine(a) { const d = load(); return { ok: true, bonus: d.bonus.filter((b) => b.pid === a.p_pid).reduce((x, b) => x + b.points, 0) }; },
    kk_voice_send(a) {
      const d = load(), b = String(a.p_body || "").trim().slice(0, 300), p = d.players[a.p_pid];
      if (!p || p.gone) return { ok: false, err: "nojoin" };
      if (b.length < 3) return { ok: false, err: "short" };
      if (d.voices.some((v) => v.pid === a.p_pid)) return { ok: false, err: "dup" };
      d.voices.push({ id: ++d.vid, body: b, name: p.name, team: p.team, pid: a.p_pid, show: !!a.p_show, hidden: d.state.wallAuto !== true, at: Date.now() }); save(d); return { ok: true };
    },
    kk_voices_list(a) { if (a.p_pin !== PIN) return no; return { ok: true, rows: load().voices.map(({ pid, ...v }) => v) }; },
    kk_voice_hide(a) { if (a.p_pin !== PIN) return no; const d = load(); d.voices.forEach((v) => { if (v.id === a.p_id) v.hidden = a.p_hidden; }); save(d); return { ok: true }; },
    kk_players_list(a) { if (a.p_pin !== PIN) return no; const d = load(); return { ok: true, rows: Object.values(d.players).filter((p) => !p.gone).sort((x, y) => x.at - y.at).map(({ id, name, team, hidden }) => ({ id, name, team, hidden })) }; },
    kk_player_hide(a) { if (a.p_pin !== PIN) return no; const d = load(); if (d.players[a.p_id]) d.players[a.p_id].hidden = a.p_hidden; save(d); return { ok: true }; },
    kk_reset(a) {
      if (a.p_pin !== PIN) return no; const d = load();
      Object.values(d.players).forEach((p) => (p.gone = true)); d.answers = {}; d.bonus = []; d.voices.forEach((v) => { v.hidden = true; v.pid = null; });
      d.state = { step: 0, gen: Math.floor(Date.now() / 1000) }; d.seq++; save(d); tell(d); return { ok: true };
    },
  };
  return {
    rpc: (name, args) => new Promise((res) => setTimeout(() => res(F[name](args)), 20)),
    onState: (cb) => subs.push(cb),
  };
};
