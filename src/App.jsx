import React, { useState, useEffect, useCallback } from "react";
import {
  Swords, Sparkles, BookOpen, Dumbbell, Coins, MapPin, Hammer,
  Trees, ClipboardList, ScrollText, Plane, Flame, Check, Plus,
  ChevronRight, RotateCcw, Star, Trophy, Calendar, X, Repeat, LogOut
} from "lucide-react";
import { storage, supabase } from "./storage";

const STORAGE_KEY = "chapter-thirty-state-v3";

const G  = "#46f08a";
const GB = "#9bffc6";
const GG = "rgba(70,240,138,0.40)";

const POINT_CHOICES = [25, 50, 75, 100, 200];

const SKILLS_SEED = [
  { id: "esecutivi", name: "Esecutivi & Definitivi", cat: "Mestiere", icon: "Hammer",
    desc: "Dettagli costruttivi, cantiere, il fare reale.", rep: "Studia 1 dettaglio", repXp: 25,
    milestones: [
      { text: "Studia 1 esecutivo reale", xp: 50 },
      { text: "Affianca un senior", xp: 75 },
      { text: "Disegna un nodo costruttivo", xp: 100 },
      { text: "Segui 1 cantiere", xp: 550 },
    ]},
  { id: "paesaggio", name: "Paesaggio Avanzato", cat: "Mestiere", icon: "Trees",
    desc: "Piazze, parchi, spazio pubblico.", rep: "Analizza 1 pianta / luogo", repXp: 25,
    milestones: [
      { text: "Concept spazio pubblico", xp: 50 },
      { text: "Studio specie/materiali", xp: 75 },
      { text: "Progetto definitivo paesaggio", xp: 100 },
      { text: "Cantiere paesaggio seguito", xp: 550 },
    ]},
  { id: "gestione", name: "Gestione Progetto", cat: "Mestiere", icon: "ClipboardList",
    desc: "Timeline, team, consegne, capo-progetto.", rep: "1 azione di coordinamento", repXp: 25,
    milestones: [
      { text: "Mappa un workflow di studio", xp: 50 },
      { text: "Gestisci 1 consegna end-to-end", xp: 75 },
      { text: "Coordina 1 consulente", xp: 100 },
      { text: "Guida 1 mini-progetto", xp: 150 },
    ]},
  { id: "fiscale", name: "Intelligenza Fiscale", cat: "Madrid", icon: "Coins",
    desc: "Tasse, agevolazioni, costo reale della vita.", rep: "1 ricerca fiscale", repXp: 25,
    milestones: [
      { text: "Capisci il regime fiscale ES", xp: 50 },
      { text: "Agevolazioni stranieri / Beckham", xp: 75 },
      { text: "Costo medio casa Madrid", xp: 50 },
      { text: "Stipendio-soglia + risparmio", xp: 100 },
    ]},
  { id: "negoziazione", name: "Negoziazione", cat: "Madrid", icon: "ScrollText",
    desc: "Sapere il tuo valore di mercato e chiederlo.", rep: "1 dato di mercato raccolto", repXp: 25,
    milestones: [
      { text: "Range stipendi paesaggio ES", xp: 50 },
      { text: "Definisci il tuo numero minimo", xp: 75 },
      { text: "Lista di ciò che vuoi (non solo €)", xp: 50 },
      { text: "Script colloquio pronto", xp: 100 },
    ]},
  { id: "ricerca", name: "Ricerca Città", cat: "Madrid", icon: "MapPin",
    desc: "Studi target, casa col cane, logistica.", rep: "1 studio / contatto trovato", repXp: 25,
    milestones: [
      { text: "3 studi target individuati", xp: 75 },
      { text: "Verifica casa pet-friendly", xp: 50 },
      { text: "Logistica cane (volo/trasloco)", xp: 50 },
      { text: "3 email inviate", xp: 200 },
    ]},
  { id: "forza", name: "Forza", cat: "Corpo", icon: "Dumbbell",
    desc: "La palestra esiste. Usala.", rep: "1 allenamento", repXp: 25,
    milestones: [
      { text: "Prima sessione (ghiaccio rotto)", xp: 50 },
      { text: "1 settimana × 2 allenamenti", xp: 75 },
      { text: "1 mese × 3/sett", xp: 150 },
      { text: "Ritorno al ritmo basket", xp: 200 },
    ]},
  { id: "disciplina", name: "Disciplina", cat: "Corpo", icon: "Flame",
    desc: "Orari, sonno, gaming al posto giusto.", rep: "1 giorno on-track", repXp: 25,
    milestones: [
      { text: "1 settimana studio ≤9:30", xp: 75 },
      { text: "Stop gaming dopo l'1:00", xp: 75 },
      { text: "1 mese di routine stabile", xp: 150 },
      { text: "Prima quota risparmiata", xp: 100 },
    ]},
];

const PORTFOLIO_STEPS = ["File impaginato", "Progetti selezionati", "Mood board", "Colori definiti"];
const PORTFOLIO_DECAY_DAYS = 90;

const CAT_STYLE = {
  Mestiere: { ring: "#b07cff", glow: "rgba(176,124,255,0.35)", label: "Sentiero del Mestiere" },
  Madrid:   { ring: "#ff6b6b", glow: "rgba(255,107,107,0.35)", label: "Sentiero di Madrid" },
  Corpo:    { ring: "#5cc8ff", glow: "rgba(92,200,255,0.35)",  label: "Sentiero del Corpo" },
  Altro:    { ring: G,         glow: GG,                         label: "Imprese Libere" },
};

const ICONS = { Hammer, Trees, ClipboardList, Coins, ScrollText, MapPin, Dumbbell, Flame };

const TIMELINE = [
  { phase: "Ora → Luglio",  title: "Sprint Estivo", note: "Portfolio, fisico, ricerca Madrid, 3 email." },
  { phase: "Ago → Ottobre", title: "Contatti",      note: "Colloqui, offerta in piedi. AG&P come piano B." },
  { phase: "Ott / Nov",     title: "Il Salto",       note: "Uscita da Lombardini. Madrid o AG&P." },
];

const xpForLevel = (lvl) => 200 + (lvl - 1) * 120;

function freshState() {
  return {
    level: 1, xp: 0,
    skills: SKILLS_SEED.reduce((a, s) => { a[s.id] = { done: s.milestones.map(() => false), reps: 0 }; return a; }, {}),
    portfolio: { steps: PORTFOLIO_STEPS.map(() => false), lastUpdated: null },
    checkIns: [],
    customLog: [],
  };
}

export default function App({ session }) {
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("quest");
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      let loaded = null;
      try {
        const r = await storage.get(STORAGE_KEY);
        if (r && r.value) loaded = JSON.parse(r.value);
      } catch (e) {}
      if (!loaded) loaded = freshState();
      setState(loaded);
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setState(next);
    try { await storage.set(STORAGE_KEY, JSON.stringify(next)); } catch (e) { console.error(e); }
  }, []);

  const fireToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  const addXP = (cur, amount) => {
    let { level, xp } = cur; xp += amount;
    while (xp >= xpForLevel(level)) { xp -= xpForLevel(level); level += 1; }
    if (xp < 0) xp = 0;
    return { ...cur, level, xp };
  };

  const toggleMilestone = (skillId, idx) => {
    const skill = SKILLS_SEED.find(s => s.id === skillId);
    const xp = skill.milestones[idx].xp;
    const done = [...state.skills[skillId].done];
    const wasDone = done[idx]; done[idx] = !wasDone;
    let next = { ...state, skills: { ...state.skills, [skillId]: { ...state.skills[skillId], done } } };
    if (!wasDone) { next = addXP(next, xp); fireToast(`+${xp} XP — impresa sbloccata`); }
    else next = { ...next, xp: Math.max(0, next.xp - xp) };
    persist(next);
  };

  const practice = (skillId) => {
    const skill = SKILLS_SEED.find(s => s.id === skillId);
    const xp = skill.repXp ?? 25;
    const sk = state.skills[skillId];
    let next = { ...state, skills: { ...state.skills, [skillId]: { ...sk, reps: sk.reps + 1 } } };
    next = addXP(next, xp);
    persist(next); fireToast(`+${xp} XP — pratica`);
  };

  const togglePortfolio = (idx) => {
    const steps = [...state.portfolio.steps];
    const wasDone = steps[idx]; steps[idx] = !wasDone;
    const allDone = steps.every(Boolean);
    let next = { ...state, portfolio: { steps, lastUpdated: allDone ? Date.now() : state.portfolio.lastUpdated } };
    if (!wasDone) { next = addXP(next, 60); fireToast(allDone ? "📖 Libro Magico forgiato!" : "+60 XP"); }
    else next = { ...next, xp: Math.max(0, next.xp - 60) };
    persist(next);
  };

  const submitCheckIn = (data) => {
    let g = 0;
    if (data.studio) g += 200;
    if (data.noLateGaming) g += 250;
    g += Math.min(data.gym, 4) * 25;
    g += Math.min(data.cooked, 5) * 15;
    g -= Math.min(data.ordered, 5) * 15;
    if (data.cleanHouse) g += 25;
    if (data.sheets) g += 15;
    g += Math.min(data.umido, 2) * 10;
    if (data.dogWalk) g += 15;
    if (data.moneySaved) g += 40;
    if (data.noImpulse) g += 30;
    g += Math.min(data.madrid, 5) * 20;
    if (data.spanish) g += 20;
    g = Math.max(0, g);
    let next = { ...state, checkIns: [{ ...data, gained: g, date: Date.now() }, ...state.checkIns].slice(0, 40) };
    next = addXP(next, g); persist(next);
    setCheckInOpen(false); fireToast(`Check-in registrato — +${g} XP`);
  };

  const addImpresa = ({ label, cat, points }) => {
    let next = { ...state, customLog: [{ label, cat, points, date: Date.now() }, ...state.customLog].slice(0, 60) };
    next = addXP(next, points); persist(next);
    setQuickOpen(false); fireToast(`+${points} XP — ${label}`);
  };

  const resetAll = () => { persist(freshState()); fireToast("Storia azzerata — Livello 1"); };

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=EB+Garamond:ital@0;1&display=swap";
    document.head.appendChild(l);
  }, []);

  if (!state) return (
    <div style={{ minHeight: "100vh", background: "#070b08", color: G, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "serif" }}>
      Evocazione in corso…
    </div>
  );

  let freshness = 0;
  if (state.portfolio.lastUpdated) {
    const days = (Date.now() - state.portfolio.lastUpdated) / 86400000;
    freshness = Math.max(0, Math.min(1, 1 - days / PORTFOLIO_DECAY_DAYS));
  }
  const portfolioForged = state.portfolio.steps.every(Boolean);
  const totalMs = SKILLS_SEED.reduce((a, s) => a + s.milestones.length, 0);
  const doneMs = Object.values(state.skills).reduce((a, sk) => a + sk.done.filter(Boolean).length, 0);
  const xpNeed = xpForLevel(state.level);
  const xpPct = Math.round((state.xp / xpNeed) * 100);

  const ui = {
    page: { minHeight: "100vh", background: "radial-gradient(1200px 600px at 50% -10%, #14241a 0%, #0c1410 45%, #070b08 100%)", color: "#e6f3ea", fontFamily: "'EB Garamond', Georgia, serif", padding: "0 0 110px" },
    display: { fontFamily: "'Cinzel', serif" },
  };

  return (
    <div style={ui.page}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", opacity: 0.05, zIndex: 0,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      <header style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "34px 20px 18px", borderBottom: `1px solid ${GG}` }}>
        <div style={{ ...ui.display, letterSpacing: "0.5em", fontSize: 11, color: G, marginBottom: 6 }}>⚔ LA TUA STORIA ⚔</div>
        <h1 style={{ ...ui.display, fontWeight: 900, fontSize: 40, margin: 0, color: "#f0fff5", textShadow: `0 2px 22px ${GG}` }}>
          CHAPTER <span style={{ color: G }}>THIRTY</span>
        </h1>
        <p style={{ margin: "8px auto 0", maxWidth: 460, fontStyle: "italic", color: "#8fb89f", fontSize: 15 }}>
          Giacomo, Architetto del Paesaggio · Lvl {state.level}
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          title="Esci"
          style={{ position: "absolute", top: 18, right: 18, cursor: "pointer", background: "transparent", border: `1px solid ${GG}`, borderRadius: 8, color: "#6f9a80", padding: "6px 10px", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}
        >
          <LogOut size={14} /> Esci
        </button>
      </header>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "20px auto 0", padding: "0 18px" }}>
        <div style={{ background: "rgba(10,18,13,0.7)", border: `1px solid ${GG}`, borderRadius: 14, padding: "16px 18px", boxShadow: "0 0 40px rgba(0,0,0,0.5) inset" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ ...ui.display, fontSize: 13, color: G, letterSpacing: "0.15em" }}>LIVELLO {state.level}</span>
            <span style={{ fontSize: 13, color: "#8fb89f" }}>{state.xp} / {xpNeed} XP</span>
          </div>
          <div style={{ height: 16, background: "#0b140e", borderRadius: 8, overflow: "hidden", border: `1px solid ${GG}` }}>
            <div style={{ height: "100%", width: `${xpPct}%`, borderRadius: 8, background: `linear-gradient(90deg,#1a7a45,${G},${GB})`, boxShadow: `0 0 14px ${GG}`, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 14, flexWrap: "wrap" }}>
            <Stat label="Imprese" value={`${doneMs}/${totalMs}`} />
            <Stat label="Check-in" value={state.checkIns.length} />
            <Stat label="Libro Magico" value={portfolioForged ? `${Math.round(freshness*100)}%` : "—"} />
          </div>
        </div>
      </div>

      <nav style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center", gap: 8, margin: "22px auto 0", flexWrap: "wrap", padding: "0 14px" }}>
        {[["quest","Talenti",Swords],["portfolio","Libro Magico",BookOpen],["road","Il Cammino",Plane],["log","Cronaca",Calendar]].map(([k,label,Ic]) => (
          <button key={k} onClick={() => setTab(k)} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", ...ui.display, fontSize: 12, letterSpacing: "0.08em", padding: "9px 15px", borderRadius: 9,
            border: `1px solid ${tab===k ? G : GG}`, background: tab===k ? "rgba(70,240,138,0.13)" : "transparent", color: tab===k ? "#f0fff5" : "#8fb89f" }}>
            <Ic size={15} /> {label}
          </button>
        ))}
      </nav>

      <main style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "22px auto 0", padding: "0 18px" }}>
        {tab === "quest" && (
          <div>
            {["Mestiere","Madrid","Corpo"].map((cat) => (
              <section key={cat} style={{ marginBottom: 26 }}>
                <h2 style={{ ...ui.display, fontSize: 15, letterSpacing: "0.12em", margin: "0 0 12px", color: CAT_STYLE[cat].ring, display: "flex", alignItems: "center", gap: 8 }}>
                  <Star size={15} /> {CAT_STYLE[cat].label.toUpperCase()}
                </h2>
                <div style={{ display: "grid", gap: 12 }}>
                  {SKILLS_SEED.filter(s => s.cat === cat).map((s) => (
                    <SkillCard key={s.id} skill={s} sk={state.skills[s.id]} onToggle={(i) => toggleMilestone(s.id, i)} onPractice={() => practice(s.id)} ui={ui} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
        {tab === "portfolio" && <PortfolioPanel steps={state.portfolio.steps} forged={portfolioForged} freshness={freshness} onToggle={togglePortfolio} ui={ui} />}
        {tab === "road" && <RoadPanel ui={ui} />}
        {tab === "log" && <LogPanel checkIns={state.checkIns} customLog={state.customLog} ui={ui} onReset={resetAll} />}
      </main>

      <button onClick={() => setQuickOpen(true)} title="Aggiungi impresa" style={{ position: "fixed", bottom: 24, right: 20, zIndex: 5, cursor: "pointer", width: 52, height: 52, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${GB}`, color: "#06140c", background: `linear-gradient(135deg,${G},${GB})`, boxShadow: `0 6px 24px ${GG}` }}>
        <Plus size={24} />
      </button>
      <button onClick={() => setCheckInOpen(true)} style={{ position: "fixed", bottom: 24, left: 20, zIndex: 5, ...ui.display, fontSize: 12.5, letterSpacing: "0.08em", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 8, padding: "13px 20px", borderRadius: 30, border: `1px solid ${GB}`, color: "#06140c", background: `linear-gradient(90deg,${G},${GB})`, boxShadow: `0 6px 30px ${GG}` }}>
        <Sparkles size={16} /> CHECK-IN
      </button>

      {checkInOpen && <CheckInModal onClose={() => setCheckInOpen(false)} onSubmit={submitCheckIn} ui={ui} />}
      {quickOpen && <QuickAddModal onClose={() => setQuickOpen(false)} onSubmit={addImpresa} ui={ui} />}

      {toast && (
        <div style={{ position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)", zIndex: 7, background: "rgba(10,18,13,0.96)", border: `1px solid ${G}`, color: GB, padding: "10px 20px", borderRadius: 10, ...ui.display, fontSize: 13, boxShadow: "0 4px 24px rgba(0,0,0,0.6)" }}>{toast}</div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 700, color: "#f0fff5" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#6f9a80", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function SkillCard({ skill, sk, onToggle, onPractice, ui }) {
  const [open, setOpen] = useState(false);
  const Ic = ICONS[skill.icon] || Star;
  const cs = CAT_STYLE[skill.cat];
  const done = sk.done;
  const completed = done.filter(Boolean).length;
  const total = skill.milestones.length;
  const pct = Math.round((completed / total) * 100);
  const maxed = completed === total;

  return (
    <div style={{ background: "rgba(12,20,14,0.72)", border: `1px solid ${maxed ? cs.ring : "rgba(70,240,138,0.16)"}`, borderRadius: 13, overflow: "hidden", boxShadow: maxed ? `0 0 26px ${cs.glow}` : "none" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", cursor: "pointer", display: "flex", alignItems: "center", gap: 13, padding: "14px 15px", background: "transparent", border: "none", color: "#e6f3ea", textAlign: "left" }}>
        <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: maxed ? cs.ring : "rgba(70,240,138,0.08)", border: `1px solid ${cs.ring}`, color: maxed ? "#06140c" : cs.ring, boxShadow: maxed ? `0 0 16px ${cs.glow}` : "none" }}>
          {maxed ? <Trophy size={20} /> : <Ic size={20} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...ui.display, fontSize: 15, color: "#f0fff5", display: "flex", alignItems: "center", gap: 8 }}>
            {skill.name}
            {sk.reps > 0 && <span style={{ fontSize: 11, color: cs.ring, border: `1px solid ${cs.ring}`, borderRadius: 20, padding: "1px 8px" }}>×{sk.reps}</span>}
          </div>
          <div style={{ fontSize: 12.5, color: "#7fa890", fontStyle: "italic" }}>{skill.desc}</div>
          <div style={{ marginTop: 7, height: 6, background: "#0b140e", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: cs.ring, borderRadius: 4, boxShadow: `0 0 8px ${cs.glow}`, transition: "width 0.4s ease" }} />
          </div>
        </div>
        <ChevronRight size={18} style={{ color: cs.ring, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div style={{ padding: "2px 15px 14px 70px", display: "grid", gap: 7 }}>
          <button onClick={onPractice} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 8, border: `1px dashed ${cs.ring}`, background: "rgba(70,240,138,0.04)", color: cs.ring, textAlign: "left", fontSize: 13.5 }}>
            <Repeat size={15} /> {skill.rep}
            <span style={{ marginLeft: "auto", ...ui.display, fontSize: 11 }}>+{skill.repXp ?? 25} · ripetibile</span>
          </button>
          {skill.milestones.map((m, i) => (
            <button key={i} onClick={() => onToggle(i)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", borderRadius: 8,
              border: `1px solid ${done[i] ? cs.ring : "rgba(70,240,138,0.14)"}`, background: done[i] ? cs.glow : "transparent", color: done[i] ? "#f0fff5" : "#8fb89f", textAlign: "left", fontSize: 13.5, textDecoration: done[i] ? "line-through" : "none" }}>
              <span style={{ flexShrink: 0, width: 19, height: 19, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${cs.ring}`, background: done[i] ? cs.ring : "transparent", color: "#06140c" }}>
                {done[i] && <Check size={13} />}
              </span>
              {m.text}
              <span style={{ marginLeft: "auto", fontSize: 11, color: cs.ring, ...ui.display }}>+{m.xp}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PortfolioPanel({ steps, forged, freshness, onToggle, ui }) {
  const glowColor = `rgba(155,255,198,${0.25 + freshness * 0.55})`;
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 110, height: 130, borderRadius: 10, position: "relative", background: forged ? "linear-gradient(160deg, #124a2c, #08210f)" : "rgba(16,26,18,0.5)", border: `2px solid ${forged ? G : "rgba(70,240,138,0.22)"}`, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: forged ? `0 0 ${20 + freshness*40}px ${glowColor}` : "none", filter: forged ? `saturate(${0.4 + freshness*0.6}) brightness(${0.6 + freshness*0.5})` : "grayscale(1) brightness(0.5)" }}>
            <BookOpen size={46} style={{ color: forged ? GB : "#4a6b56" }} />
            {forged && <Sparkles size={18} style={{ position: "absolute", top: 8, right: 8, color: GB }} />}
          </div>
          <div style={{ ...ui.display, marginTop: 12, fontSize: 16, color: forged ? GB : "#6f9a80" }}>LIBRO MAGICO</div>
          <div style={{ fontSize: 12.5, color: "#6f9a80", fontStyle: "italic", marginTop: 2 }}>{forged ? `Forgiato · freschezza ${Math.round(freshness*100)}%` : "Non ancora forgiato"}</div>
        </div>
      </div>
      {forged && freshness < 0.4 && (
        <div style={{ textAlign: "center", marginBottom: 18, padding: "10px 14px", borderRadius: 10, background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.4)", color: "#ffb3b3", fontSize: 13 }}>
          ⚠ Il portfolio invecchia. Aggiorna gli step per riforgiarlo a piena potenza.
        </div>
      )}
      <p style={{ textAlign: "center", color: "#8fb89f", fontStyle: "italic", fontSize: 14, margin: "0 0 16px" }}>Completa i 4 passi per forgiare il Libro. Decade in 90 giorni: va riaggiornato.</p>
      <div style={{ display: "grid", gap: 10 }}>
        {PORTFOLIO_STEPS.map((s, i) => (
          <button key={i} onClick={() => onToggle(i)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", borderRadius: 11, border: `1px solid ${steps[i] ? G : "rgba(70,240,138,0.18)"}`, background: steps[i] ? "rgba(70,240,138,0.12)" : "rgba(12,20,14,0.6)", color: steps[i] ? "#f0fff5" : "#8fb89f", textAlign: "left" }}>
            <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${G}`, background: steps[i] ? G : "transparent", color: "#06140c" }}>{steps[i] && <Check size={14} />}</span>
            <span style={{ flex: 1, fontSize: 14.5, textDecoration: steps[i] ? "line-through" : "none" }}>{s}</span>
            <span style={{ ...ui.display, fontSize: 11, color: G }}>+60</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RoadPanel({ ui }) {
  return (
    <div>
      <p style={{ textAlign: "center", color: "#8fb89f", fontStyle: "italic", fontSize: 14, margin: "0 0 22px" }}>Due porte alla fine del cammino. Madrid accende il cuore — AG&P è il varco sicuro.</p>
      <div style={{ display: "grid", gap: 14 }}>
        {TIMELINE.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, border: `1px solid ${G}`, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(70,240,138,0.13)", color: GB, ...ui.display, fontSize: 13 }}>{i+1}</div>
              {i < TIMELINE.length - 1 && <div style={{ width: 1, flex: 1, background: GG, marginTop: 4 }} />}
            </div>
            <div style={{ background: "rgba(12,20,14,0.65)", border: "1px solid rgba(70,240,138,0.18)", borderRadius: 12, padding: "13px 16px", flex: 1, marginBottom: 6 }}>
              <div style={{ ...ui.display, fontSize: 11, letterSpacing: "0.1em", color: G }}>{t.phase}</div>
              <div style={{ ...ui.display, fontSize: 16, color: "#f0fff5", margin: "3px 0 4px" }}>{t.title}</div>
              <div style={{ fontSize: 13.5, color: "#8fb89f", fontStyle: "italic" }}>{t.note}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 22 }}>
        <Door title="MADRID" sub="Il salto" color="#ff6b6b" icon={Plane} ui={ui} line="Casa con l'amica · cane · spagnolo · sole. Studi piccoli, più rischio, forse per sempre." />
        <Door title="AG&P" sub="Il mestiere" color="#b07cff" icon={Hammer} ui={ui} line="Cantiere, esecutivi, paesaggio serio. Reset interno a Milano. 1–2 anni, poi decidi." />
      </div>
    </div>
  );
}

function Door({ title, sub, color, icon: Ic, line, ui }) {
  return (
    <div style={{ background: "rgba(12,20,14,0.7)", border: `1px solid ${color}`, borderRadius: 13, padding: "16px 14px", textAlign: "center", boxShadow: `0 0 22px ${color}33` }}>
      <Ic size={26} style={{ color }} />
      <div style={{ ...ui.display, fontSize: 17, color: "#f0fff5", marginTop: 8 }}>{title}</div>
      <div style={{ ...ui.display, fontSize: 11, letterSpacing: "0.12em", color, marginBottom: 8 }}>{sub.toUpperCase()}</div>
      <div style={{ fontSize: 12.5, color: "#8fb89f", fontStyle: "italic", lineHeight: 1.45 }}>{line}</div>
    </div>
  );
}

function LogPanel({ checkIns, customLog, ui, onReset }) {
  const [confirming, setConfirming] = useState(false);
  const merged = [
    ...checkIns.map(c => ({ kind: "ci", date: c.date, data: c })),
    ...customLog.map(c => ({ kind: "imp", date: c.date, data: c })),
  ].sort((a, b) => b.date - a.date);

  return (
    <div>
      {merged.length === 0 ? (
        <p style={{ textAlign: "center", color: "#6f9a80", fontStyle: "italic", padding: "30px 0" }}>Nessuna cronaca ancora. Il primo gesto apre il libro della tua storia.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {merged.map((e, i) => e.kind === "imp" ? (
            <div key={i} style={{ background: "rgba(12,20,14,0.65)", border: `1px solid ${CAT_STYLE[e.data.cat]?.ring || G}55`, borderRadius: 11, padding: "11px 15px", display: "flex", alignItems: "center", gap: 10 }}>
              <Sparkles size={15} style={{ color: CAT_STYLE[e.data.cat]?.ring || G }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: "#e6f3ea" }}>{e.data.label}</div>
                <div style={{ fontSize: 11.5, color: "#6f9a80" }}>{e.data.cat} · {new Date(e.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</div>
              </div>
              <span style={{ ...ui.display, fontSize: 13, color: GB }}>+{e.data.points}</span>
            </div>
          ) : (
            <div key={i} style={{ background: "rgba(12,20,14,0.65)", border: "1px solid rgba(70,240,138,0.18)", borderRadius: 11, padding: "12px 15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: "#6f9a80" }}>📋 Check-in · {new Date(e.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</span>
                <span style={{ ...ui.display, fontSize: 13, color: GB }}>+{e.data.gained} XP</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#aecbb9", display: "flex", flexWrap: "wrap", gap: 9 }}>
                <span>🏛 {e.data.studio ? "≤9:15 ✓" : "—"}</span>
                <span>🏋 {e.data.gym}×</span>
                <span>🍳 {e.data.cooked}× · 🛵 {e.data.ordered}×</span>
                {e.data.cleanHouse && <span>🧹 ✓</span>}
                {e.data.sheets && <span>🛏 ✓</span>}
                {e.data.umido > 0 && <span>♻ {e.data.umido}×</span>}
                {e.data.dogWalk && <span>🐕 ✓</span>}
                <span>💰 {e.data.moneySaved ? "✓" : "—"}</span>
                {e.data.noImpulse && <span>🛡 ✓</span>}
                <span>✈ {e.data.madrid ?? 0}</span>
                {e.data.spanish && <span>🇪🇸 ✓</span>}
                {e.data.noLateGaming && <span>🌙 ✓</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {!confirming ? (
        <button onClick={() => setConfirming(true)} style={{ display: "flex", alignItems: "center", gap: 7, margin: "26px auto 0", cursor: "pointer", background: "transparent", border: "1px solid rgba(255,107,107,0.4)", color: "#ff9d9d", padding: "8px 16px", borderRadius: 9, fontSize: 12.5, ...ui.display }}>
          <RotateCcw size={14} /> Azzera la storia
        </button>
      ) : (
        <div style={{ margin: "26px auto 0", maxWidth: 320, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#ff9d9d", marginBottom: 10 }}>Sicuro? Perdi tutti i progressi.</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => { onReset(); setConfirming(false); }} style={{ cursor: "pointer", background: "rgba(255,107,107,0.15)", border: "1px solid #ff6b6b", color: "#ff9d9d", padding: "9px 18px", borderRadius: 9, fontSize: 12.5, ...ui.display }}>
              Sì, azzera
            </button>
            <button onClick={() => setConfirming(false)} style={{ cursor: "pointer", background: "transparent", border: "1px solid rgba(70,240,138,0.3)", color: "#8fb89f", padding: "9px 18px", borderRadius: 9, fontSize: 12.5, ...ui.display }}>
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAddModal({ onClose, onSubmit, ui }) {
  const [label, setLabel] = useState("");
  const [cat, setCat] = useState("Mestiere");
  const [points, setPoints] = useState(25);
  const cats = ["Mestiere", "Madrid", "Corpo", "Altro"];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 11, background: "rgba(3,8,5,0.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: "linear-gradient(160deg,#0e1a12,#08120b)", border: `1px solid ${G}`, borderRadius: 16, padding: "20px 22px 24px", boxShadow: `0 0 60px rgba(70,240,138,0.22)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ ...ui.display, fontSize: 19, color: "#f0fff5", margin: 0 }}>Aggiungi Impresa</h3>
          <button onClick={onClose} style={{ cursor: "pointer", background: "none", border: "none", color: "#6f9a80" }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 13, color: "#8fb89f", fontStyle: "italic", margin: "0 0 14px" }}>Hai fatto qualcosa di buono? Registralo e attribuiti i punti.</p>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Cosa hai fatto?" style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 10, border: `1px solid ${GG}`, background: "rgba(10,18,13,0.7)", color: "#e6f3ea", fontSize: 14.5, fontFamily: "inherit", outline: "none" }} />
        <div style={{ ...ui.display, fontSize: 11, letterSpacing: "0.12em", color: "#6f9a80", margin: "16px 0 7px" }}>SENTIERO</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ cursor: "pointer", padding: "7px 13px", borderRadius: 20, fontSize: 13, ...ui.display,
              border: `1px solid ${cat===c ? CAT_STYLE[c].ring : "rgba(70,240,138,0.2)"}`, background: cat===c ? CAT_STYLE[c].glow : "transparent", color: cat===c ? "#f0fff5" : "#8fb89f" }}>{c}</button>
          ))}
        </div>
        <div style={{ ...ui.display, fontSize: 11, letterSpacing: "0.12em", color: "#6f9a80", margin: "16px 0 7px" }}>PUNTI</div>
        <div style={{ display: "flex", gap: 7 }}>
          {POINT_CHOICES.map(p => (
            <button key={p} onClick={() => setPoints(p)} style={{ cursor: "pointer", flex: 1, padding: "10px 0", borderRadius: 9, ...ui.display, fontSize: 14,
              border: `1px solid ${points===p ? G : "rgba(70,240,138,0.2)"}`, background: points===p ? "rgba(70,240,138,0.14)" : "transparent", color: points===p ? GB : "#8fb89f" }}>+{p}</button>
          ))}
        </div>
        <button disabled={!label.trim()} onClick={() => label.trim() && onSubmit({ label: label.trim(), cat, points })}
          style={{ width: "100%", marginTop: 20, cursor: label.trim() ? "pointer" : "not-allowed", opacity: label.trim() ? 1 : 0.4, ...ui.display, fontSize: 14, letterSpacing: "0.08em", padding: "13px", borderRadius: 11, border: `1px solid ${GB}`, color: "#06140c", background: `linear-gradient(90deg,${G},${GB})` }}>
          REGISTRA · +{points} XP
        </button>
      </div>
    </div>
  );
}

function CheckInModal({ onClose, onSubmit, ui }) {
  const [v, setV] = useState({ studio: false, noLateGaming: false, gym: 0, cooked: 0, ordered: 0, cleanHouse: false, sheets: false, umido: 0, dogWalk: false, moneySaved: false, noImpulse: false, madrid: 0, spanish: false });
  const set = (k) => (val) => setV(s => ({ ...s, [k]: val }));

  const SectionTitle = ({ color, children }) => (<div style={{ ...ui.display, fontSize: 11, letterSpacing: "0.14em", color, margin: "16px 0 2px" }}>{children}</div>);
  const Row = ({ label, points, children }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(70,240,138,0.1)" }}>
      <span style={{ fontSize: 14, color: "#e6f3ea" }}>{label} {points && <span style={{ color: "#6f9a80", fontSize: 12 }}>{points}</span>}</span>{children}
    </div>
  );
  const Toggle = ({ on, onSet }) => (
    <button onClick={() => onSet(!on)} style={{ cursor: "pointer", width: 50, height: 27, borderRadius: 14, border: `1px solid ${on ? G : "rgba(70,240,138,0.3)"}`, position: "relative", background: on ? G : "transparent" }}>
      <span style={{ position: "absolute", top: 2, left: on ? 25 : 2, width: 21, height: 21, borderRadius: "50%", background: on ? "#06140c" : "#6f9a80", transition: "left 0.2s" }} />
    </button>
  );
  const Counter = ({ val, onSet, max }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button onClick={() => onSet(Math.max(0, val - 1))} style={cBtn}>−</button>
      <span style={{ ...ui.display, fontSize: 16, color: GB, minWidth: 18, textAlign: "center" }}>{val}</span>
      <button onClick={() => onSet(Math.min(max, val + 1))} style={cBtn}>+</button>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 10, background: "rgba(3,8,5,0.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto", background: "linear-gradient(160deg,#0e1a12,#08120b)", border: `1px solid ${G}`, borderRadius: 16, padding: "20px 22px 24px", boxShadow: `0 0 60px rgba(70,240,138,0.22)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ ...ui.display, fontSize: 19, color: "#f0fff5", margin: 0 }}>Check-in settimanale</h3>
          <button onClick={onClose} style={{ cursor: "pointer", background: "none", border: "none", color: "#6f9a80" }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 13, color: "#8fb89f", fontStyle: "italic", margin: "6px 0 0" }}>Com'è andata la settimana? Sii onesto — il gioco funziona solo così.</p>

        <SectionTitle color="#5cc8ff">⚑ LAVORO & DISCIPLINA</SectionTitle>
        <Row label="In studio entro le 9:15" points="+200"><Toggle on={v.studio} onSet={set("studio")} /></Row>
        <Row label="Niente gaming dopo l'1:00" points="+250"><Toggle on={v.noLateGaming} onSet={set("noLateGaming")} /></Row>

        <SectionTitle color="#5cc8ff">⚑ CORPO & CASA</SectionTitle>
        <Row label="Palestra" points="+25 cad."><Counter val={v.gym} onSet={set("gym")} max={7} /></Row>
        <Row label="Cucinato a casa" points="+15 cad."><Counter val={v.cooked} onSet={set("cooked")} max={7} /></Row>
        <Row label="Ordinato cibo" points="−15 cad."><Counter val={v.ordered} onSet={set("ordered")} max={7} /></Row>
        <Row label="Casa pulita" points="+25"><Toggle on={v.cleanHouse} onSet={set("cleanHouse")} /></Row>
        <Row label="Lenzuola cambiate" points="+15"><Toggle on={v.sheets} onSet={set("sheets")} /></Row>
        <Row label="Umido buttato (obiettivo 2×)" points="+10 cad."><Counter val={v.umido} onSet={set("umido")} max={4} /></Row>
        <Row label="Passeggiata lunga col cane" points="+15"><Toggle on={v.dogWalk} onSet={set("dogWalk")} /></Row>

        <SectionTitle color="#ff6b6b">⚑ SOLDI & MADRID</SectionTitle>
        <Row label="Soldi messi da parte" points="+40"><Toggle on={v.moneySaved} onSet={set("moneySaved")} /></Row>
        <Row label="Nessun acquisto d'impulso" points="+30"><Toggle on={v.noImpulse} onSet={set("noImpulse")} /></Row>
        <Row label="Azioni verso Madrid" points="+20 cad."><Counter val={v.madrid} onSet={set("madrid")} max={5} /></Row>
        <Row label="Spagnolo praticato" points="+20"><Toggle on={v.spanish} onSet={set("spanish")} /></Row>

        <button onClick={() => onSubmit(v)} style={{ width: "100%", marginTop: 20, cursor: "pointer", ...ui.display, fontSize: 14, letterSpacing: "0.08em", padding: "13px", borderRadius: 11, border: `1px solid ${GB}`, color: "#06140c", background: `linear-gradient(90deg,${G},${GB})` }}>
          REGISTRA & GUADAGNA XP
        </button>
      </div>
    </div>
  );
}

const cBtn = { cursor: "pointer", width: 28, height: 28, borderRadius: 7, border: "1px solid #46f08a", background: "transparent", color: "#46f08a", fontSize: 18, lineHeight: 1 };
