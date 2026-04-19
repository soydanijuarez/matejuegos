import { useState, useRef, useEffect } from "react";

const SUPABASE_URL = "https://ckzcgtwdyuqdtaziqsfb.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNremNndHdkeXVxZHRhemlxc2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NTEyMjQsImV4cCI6MjA5MjEyNzIyNH0.d6uDSRhVOBl2BriIUTE43vA042mYPSRqCL95AqtIn6U";
const TEACHER_CODE = "DANI2025";
const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

async function db({ table, method = "GET", body, filters = "" }) {
  try {
    const headers = { "Content-Type": "application/json", "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` };
    if (method === "POST") headers["Prefer"] = "return=representation";
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${filters}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    return await res.json();
  } catch { return null; }
}

// ─── MESSAGES ──────────────────────────────────────────────────────────────
const MSG_WRONG = [
  "Mmm… probemos pensarlo de otra forma, ¿dale?",
  "¡No pasa! ¿Qué parte te parece más fácil de resolver primero?",
  "¿Podés separar el número para hacerlo más simple?",
  "¿Hay algo que ya sepas que te pueda ayudar acá?",
  "Volvé un pasito atrás… ¿qué sí sabés hacer?",
  "¿Qué pasaría si este número fuera más chico?",
  "Intentá con una parte y después seguimos 👇",
  "¿Te animás a explicarme qué pensaste?",
  "Casi casi… revisá ese detalle 👀",
  "Pensalo como si se lo explicaras a alguien más",
];

const MSG_CORRECT = [
  "¡Bien ahí! 🔥",
  "¡Excelente! ¿Contame cómo lo pensaste?",
  "¡Muy bien! ¿Siempre funcionará así?",
  "¡Genial! ¿Podrías hacerlo con otro número?",
  "¡Perfecto! ¿Hay otra forma de resolverlo?",
  "¡Crack! 😎 ¿Te animás a explicarlo?",
  "¡Muy bien! ¿Qué parte te resultó más fácil?",
  "¡Buenísimo! ¿Cómo lo harías más rápido?",
  "¡Excelente! Probemos uno un poquito más difícil…",
  "¡La rompiste! 💥 ¿Qué aprendiste acá?",
];

// Solo aparecen en ejercicio 5 y 10 del nivel
const MSG_REFLECT = [
  "¿Cómo llegaste a ese resultado?",
  "¿Hay otra manera de hacerlo?",
  "¿Esto siempre va a dar bien o depende del número?",
  "¿Cómo se lo explicarías a un compañero?",
  "¿Qué te hizo darte cuenta de la respuesta?",
];

// ─── LEVELS ────────────────────────────────────────────────────────────────
const LEVELS = [
  { id:0, name:"Nivel 1", emoji:"🌱", subject:"Multiplicación", color:"#4F8EF7" },
  { id:1, name:"Nivel 2", emoji:"🌿", subject:"División",       color:"#A855F7" },
  { id:2, name:"Nivel 3", emoji:"🌟", subject:"¿Qué operación?",color:"#F97316" },
  { id:3, name:"Nivel 4", emoji:"🏆", subject:"Mixto total",    color:"#EF4444" },
];

function generateProblem(li) {
  if (li === 0) {
    const z = Math.floor(Math.random()*2)+1, pow = Math.pow(10,z);
    const a = (Math.floor(Math.random()*9)+1)*pow, b = Math.floor(Math.random()*9)+1;
    const base = a/pow;
    return {
      expr:`${a} × ${b}`, answer:String(a*b), isOp:false,
      guides:[
        `¿Cuánto es ${base} × ${b} (sin los ceros)?`,
        `¿Cuántos ceros tiene el ${a}?`,
        `Entonces si ${base}×${b}=${base*b} y el ${a} tiene ${z} cero${z>1?"s":""}... ¿qué pasa?`,
      ]
    };
  }
  if (li === 1) {
    const z = Math.floor(Math.random()*2)+1, pow = Math.pow(10,z);
    const q = Math.floor(Math.random()*9)+1, d = Math.floor(Math.random()*9)+1;
    const dividend = q*d*pow;
    return {
      expr:`${dividend} ÷ ${d}`, answer:String(q*pow), isOp:false,
      guides:[
        `¿Cuánto es ${q*d} ÷ ${d} (sin los ceros)?`,
        `¿Cuántos ceros tiene el ${dividend}?`,
        `Entonces si ${q*d}÷${d}=${q} y el ${dividend} tiene ${z} cero${z>1?"s":""}... ¿qué creés que pasa?`,
      ]
    };
  }
  if (li === 2) {
    const z = Math.floor(Math.random()*2)+1, pow = Math.pow(10,z);
    const a = (Math.floor(Math.random()*9)+1)*pow;
    const divisors = [2,3,4,5,6,8,10].filter(d=>(a/d)===Math.floor(a/d)&&(a/d)>=1);
    if (!divisors.length) return generateProblem(2);
    const b = pick(divisors), result = a/b;
    return {
      expr:`${a}  ◻  ${b} = ${result}`, answer:"÷", isOp:true,
      guides:[
        `Si el resultado (${result}) es más chico que ${a}, ¿qué operación achica números?`,
        `¿Cuántas veces entra ${b} en ${a}?`,
        `Probá: ¿${b} × ${result} = ${a}?`,
      ]
    };
  }
  return generateProblem(Math.random()>0.5?0:1);
}

// ─── STYLES ────────────────────────────────────────────────────────────────
const card = { background:"white", borderRadius:28, padding:"36px 30px", maxWidth:480, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.15)" };
const inp  = { width:"100%", padding:"13px 16px", borderRadius:14, border:"2px solid #e2e8f0", fontSize:16, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:12 };
const btn  = (bg, ex={}) => ({ padding:"13px 20px", borderRadius:16, border:"none", background:bg, color:"white", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit", ...ex });
const pg   = (bg="linear-gradient(135deg,#667eea,#764ba2)") => ({ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:bg, padding:20, fontFamily:"'Nunito',sans-serif" });

// ─── HOME ──────────────────────────────────────────────────────────────────
function Home({ go }) {
  return (
    <div style={pg()}>
      <div style={{ ...card, textAlign:"center" }}>
        <div style={{ fontSize:60, marginBottom:8 }}>🎓</div>
        <h1 style={{ fontSize:30, fontWeight:900, color:"#1e293b", margin:"0 0 6px" }}>MateJuegos</h1>
        <p style={{ color:"#64748b", fontSize:14, marginBottom:32 }}>La plataforma de Dani para aprender matemática jugando</p>
        <button onClick={()=>go("teacher-login")} style={{ ...btn("linear-gradient(135deg,#667eea,#764ba2)"), width:"100%", padding:"16px", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:14 }}>👩‍🏫 Soy docente</button>
        <button onClick={()=>go("student-enter")} style={{ ...btn("linear-gradient(135deg,#4F8EF7,#06b6d4)"), width:"100%", padding:"16px", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>👩‍🎓 Soy alumna/o</button>
      </div>
    </div>
  );
}

// ─── TEACHER LOGIN ─────────────────────────────────────────────────────────
function TeacherLogin({ go, setTeacher }) {
  const [code,setCode]=useState(""), [err,setErr]=useState("");
  const login = () => { if(code.trim().toUpperCase()===TEACHER_CODE){setTeacher({name:"Dani"});go("teacher-dashboard");}else setErr("Código incorrecto."); };
  return (
    <div style={pg()}>
      <div style={card}>
        <button onClick={()=>go("home")} style={{ background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:14,marginBottom:20,padding:0 }}>← Volver</button>
        <div style={{ fontSize:40,textAlign:"center",marginBottom:8 }}>👩‍🏫</div>
        <h2 style={{ fontSize:24,fontWeight:900,color:"#1e293b",textAlign:"center",marginBottom:4 }}>Panel Docente</h2>
        <p style={{ color:"#64748b",fontSize:13,textAlign:"center",marginBottom:24 }}>Ingresá tu código de acceso</p>
        <input style={{ ...inp,textAlign:"center",fontSize:22,fontWeight:800,letterSpacing:4 }} placeholder="••••••••" value={code} maxLength={12} type="password" onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&login()} />
        {err&&<p style={{ color:"#ef4444",fontSize:13,margin:"0 0 10px" }}>{err}</p>}
        <button style={{ ...btn("linear-gradient(135deg,#667eea,#764ba2)"),width:"100%" }} onClick={login}>Ingresar 🔑</button>
      </div>
    </div>
  );
}

// ─── TEACHER DASHBOARD ─────────────────────────────────────────────────────
function TeacherDashboard({ go }) {
  const [classes,setClasses]=useState([]), [selected,setSelected]=useState(null);
  const [results,setResults]=useState([]), [reflections,setRef]=useState([]);
  const [newName,setNewName]=useState(""), [loading,setLoading]=useState(true);
  const [creating,setCreating]=useState(false), [loadingRes,setLoadingRes]=useState(false);
  const [tab,setTab]=useState("results");

  useEffect(()=>{loadClasses();},[]);

  const loadClasses = async () => {
    setLoading(true);
    const data = await db({table:"classes",filters:"?order=created_at.desc"});
    if(Array.isArray(data)) setClasses(data);
    setLoading(false);
  };

  const selectClass = async (cls) => {
    setSelected(cls); setLoadingRes(true); setTab("results");
    const [res,refs] = await Promise.all([
      db({table:"game_results",filters:`?class_code=eq.${cls.code}&order=played_at.desc`}),
      db({table:"reflections",filters:`?class_code=eq.${cls.code}&order=created_at.desc`}),
    ]);
    if(Array.isArray(res)) setResults(res);
    if(Array.isArray(refs)) setRef(refs);
    setLoadingRes(false);
  };

  const createClass = async () => {
    if(!newName.trim()) return; setCreating(true);
    await db({table:"classes",method:"POST",body:{teacher_email:"dani",name:newName.trim(),code:genCode()}});
    setNewName(""); await loadClasses(); setCreating(false);
  };

  const stats = results.reduce((acc,r)=>{
    if(!acc[r.student_name]) acc[r.student_name]={plays:0,score:0,correct:0,wrong:0};
    const s=acc[r.student_name]; s.plays++; s.score+=r.score; s.correct+=r.correct_count; s.wrong+=r.wrong_count;
    return acc;
  },{});

  return (
    <div style={{ minHeight:"100vh",background:"#f1f5f9",fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ background:"linear-gradient(135deg,#667eea,#764ba2)",padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div><div style={{ color:"rgba(255,255,255,0.65)",fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:1 }}>Panel Docente</div><div style={{ color:"white",fontSize:22,fontWeight:900 }}>🎓 MateJuegos</div></div>
        <button onClick={()=>go("home")} style={{ background:"rgba(255,255,255,0.18)",border:"none",color:"white",borderRadius:12,padding:"8px 18px",cursor:"pointer",fontFamily:"inherit",fontWeight:700 }}>Salir</button>
      </div>
      <div style={{ maxWidth:900,margin:"0 auto",padding:"24px 16px",display:"grid",gridTemplateColumns:"280px 1fr",gap:18,alignItems:"start" }}>
        <div>
          <div style={{ background:"white",borderRadius:20,padding:22,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin:"0 0 14px",color:"#1e293b",fontWeight:900,fontSize:16 }}>➕ Nueva clase</h3>
            <input style={{ ...inp,marginBottom:10 }} placeholder="Nombre (ej: 4to grado)" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createClass()} />
            <button onClick={createClass} disabled={creating||!newName.trim()} style={{ ...btn("linear-gradient(135deg,#667eea,#764ba2)"),width:"100%" }}>{creating?"Creando...":"Crear clase"}</button>
          </div>
          <div style={{ background:"white",borderRadius:20,padding:22,boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin:"0 0 14px",color:"#1e293b",fontWeight:900,fontSize:16 }}>📚 Mis clases</h3>
            {loading&&<p style={{ color:"#94a3b8",fontSize:14 }}>Cargando...</p>}
            {!loading&&classes.length===0&&<p style={{ color:"#94a3b8",fontSize:14 }}>Todavía no creaste ninguna.</p>}
            {classes.map(cls=>(
              <div key={cls.id} onClick={()=>selectClass(cls)} style={{ border:`2px solid ${selected?.id===cls.id?"#667eea":"#f1f5f9"}`,borderRadius:16,padding:"14px 16px",marginBottom:10,cursor:"pointer",background:selected?.id===cls.id?"#f5f3ff":"#fafafa",transition:"all 0.2s" }}>
                <div style={{ fontWeight:800,color:"#1e293b",fontSize:15,marginBottom:4 }}>{cls.name}</div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span style={{ color:"#94a3b8",fontSize:11 }}>{new Date(cls.created_at).toLocaleDateString("es-AR")}</span>
                  <span style={{ background:"#667eea22",color:"#667eea",borderRadius:10,padding:"3px 10px",fontWeight:900,fontSize:14,letterSpacing:2 }}>{cls.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          {!selected&&<div style={{ background:"white",borderRadius:20,padding:40,textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}><div style={{ fontSize:48,marginBottom:12 }}>👈</div><p style={{ color:"#94a3b8",fontWeight:700 }}>Seleccioná una clase para ver los resultados</p></div>}
          {selected&&(
            <div style={{ background:"white",borderRadius:20,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}>
                <div><h3 style={{ margin:"0 0 4px",color:"#1e293b",fontWeight:900 }}>📊 {selected.name}</h3><p style={{ margin:0,color:"#94a3b8",fontSize:12 }}>Código: <strong style={{ color:"#667eea",letterSpacing:1 }}>{selected.code}</strong></p></div>
                <button onClick={()=>selectClass(selected)} style={{ ...btn("#f1f5f9"),color:"#64748b",fontSize:13 }}>🔄 Actualizar</button>
              </div>
              <div style={{ display:"flex",gap:8,marginBottom:20 }}>
                {["results","reflections"].map(t=>(
                  <button key={t} onClick={()=>setTab(t)} style={{ ...btn(tab===t?"#667eea":"#f1f5f9"),color:tab===t?"white":"#64748b",flex:1,padding:"10px",position:"relative" }}>
                    {t==="results"?"📈 Resultados":"💭 Reflexiones"}{t==="reflections"&&reflections.length>0&&<span style={{ background:"#ef4444",color:"white",borderRadius:99,padding:"2px 7px",fontSize:11,marginLeft:6 }}>{reflections.length}</span>}
                  </button>
                ))}
              </div>
              {loadingRes&&<p style={{ color:"#94a3b8" }}>Cargando...</p>}
              {!loadingRes&&tab==="results"&&(
                <>
                  {results.length===0&&<div style={{ textAlign:"center",padding:"30px 0" }}><div style={{ fontSize:40 }}>🎮</div><p style={{ color:"#94a3b8",marginTop:8 }}>Nadie jugó todavía. Código: <strong style={{ color:"#667eea" }}>{selected.code}</strong></p></div>}
                  {Object.entries(stats).map(([name,s])=>(
                    <div key={name} style={{ background:"#f8fafc",borderRadius:14,padding:"12px 16px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <div><div style={{ fontWeight:800,color:"#1e293b" }}>{name}</div><div style={{ fontSize:12,color:"#94a3b8",marginTop:2 }}>{s.plays} partida{s.plays!==1?"s":""}</div></div>
                      <div style={{ display:"flex",gap:10,textAlign:"center" }}>
                        <div><div style={{ fontWeight:900,color:"#667eea",fontSize:18 }}>{s.score}</div><div style={{ fontSize:10,color:"#94a3b8",fontWeight:700 }}>PTS</div></div>
                        <div><div style={{ fontWeight:900,color:"#22c55e",fontSize:18 }}>{s.correct}</div><div style={{ fontSize:10,color:"#94a3b8",fontWeight:700 }}>✅</div></div>
                        <div><div style={{ fontWeight:900,color:"#ef4444",fontSize:18 }}>{s.wrong}</div><div style={{ fontSize:10,color:"#94a3b8",fontWeight:700 }}>❌</div></div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {!loadingRes&&tab==="reflections"&&(
                <>
                  {reflections.length===0&&<div style={{ textAlign:"center",padding:"30px 0" }}><div style={{ fontSize:40 }}>💭</div><p style={{ color:"#94a3b8",marginTop:8 }}>Todavía no hay reflexiones guardadas.</p></div>}
                  {reflections.map((r,i)=>(
                    <div key={i} style={{ background:"#f5f3ff",borderRadius:14,padding:"16px",marginBottom:12,borderLeft:"4px solid #667eea" }}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                        <strong style={{ color:"#1e293b",fontSize:14 }}>{r.student_name}</strong>
                        <span style={{ color:"#94a3b8",fontSize:11 }}>{new Date(r.created_at).toLocaleDateString("es-AR")} {new Date(r.created_at).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}</span>
                      </div>
                      <p style={{ color:"#64748b",fontSize:13,margin:"0 0 6px",fontStyle:"italic" }}>"{r.question}"</p>
                      <p style={{ color:"#1e293b",fontSize:14,margin:0,fontWeight:700 }}>{r.answer}</p>
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

// ─── STUDENT ENTER ─────────────────────────────────────────────────────────
function StudentEnter({ go, setStudent }) {
  const [name,setName]=useState(""), [code,setCode]=useState(""), [err,setErr]=useState(""), [loading,setLoading]=useState(false);
  const enter = async () => {
    if(!name.trim()||!code.trim()){setErr("Completá tu nombre y el código");return;}
    setLoading(true); setErr("");
    const data = await db({table:"classes",filters:`?code=eq.${code.toUpperCase().trim()}`});
    if(Array.isArray(data)&&data.length>0){setStudent({name:name.trim(),classCode:code.toUpperCase().trim(),className:data[0].name});go("game");}
    else setErr("Código no encontrado. Pedíselo a tu profe 😊");
    setLoading(false);
  };
  return (
    <div style={pg("linear-gradient(135deg,#4F8EF7,#06b6d4)")}>
      <div style={card}>
        <button onClick={()=>go("home")} style={{ background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:14,marginBottom:20,padding:0 }}>← Volver</button>
        <div style={{ textAlign:"center",marginBottom:24 }}><div style={{ fontSize:56,marginBottom:8 }}>👩‍🎓</div><h2 style={{ fontSize:24,fontWeight:900,color:"#1e293b",margin:"0 0 6px" }}>¡Hola! ¿Cómo te llamás?</h2><p style={{ color:"#64748b",fontSize:14,margin:0 }}>Ingresá tu nombre y el código de tu clase</p></div>
        <input style={inp} placeholder="Tu nombre (ej: Sofía)" value={name} onChange={e=>setName(e.target.value)} />
        <input style={{ ...inp,textTransform:"uppercase",letterSpacing:5,fontSize:22,fontWeight:800,textAlign:"center" }} placeholder="CÓDIGO" maxLength={6} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&enter()} />
        {err&&<p style={{ color:"#ef4444",fontSize:13,margin:"0 0 10px" }}>{err}</p>}
        <button style={{ ...btn("linear-gradient(135deg,#4F8EF7,#06b6d4)"),width:"100%",padding:"15px",fontSize:18 }} onClick={enter} disabled={loading}>{loading?"Buscando clase...":"¡Entrar a jugar! 🚀"}</button>
      </div>
    </div>
  );
}

// ─── GAME ──────────────────────────────────────────────────────────────────
function Game({ student, go }) {
  const [li,setLi]               = useState(0);
  const [prob,setProb]           = useState(()=>generateProblem(0));
  const [answer,setAnswer]       = useState("");
  const [phase,setPhase]         = useState("question");
  const [guideStep,setGuideStep] = useState(0);
  const [guideAns,setGuideAns]   = useState("");
  const [wrongMsg,setWrongMsg]   = useState("");
  const [correctMsg,setCorrectMsg] = useState("");
  const [reflectQ,setReflectQ]   = useState("");
  const [showReflect,setShowReflect] = useState(false);
  const [reflectAns,setReflectAns] = useState("");
  const [reflectSaved,setReflectSaved] = useState(false);
  const [score,setScore]         = useState(0);
  const [correct,setCorrect]     = useState(0);
  const [wrong,setWrong]         = useState(0);
  // totalCorrect tracks across all levels for reflection trigger
  const totalCorrect             = useRef(0);
  const [cil,setCil]             = useState(0);
  const [finished,setFinished]   = useState(false);
  const [saving,setSaving]       = useState(false);
  const inputRef                 = useRef(null);

  useEffect(()=>{setTimeout(()=>inputRef.current?.focus(),200);},[phase,prob]);

  const newProb = (lIdx) => {
    setProb(generateProblem(lIdx));
    setAnswer(""); setPhase("question");
    setGuideStep(0); setGuideAns("");
    setReflectAns(""); setReflectSaved(false); setShowReflect(false);
  };

  const checkAnswer = (val) => {
    const a = (val||answer).trim();
    if(!a) return;
    if(a===prob.answer){
      totalCorrect.current += 1;
      const tc = totalCorrect.current;
      // Show reflection only at exercise 5 and 10 of each level
      const shouldReflect = tc%5===0;
      setCorrectMsg(pick(MSG_CORRECT));
      setScore(s=>s+10); setCorrect(c=>c+1);
      if(shouldReflect){ setReflectQ(pick(MSG_REFLECT)); setShowReflect(true); }
      setCil(c=>{
        const n=c+1;
        if(n>=5){
          if(li<3) setTimeout(()=>{setLi(l=>l+1);setCil(0);newProb(li+1);},shouldReflect?0:1800);
          else setTimeout(finish,shouldReflect?0:1800);
        }
        return n;
      });
      setPhase("correct");
    } else {
      setWrongMsg(pick(MSG_WRONG));
      setWrong(c=>c+1);
      setPhase("wrong");
    }
  };

  const saveReflection = async () => {
    if(!reflectAns.trim()) return;
    await db({table:"reflections",method:"POST",body:{class_code:student.classCode,student_name:student.name,question:reflectQ,answer:reflectAns}});
    setReflectSaved(true);
  };

  const handleContinue = () => {
    if(cil>=5){
      if(li<3){setLi(l=>l+1);setCil(0);newProb(li+1);}
      else finish();
    } else { newProb(li); }
  };

  const finish = async () => {
    setFinished(true); setSaving(true);
    await db({table:"game_results",method:"POST",body:{class_code:student.classCode,student_name:student.name,game_id:"ceros-v2",game_name:"Los Ceros Mágicos",score,correct_count:correct,wrong_count:wrong,level_reached:li+1}});
    setSaving(false);
  };

  const lvl = LEVELS[Math.min(li,3)];
  const pct = Math.min((cil/5)*100,100);

  if(finished) return (
    <div style={pg("linear-gradient(135deg,#f97316,#ea580c)")}>
      <div style={{ ...card,textAlign:"center" }}>
        <div style={{ fontSize:68 }}>🏆</div>
        <h2 style={{ fontSize:26,fontWeight:900,color:"#1e293b",margin:"10px 0 4px" }}>¡Lo lograste, {student.name}!</h2>
        <p style={{ color:"#64748b",marginBottom:24 }}>Tu profe ya puede ver tus resultados 📊</p>
        <div style={{ background:"#fff7ed",borderRadius:20,padding:"20px 24px",marginBottom:24,display:"flex",justifyContent:"space-around" }}>
          <div><div style={{ fontSize:36,fontWeight:900,color:"#f97316" }}>{score}</div><div style={{ fontSize:12,color:"#92400e",fontWeight:800 }}>PUNTOS</div></div>
          <div><div style={{ fontSize:36,fontWeight:900,color:"#22c55e" }}>{correct}</div><div style={{ fontSize:12,color:"#166534",fontWeight:800 }}>CORRECTAS</div></div>
          <div><div style={{ fontSize:36,fontWeight:900,color:"#ef4444" }}>{wrong}</div><div style={{ fontSize:12,color:"#991b1b",fontWeight:800 }}>ERRORES</div></div>
        </div>
        {saving?<p style={{ color:"#94a3b8",fontSize:13,marginBottom:12 }}>Guardando... ⏳</p>:<p style={{ color:"#22c55e",fontSize:13,marginBottom:12,fontWeight:700 }}>✅ ¡Resultados guardados!</p>}
        <button style={{ ...btn("linear-gradient(135deg,#667eea,#764ba2)"),width:"100%" }} onClick={()=>go("home")}>Volver al inicio</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:`linear-gradient(135deg,${lvl.color}15,${lvl.color}30)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Nunito',sans-serif",transition:"background 0.6s" }}>
      <style>{`@keyframes pop{0%{transform:scale(.85);opacity:0}70%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}`}</style>

      {/* Header */}
      <div style={{ width:"100%",maxWidth:480,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
        <div style={{ background:lvl.color,color:"white",borderRadius:14,padding:"7px 16px",fontWeight:800,fontSize:13 }}>{lvl.emoji} {lvl.name} · {lvl.subject}</div>
        <div style={{ display:"flex",gap:8 }}>
          <div style={{ background:"white",borderRadius:12,padding:"6px 14px",fontWeight:800,color:"#22c55e",fontSize:13,boxShadow:"0 2px 8px rgba(0,0,0,0.07)" }}>✅ {correct}</div>
          <div style={{ background:"white",borderRadius:12,padding:"6px 14px",fontWeight:800,color:lvl.color,fontSize:13,boxShadow:"0 2px 8px rgba(0,0,0,0.07)" }}>⭐ {score}</div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ width:"100%",maxWidth:480,marginBottom:12 }}>
        <div style={{ background:"#e2e8f0",borderRadius:99,height:7,overflow:"hidden" }}>
          <div style={{ height:"100%",background:lvl.color,width:`${pct}%`,borderRadius:99,transition:"width 0.4s" }}/>
        </div>
        <div style={{ fontSize:11,color:"#94a3b8",textAlign:"right",marginTop:3 }}>{cil}/5 para siguiente nivel</div>
      </div>

      <div style={{ ...card,maxWidth:480 }}>

        {/* ── QUESTION ── */}
        {phase==="question"&&(
          <>
            <p style={{ textAlign:"center",color:"#94a3b8",fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:16 }}>
              {prob.isOp?"¿Qué operación va en el medio?":"¿Cuánto es?"}
            </p>
            <div style={{ textAlign:"center",marginBottom:24 }}>
              <span style={{ fontSize:32,fontWeight:900,color:"#1e293b" }}>{prob.expr}{!prob.isOp&&" = "}</span>
              {!prob.isOp&&<span style={{ fontSize:32,fontWeight:900,color:lvl.color,borderBottom:`3px solid ${lvl.color}`,paddingBottom:2,minWidth:90,display:"inline-block",textAlign:"center" }}>{answer||"　　　　"}</span>}
            </div>
            {prob.isOp
              ?<div style={{ display:"flex",gap:12,marginBottom:8 }}>
                {["×","÷"].map(op=>(
                  <button key={op} onClick={()=>checkAnswer(op)} style={{ ...btn("#f1f5f9"),flex:1,fontSize:30,color:"#1e293b",padding:"18px" }}>{op}</button>
                ))}
              </div>
              :<>
                <input ref={inputRef} type="text" inputMode="numeric" placeholder="Escribí el resultado completo" value={answer} onChange={e=>setAnswer(e.target.value.replace(/\D/,""))} onKeyDown={e=>e.key==="Enter"&&checkAnswer()} style={{ ...inp,fontSize:20,fontWeight:800,textAlign:"center",letterSpacing:2 }} />
                <button onClick={()=>checkAnswer()} disabled={!answer} style={{ ...btn(answer?lvl.color:"#e2e8f0"),width:"100%",color:answer?"white":"#94a3b8",cursor:answer?"pointer":"not-allowed" }}>✓ Comprobar</button>
              </>
            }
          </>
        )}

        {/* ── WRONG ── */}
        {phase==="wrong"&&(
          <div style={{ animation:"pop 0.3s ease" }}>
            <div style={{ textAlign:"center",marginBottom:8 }}>
              <div style={{ fontSize:44,marginBottom:8 }}>🤔</div>
              <p style={{ fontSize:19,fontWeight:900,color:"#f97316",margin:"0 0 6px",lineHeight:1.4 }}>{wrongMsg}</p>
            </div>
            <div style={{ display:"flex",gap:10,marginTop:20 }}>
              <button onClick={()=>{setPhase("guide");setGuideStep(0);setGuideAns("");}} style={{ ...btn("linear-gradient(135deg,#667eea,#764ba2)"),flex:1 }}>Quiero una guía 💡</button>
              <button onClick={()=>{setAnswer("");setPhase("question");}} style={{ ...btn("#f1f5f9"),flex:1,color:"#475569" }}>Lo intento nuevamente 🔄</button>
            </div>
          </div>
        )}

        {/* ── GUIDE ── */}
        {phase==="guide"&&(
          <div style={{ animation:"pop 0.3s ease" }}>
            <p style={{ textAlign:"center",color:"#94a3b8",fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:14 }}>Guía · paso {guideStep+1} de {prob.guides.length}</p>
            <div style={{ background:"#f5f3ff",borderRadius:16,padding:"16px 20px",marginBottom:18,borderLeft:"4px solid #667eea" }}>
              <p style={{ fontSize:17,fontWeight:700,color:"#1e293b",margin:0 }}>{prob.guides[guideStep]}</p>
            </div>
            <input ref={inputRef} type="text" placeholder="Tu respuesta..." value={guideAns} onChange={e=>setGuideAns(e.target.value)} style={{ ...inp,fontSize:16,fontWeight:700,textAlign:"center" }}
              onKeyDown={e=>{if(e.key==="Enter"&&guideAns.trim()){if(guideStep<prob.guides.length-1){setGuideStep(g=>g+1);setGuideAns("");}else{setPhase("question");setAnswer("");}}}} />
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>{setAnswer("");setPhase("question");}} style={{ ...btn("#f1f5f9"),color:"#475569",flex:1,fontSize:13 }}>Salir de la guía</button>
              <button onClick={()=>{
                if(!guideAns.trim()) return;
                if(guideStep<prob.guides.length-1){setGuideStep(g=>g+1);setGuideAns("");}
                else{setPhase("question");setAnswer("");}
              }} style={{ ...btn("linear-gradient(135deg,#667eea,#764ba2)"),flex:2 }}>
                {guideStep<prob.guides.length-1?"Siguiente →":"¡Entonces… a intentarlo! 🚀"}
              </button>
            </div>
          </div>
        )}

        {/* ── CORRECT ── */}
        {phase==="correct"&&(
          <div style={{ animation:"pop 0.3s ease" }}>
            <div style={{ textAlign:"center",marginBottom:20 }}>
              <div style={{ fontSize:48,marginBottom:8 }}>🎉</div>
              <p style={{ fontSize:20,fontWeight:900,color:"#16a34a",margin:0,lineHeight:1.4 }}>{correctMsg}</p>
              <p style={{ fontSize:13,color:"#64748b",marginTop:6 }}>{prob.expr} {!prob.isOp&&`= ${prob.answer}`}</p>
            </div>

            {/* Reflection — only at exercises 5 and 10 */}
            {showReflect&&(
              <div style={{ background:"#f0fdf4",borderRadius:16,padding:"16px 20px",marginBottom:20,border:"1px solid #bbf7d0" }}>
                <p style={{ fontSize:15,fontWeight:700,color:"#15803d",margin:"0 0 12px" }}>🧠 {reflectQ}</p>
                {!reflectSaved
                  ?<>
                    <textarea placeholder="Escribí tu respuesta... (optativo)" value={reflectAns} onChange={e=>setReflectAns(e.target.value)}
                      style={{ width:"100%",padding:"10px 12px",borderRadius:12,border:"2px solid #86efac",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",resize:"none",minHeight:65,marginBottom:10 }}/>
                    <div style={{ display:"flex",gap:8 }}>
                      {reflectAns.trim()&&<button onClick={saveReflection} style={{ ...btn("#16a34a"),flex:1,fontSize:14,padding:"10px" }}>Guardar ✓</button>}
                      <button onClick={handleContinue} style={{ ...btn("#f1f5f9"),flex:1,color:"#475569",fontSize:14,padding:"10px" }}>Seguir con el juego →</button>
                    </div>
                  </>
                  :<>
                    <div style={{ background:"#dcfce7",borderRadius:12,padding:"12px 16px",textAlign:"center",marginBottom:12 }}>
                      <p style={{ color:"#15803d",fontWeight:800,margin:"0 0 4px",fontSize:14 }}>✨ ¡Guardado!</p>
                      <p style={{ color:"#16a34a",fontSize:12,margin:0 }}>Tu profe lo va a ver después — ¡seguimos jugando!</p>
                    </div>
                    <button onClick={handleContinue} style={{ ...btn(`linear-gradient(135deg,${lvl.color},${lvl.color}bb)`),width:"100%",fontSize:16 }}>Seguir con el juego →</button>
                  </>
                }
              </div>
            )}

            {/* No reflection — just continue */}
            {!showReflect&&(
              <button onClick={handleContinue} style={{ ...btn(`linear-gradient(135deg,${lvl.color},${lvl.color}bb)`),width:"100%",fontSize:17 }}>
                {cil>=5&&li<3?`¡Ir al ${LEVELS[li+1]?.name}! 🚀`:cil>=5&&li>=3?"¡Terminar! 🏆":"Seguir →"}
              </button>
            )}
          </div>
        )}
      </div>

      <p style={{ color:"#64748b",fontSize:12,marginTop:14 }}>Jugando como: <strong>{student.name}</strong> · Clase: <strong>{student.classCode}</strong></p>
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen]=useState("home"), [teacher,setTeacher]=useState(null), [student,setStudent]=useState(null);
  return (
    <>
      {screen==="home"&&<Home go={setScreen}/>}
      {screen==="teacher-login"&&<TeacherLogin go={setScreen} setTeacher={setTeacher}/>}
      {screen==="teacher-dashboard"&&<TeacherDashboard go={setScreen}/>}
      {screen==="student-enter"&&<StudentEnter go={setScreen} setStudent={setStudent}/>}
      {screen==="game"&&student&&<Game student={student} go={setScreen}/>}
    </>
  );
}
