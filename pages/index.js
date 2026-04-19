import { useState, useRef, useEffect } from "react";

const SUPABASE_URL = "https://ckzcgtwdyuqdtaziqsfb.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNremNndHdkeXVxZHRhemlxc2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NTEyMjQsImV4cCI6MjA5MjEyNzIyNH0.d6uDSRhVOBl2BriIUTE43vA042mYPSRqCL95AqtIn6U";
const TEACHER_CODE = "DANI2025";
const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

async function db({ table, method = "GET", body, filters = "" }) {
  try {
    const headers = { "Content-Type": "application/json", "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` };
    if (method === "POST") headers["Prefer"] = "return=representation";
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${filters}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    return await res.json();
  } catch (e) { return null; }
}

const LEVELS = [
  { id: 0, name: "Nivel 1", emoji: "🌱", subject: "Multiplicación", ops: ["×"], maxZeros: 2, color: "#4F8EF7" },
  { id: 1, name: "Nivel 2", emoji: "🌿", subject: "División", ops: ["÷"], maxZeros: 2, color: "#A855F7" },
  { id: 2, name: "Nivel 3", emoji: "🏆", subject: "¡Mixto!", ops: ["×", "÷"], maxZeros: 3, color: "#F97316" },
];

function generateProblem(li) {
  const lvl = LEVELS[li];
  const op = lvl.ops[Math.floor(Math.random() * lvl.ops.length)];
  const z = Math.floor(Math.random() * lvl.maxZeros) + 1;
  const pow = Math.pow(10, z);
  let expr, result;
  if (op === "×") { const a = Math.floor(Math.random() * 9) + 1, b = Math.floor(Math.random() * 9) + 1; result = a * pow * b; expr = `${a * pow} × ${b}`; }
  else { const q = Math.floor(Math.random() * 9) + 1, d = Math.floor(Math.random() * 9) + 1; result = q * pow; expr = `${q * d * pow} ÷ ${d}`; }
  const s = result.toString(), tz = Math.max(1, (s.match(/0+$/) || [""])[0].length);
  return { expr, resultStr: s, nonZero: s.slice(0, s.length - tz), tz };
}

const card = { background: "white", borderRadius: 28, padding: "36px 30px", maxWidth: 460, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" };
const inp = { width: "100%", padding: "13px 16px", borderRadius: 14, border: "2px solid #e2e8f0", fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 };
const btn = (bg, ex = {}) => ({ width: "100%", padding: "14px 0", borderRadius: 18, border: "none", background: bg, color: "white", fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "inherit", marginTop: 8, ...ex });
const pg = (bg = "linear-gradient(135deg,#667eea,#764ba2)") => ({ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: bg, padding: 20, fontFamily: "'Nunito',sans-serif" });

function Home({ go }) {
  return (
    <div style={pg()}>
      <div style={{ ...card, textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 8 }}>🎓</div>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "#1e293b", margin: "0 0 6px" }}>MateJuegos</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 32 }}>La plataforma de Dani para aprender matemática jugando</p>
        <button onClick={() => go("teacher-login")} style={btn("linear-gradient(135deg,#667eea,#764ba2)", { padding: "16px 0", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 })}>👩‍🏫 Soy docente</button>
        <button onClick={() => go("student-enter")} style={btn("linear-gradient(135deg,#4F8EF7,#06b6d4)", { padding: "16px 0", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 14 })}>👩‍🎓 Soy alumna/o</button>
      </div>
    </div>
  );
}

function TeacherLogin({ go, setTeacher }) {
  const [code, setCode] = useState(""), [err, setErr] = useState("");
  const login = () => {
    if (code.trim().toUpperCase() === TEACHER_CODE) { setTeacher({ name: "Dani" }); go("teacher-dashboard"); }
    else setErr("Código incorrecto.");
  };
  return (
    <div style={pg()}>
      <div style={card}>
        <button onClick={() => go("home")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14, marginBottom: 20, padding: 0 }}>← Volver</button>
        <div style={{ fontSize: 40, textAlign: "center", marginBottom: 8 }}>👩‍🏫</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "#1e293b", textAlign: "center", marginBottom: 4 }}>Panel Docente</h2>
        <p style={{ color: "#64748b", fontSize: 13, textAlign: "center", marginBottom: 24 }}>Ingresá tu código de acceso</p>
        <input style={{ ...inp, textAlign: "center", fontSize: 22, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase" }} placeholder="CÓDIGO" value={code} maxLength={12} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && login()} />
        {err && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 10px" }}>{err}</p>}
        <button style={btn("linear-gradient(135deg,#667eea,#764ba2)")} onClick={login}>Ingresar 🔑</button>
        <div style={{ background: "#f8fafc", borderRadius: 14, padding: "14px 16px", marginTop: 20, fontSize: 13, color: "#64748b" }}>💡 Tu código es: <strong style={{ color: "#667eea", letterSpacing: 2 }}>DANI2025</strong></div>
      </div>
    </div>
  );
}

function TeacherDashboard({ go }) {
  const [classes, setClasses] = useState([]), [selected, setSelected] = useState(null), [results, setResults] = useState([]);
  const [newName, setNewName] = useState(""), [loading, setLoading] = useState(true), [creating, setCreating] = useState(false), [loadingRes, setLoadingRes] = useState(false), [dbErr, setDbErr] = useState(false);
  useEffect(() => { loadClasses(); }, []);
  const loadClasses = async () => {
    setLoading(true);
    const data = await db({ table: "classes", filters: "?order=created_at.desc" });
    if (Array.isArray(data)) { setClasses(data); setDbErr(false); } else setDbErr(true);
    setLoading(false);
  };
  const selectClass = async (cls) => {
    setSelected(cls); setLoadingRes(true);
    const data = await db({ table: "game_results", filters: `?class_code=eq.${cls.code}&order=played_at.desc` });
    if (Array.isArray(data)) setResults(data);
    setLoadingRes(false);
  };
  const createClass = async () => {
    if (!newName.trim()) return; setCreating(true);
    await db({ table: "classes", method: "POST", body: { teacher_email: "dani", name: newName.trim(), code: genCode() } });
    setNewName(""); await loadClasses(); setCreating(false);
  };
  const studentStats = results.reduce((acc, r) => {
    if (!acc[r.student_name]) acc[r.student_name] = { plays: 0, totalScore: 0, correct: 0, wrong: 0, lastLevel: 0 };
    const s = acc[r.student_name]; s.plays++; s.totalScore += r.score; s.correct += r.correct_count; s.wrong += r.wrong_count; s.lastLevel = Math.max(s.lastLevel, r.level_reached);
    return acc;
  }, {});
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Nunito',sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#667eea,#764ba2)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Panel Docente</div><div style={{ color: "white", fontSize: 22, fontWeight: 900 }}>🎓 MateJuegos</div></div>
        <button onClick={() => go("home")} style={{ background: "rgba(255,255,255,0.18)", border: "none", color: "white", borderRadius: 12, padding: "8px 18px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Salir</button>
      </div>
      {dbErr && <div style={{ background: "#fef2f2", border: "2px solid #fecaca", borderRadius: 16, padding: "14px 20px", margin: "20px auto", maxWidth: 800, color: "#dc2626", fontWeight: 700, fontSize: 14 }}>⚠️ No se pudo conectar a la base de datos. <button onClick={loadClasses} style={{ marginLeft: 12, background: "#ef4444", border: "none", color: "white", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Reintentar</button></div>}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px", display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 18, alignItems: "start" }}>
        <div>
          <div style={{ background: "white", borderRadius: 20, padding: 22, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin: "0 0 14px", color: "#1e293b", fontWeight: 900, fontSize: 16 }}>➕ Nueva clase</h3>
            <input style={{ ...inp, marginBottom: 10 }} placeholder="Nombre (ej: 4to grado)" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && createClass()} />
            <button onClick={createClass} disabled={creating || !newName.trim()} style={btn("linear-gradient(135deg,#667eea,#764ba2)", { marginTop: 0 })}>{creating ? "Creando..." : "Crear clase"}</button>
          </div>
          <div style={{ background: "white", borderRadius: 20, padding: 22, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin: "0 0 14px", color: "#1e293b", fontWeight: 900, fontSize: 16 }}>📚 Mis clases</h3>
            {loading && <p style={{ color: "#94a3b8", fontSize: 14 }}>Cargando...</p>}
            {!loading && classes.length === 0 && !dbErr && <p style={{ color: "#94a3b8", fontSize: 14 }}>Todavía no creaste ninguna clase.</p>}
            {classes.map(cls => (
              <div key={cls.id} onClick={() => selectClass(cls)} style={{ border: `2px solid ${selected?.id === cls.id ? "#667eea" : "#f1f5f9"}`, borderRadius: 16, padding: "14px 16px", marginBottom: 10, cursor: "pointer", background: selected?.id === cls.id ? "#f5f3ff" : "#fafafa", transition: "all 0.2s" }}>
                <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 15, marginBottom: 4 }}>{cls.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>{new Date(cls.created_at).toLocaleDateString("es-AR")}</span>
                  <span style={{ background: "#667eea22", color: "#667eea", borderRadius: 10, padding: "3px 10px", fontWeight: 900, fontSize: 15, letterSpacing: 2 }}>{cls.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          {!selected && <div style={{ background: "white", borderRadius: 20, padding: 40, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}><div style={{ fontSize: 48, marginBottom: 12 }}>👈</div><p style={{ color: "#94a3b8", fontWeight: 700 }}>Seleccioná una clase para ver los resultados</p></div>}
          {selected && (
            <div style={{ background: "white", borderRadius: 20, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div><h3 style={{ margin: "0 0 4px", color: "#1e293b", fontWeight: 900 }}>📊 {selected.name}</h3><p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>Código: <strong style={{ color: "#667eea", letterSpacing: 1 }}>{selected.code}</strong> · {results.length} partidas</p></div>
                <button onClick={() => selectClass(selected)} style={{ background: "#f1f5f9", border: "none", borderRadius: 12, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, color: "#64748b" }}>🔄 Actualizar</button>
              </div>
              {loadingRes && <p style={{ color: "#94a3b8" }}>Cargando...</p>}
              {!loadingRes && results.length === 0 && <div style={{ textAlign: "center", padding: "30px 0" }}><div style={{ fontSize: 40 }}>🎮</div><p style={{ color: "#94a3b8", marginTop: 8 }}>Nadie jugó todavía.<br />Compartí el código <strong style={{ color: "#667eea" }}>{selected.code}</strong></p></div>}
              {!loadingRes && Object.keys(studentStats).length > 0 && (
                <>
                  <h4 style={{ color: "#475569", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>Resumen por alumno</h4>
                  {Object.entries(studentStats).map(([name, s]) => (
                    <div key={name} style={{ background: "#f8fafc", borderRadius: 14, padding: "12px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div><div style={{ fontWeight: 800, color: "#1e293b" }}>{name}</div><div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{s.plays} partida{s.plays !== 1 ? "s" : ""}</div></div>
                      <div style={{ display: "flex", gap: 10, textAlign: "center" }}>
                        <div><div style={{ fontWeight: 900, color: "#667eea", fontSize: 18 }}>{s.totalScore}</div><div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>PTS</div></div>
                        <div><div style={{ fontWeight: 900, color: "#22c55e", fontSize: 18 }}>{s.correct}</div><div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>✅</div></div>
                        <div><div style={{ fontWeight: 900, color: "#ef4444", fontSize: 18 }}>{s.wrong}</div><div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>❌</div></div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentEnter({ go, setStudent }) {
  const [name, setName] = useState(""), [code, setCode] = useState(""), [err, setErr] = useState(""), [loading, setLoading] = useState(false);
  const enter = async () => {
    if (!name.trim() || !code.trim()) { setErr("Completá tu nombre y el código"); return; }
    setLoading(true); setErr("");
    const data = await db({ table: "classes", filters: `?code=eq.${code.toUpperCase().trim()}` });
    if (Array.isArray(data) && data.length > 0) { setStudent({ name: name.trim(), classCode: code.toUpperCase().trim(), className: data[0].name }); go("game"); }
    else setErr("Código no encontrado. Pedíselo a tu profe 😊");
    setLoading(false);
  };
  return (
    <div style={pg("linear-gradient(135deg,#4F8EF7,#06b6d4)")}>
      <div style={card}>
        <button onClick={() => go("home")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14, marginBottom: 20, padding: 0 }}>← Volver</button>
        <div style={{ textAlign: "center", marginBottom: 24 }}><div style={{ fontSize: 56, marginBottom: 8 }}>👩‍🎓</div><h2 style={{ fontSize: 24, fontWeight: 900, color: "#1e293b", margin: "0 0 6px" }}>¡Hola! ¿Cómo te llamás?</h2><p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Ingresá tu nombre y el código de tu clase</p></div>
        <input style={inp} placeholder="Tu nombre (ej: Sofía)" value={name} onChange={e => setName(e.target.value)} />
        <input style={{ ...inp, textTransform: "uppercase", letterSpacing: 5, fontSize: 22, fontWeight: 800, textAlign: "center" }} placeholder="CÓDIGO" maxLength={6} value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && enter()} />
        {err && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 10px" }}>{err}</p>}
        <button style={btn("linear-gradient(135deg,#4F8EF7,#06b6d4)", { padding: "15px 0", fontSize: 18 })} onClick={enter} disabled={loading}>{loading ? "Buscando clase..." : "¡Entrar a jugar! 🚀"}</button>
      </div>
    </div>
  );
}

function Game({ student, go }) {
  const [li, setLi] = useState(0), [prob, setProb] = useState(() => generateProblem(0)), [answers, setAnswers] = useState(Array(3).fill(""));
  const [feedback, setFeedback] = useState(null), [levelUp, setLevelUp] = useState(false), [finished, setFinished] = useState(false), [showHint, setShowHint] = useState(false), [saving, setSaving] = useState(false);
  const stats = useRef({ score: 0, correct: 0, wrong: 0, cil: 0, levelReached: 1 });
  const [disp, setDisp] = useState({ score: 0, correct: 0, wrong: 0 });
  const inputRefs = useRef([]);
  useEffect(() => { setTimeout(() => inputRefs.current[0]?.focus(), 200); }, []);
  const newProb = (idx) => { setProb(generateProblem(idx)); setAnswers(Array(3).fill("")); setFeedback(null); setShowHint(false); setTimeout(() => inputRefs.current[0]?.focus(), 100); };
  const onInput = (i, val) => { const d = val.replace(/\D/, "").slice(-1); const a = [...answers]; a[i] = d; setAnswers(a); if (d && i < prob.tz - 1) inputRefs.current[i + 1]?.focus(); };
  const onKey = (i, e) => { if (e.key === "Backspace" && !answers[i] && i > 0) inputRefs.current[i - 1]?.focus(); if (e.key === "Enter") check(); };
  const check = () => {
    if (feedback) return;
    const ok = answers.slice(0, prob.tz).every(a => a === "0");
    const s = stats.current;
    if (ok) { s.score += 10; s.correct++; s.cil++; setDisp({ score: s.score, correct: s.correct, wrong: s.wrong }); setFeedback("correct"); if (s.cil >= 5) { if (li < 2) { s.levelReached = li + 2; setTimeout(() => setLevelUp(true), 600); } else setTimeout(() => finish(), 600); } }
    else { s.wrong++; setDisp({ score: s.score, correct: s.correct, wrong: s.wrong }); setFeedback("wrong"); }
  };
  const finish = async () => {
    setFinished(true); setSaving(true);
    const s = stats.current;
    await db({ table: "game_results", method: "POST", body: { class_code: student.classCode, student_name: student.name, game_id: "ceros-v1", game_name: "Los Ceros Mágicos", score: s.score, correct_count: s.correct, wrong_count: s.wrong, level_reached: s.levelReached } });
    setSaving(false);
  };
  const nextLevel = () => { const next = li + 1; setLi(next); stats.current.cil = 0; setLevelUp(false); newProb(next); };
  const lvl = LEVELS[li], pct = Math.min((stats.current.cil / 5) * 100, 100);
  if (finished) return (
    <div style={pg("linear-gradient(135deg,#f97316,#ea580c)")}>
      <div style={{ ...card, textAlign: "center" }}>
        <div style={{ fontSize: 68 }}>🏆</div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: "#1e293b", margin: "10px 0 4px" }}>¡Lo lograste, {student.name}!</h2>
        <p style={{ color: "#64748b", marginBottom: 24 }}>Tu profe ya puede ver tus resultados 📊</p>
        <div style={{ background: "#fff7ed", borderRadius: 20, padding: "20px 24px", marginBottom: 24, display: "flex", justifyContent: "space-around" }}>
          <div><div style={{ fontSize: 36, fontWeight: 900, color: "#f97316" }}>{disp.score}</div><div style={{ fontSize: 12, color: "#92400e", fontWeight: 800 }}>PUNTOS</div></div>
          <div><div style={{ fontSize: 36, fontWeight: 900, color: "#22c55e" }}>{disp.correct}</div><div style={{ fontSize: 12, color: "#166534", fontWeight: 800 }}>CORRECTAS</div></div>
          <div><div style={{ fontSize: 36, fontWeight: 900, color: "#ef4444" }}>{disp.wrong}</div><div style={{ fontSize: 12, color: "#991b1b", fontWeight: 800 }}>ERRORES</div></div>
        </div>
        {saving && <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>Guardando... ⏳</p>}
        {!saving && <p style={{ color: "#22c55e", fontSize: 13, marginBottom: 12, fontWeight: 700 }}>✅ ¡Resultados guardados!</p>}
        <button style={btn("linear-gradient(135deg,#667eea,#764ba2)")} onClick={() => go("home")}>Volver al inicio</button>
      </div>
    </div>
  );
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg,${lvl.color}18,${lvl.color}35)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Nunito',sans-serif" }}>
      <style>{`@keyframes pop{0%{transform:scale(.8);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}} input::-webkit-inner-spin-button{-webkit-appearance:none}`}</style>
      <div style={{ width: "100%", maxWidth: 460, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ background: lvl.color, color: "white", borderRadius: 14, padding: "7px 16px", fontWeight: 800, fontSize: 13 }}>{lvl.emoji} {lvl.name} · {lvl.subject}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ background: "white", borderRadius: 12, padding: "6px 14px", fontWeight: 800, color: "#22c55e", fontSize: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>✅ {disp.correct}</div>
          <div style={{ background: "white", borderRadius: 12, padding: "6px 14px", fontWeight: 800, color: lvl.color, fontSize: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>⭐ {disp.score}</div>
        </div>
      </div>
      {li < 2 && <div style={{ width: "100%", maxWidth: 460, marginBottom: 12 }}><div style={{ background: "#e2e8f0", borderRadius: 99, height: 8, overflow: "hidden" }}><div style={{ height: "100%", background: lvl.color, width: `${pct}%`, borderRadius: 99, transition: "width 0.4s" }} /></div><div style={{ fontSize: 11, color: "#94a3b8", textAlign: "right", marginTop: 3 }}>{stats.current.cil}/5 para siguiente nivel</div></div>}
      <div style={{ ...card, maxWidth: 460 }}>
        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>¿Cuántos ceros le faltan?</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 28, minHeight: 70 }}>
          <span style={{ fontSize: 30, fontWeight: 900, color: "#1e293b" }}>{prob.expr} =</span>
          <span style={{ fontSize: 30, fontWeight: 900, color: "#1e293b" }}>{prob.nonZero}</span>
          {Array.from({ length: prob.tz }).map((_, i) => {
            const filled = answers[i] === "0", bc = feedback === "correct" ? "#22c55e" : feedback === "wrong" ? "#ef4444" : filled ? lvl.color : "#cbd5e1";
            const bg = feedback === "correct" ? "#f0fdf4" : feedback === "wrong" ? "#fef2f2" : filled ? lvl.color + "15" : "#f8fafc";
            const co = feedback === "correct" ? "#16a34a" : feedback === "wrong" ? "#dc2626" : lvl.color;
            return <input key={`${prob.expr}-${i}`} ref={el => inputRefs.current[i] = el} type="text" inputMode="numeric" maxLength={1} value={answers[i]} onChange={e => onInput(i, e.target.value)} onKeyDown={e => onKey(i, e)} disabled={!!feedback} style={{ width: 48, height: 56, textAlign: "center", fontSize: 28, fontWeight: 900, border: "none", borderBottom: `4px solid ${bc}`, borderRadius: 12, background: bg, color: co, outline: "none", caretColor: lvl.color, transition: "all 0.2s" }} />;
          })}
        </div>
        {showHint && !feedback && <div style={{ background: "#fffbeb", border: "2px solid #fde68a", borderRadius: 14, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#92400e", textAlign: "center" }}>💡 El resultado es <strong>{prob.resultStr}</strong> — tiene <strong>{prob.tz} cero{prob.tz > 1 ? "s" : ""}</strong> al final.</div>}
        {feedback && !levelUp && <div style={{ background: feedback === "correct" ? "#f0fdf4" : "#fef2f2", borderRadius: 18, padding: "14px 18px", marginBottom: 16, textAlign: "center", animation: "pop 0.3s ease" }}><p style={{ fontWeight: 800, fontSize: 18, color: feedback === "correct" ? "#16a34a" : "#dc2626", margin: 0 }}>{feedback === "correct" ? "🎉 ¡Genial!" : "💪 ¡Casi! Pensá en los ceros"}</p><p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>{prob.expr} = <strong>{prob.resultStr}</strong></p></div>}
        {levelUp && <div style={{ background: "linear-gradient(135deg,#fbbf24,#f97316)", borderRadius: 18, padding: "18px 22px", marginBottom: 16, textAlign: "center", animation: "pop 0.4s ease" }}><p style={{ color: "white", fontWeight: 900, fontSize: 20, margin: "0 0 4px" }}>🏆 ¡Subiste de nivel!</p><p style={{ color: "rgba(255,255,255,.85)", fontSize: 13, margin: 0 }}>{LEVELS[li + 1].emoji} {LEVELS[li + 1].name} — {LEVELS[li + 1].subject}</p></div>}
        <div style={{ display: "flex", gap: 10 }}>
          {!feedback && <><button onClick={() => setShowHint(h => !h)} style={{ flex: 1, padding: "13px 0", borderRadius: 18, border: "2px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>💡 Pista</button><button onClick={check} disabled={answers.slice(0, prob.tz).some(a => !a)} style={{ flex: 2, padding: "14px 0", borderRadius: 18, border: "none", background: answers.slice(0, prob.tz).every(a => a) ? lvl.color : "#e2e8f0", color: answers.slice(0, prob.tz).every(a => a) ? "white" : "#94a3b8", fontWeight: 900, fontSize: 17, fontFamily: "inherit", transition: "all 0.2s", cursor: answers.slice(0, prob.tz).every(a => a) ? "pointer" : "not-allowed" }}>✓ Comprobar</button></>}
          {feedback && !levelUp && <button style={btn("#22c55e", { marginTop: 0, flex: 1 })} onClick={() => newProb(li)}>Siguiente →</button>}
          {levelUp && <button style={btn("linear-gradient(135deg,#fbbf24,#f97316)", { marginTop: 0, flex: 1 })} onClick={nextLevel}>¡Ir al Nivel {li + 2}! 🚀</button>}
        </div>
      </div>
      <p style={{ color: "#64748b", fontSize: 12, marginTop: 14 }}>Jugando como: <strong>{student.name}</strong> · Clase: <strong>{student.classCode}</strong></p>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home"), [teacher, setTeacher] = useState(null), [student, setStudent] = useState(null);
  return (
    <>
      {screen === "home" && <Home go={setScreen} />}
      {screen === "teacher-login" && <TeacherLogin go={setScreen} setTeacher={setTeacher} />}
      {screen === "teacher-dashboard" && <TeacherDashboard go={setScreen} />}
      {screen === "student-enter" && <StudentEnter go={setScreen} setStudent={setStudent} />}
      {screen === "game" && student && <Game student={student} go={setScreen} />}
    </>
  );
}
