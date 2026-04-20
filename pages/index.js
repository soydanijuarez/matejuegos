import { useState, useRef, useEffect } from "react";

const SUPABASE_URL = "https://ckzcgtwdyuqdtaziqsfb.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNremNndHdkeXVxZHRhemlxc2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NTEyMjQsImV4cCI6MjA5MjEyNzIyNH0.d6uDSRhVOBl2BriIUTE43vA042mYPSRqCL95AqtIn6U";
const TEACHER_CODE = "DANI2025";
const pick = a => a[Math.floor(Math.random()*a.length)];
const rnd  = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
const genCode = () => Math.random().toString(36).substring(2,8).toUpperCase();

async function db({table,method="GET",body,filters="",upsertOn=""}) {
  try {
    const h = {"Content-Type":"application/json","apikey":ANON_KEY,"Authorization":`Bearer ${ANON_KEY}`};
    if(method==="POST") h["Prefer"] = upsertOn ? `resolution=merge-duplicates,return=representation` : "return=representation";
    const url = `${SUPABASE_URL}/rest/v1/${table}${upsertOn?`?on_conflict=${upsertOn}`:""}${filters}`;
    const r = await fetch(url,{method,headers:h,body:body?JSON.stringify(body):undefined});
    return r.json();
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
  "Casi casi… revisá ese detalle 👀",
  "Pensalo como si se lo explicaras a alguien más 💭",
];
const MSG_OK = ["¡Bien ahí! 🔥","¡Crack! 😎","¡La rompiste! 💥","¡Perfecto! 🎯","¡Excelente! ⭐","¡Genial! 🚀","¡Ahí está! 💡","¡Buenísimo! 🙌"];
const MSG_REFLECT = [
  "¿Cómo llegaste a ese resultado?",
  "¿Hay otra manera de hacerlo?",
  "¿Esto siempre va a dar bien o depende del número?",
  "¿Cómo se lo explicarías a un compañero?",
  "¿Qué te hizo darte cuenta de la respuesta?",
];

// ─── GAMES CONFIG ──────────────────────────────────────────────────────────
const GAMES = [
  {id:"ceros",name:"Los Ceros Mágicos",   emoji:"🌱",desc:"Multiplicación y división con ceros",  color:"#4F8EF7",levels:4},
  {id:"orden",name:"El Gran Orden",        emoji:"🔢",desc:"Ordenar y comparar números",           color:"#10B981",levels:4},
  {id:"falta",name:"¿Qué número falta?",   emoji:"🧩",desc:"Descubrí el factor o el dividendo",   color:"#F97316",levels:4},
  {id:"valor",name:"¿Cuánto vale?",        emoji:"⚖️",desc:"Valor posicional y descomposición",   color:"#A855F7",levels:4},
];

// ─── PROBLEM GENERATORS ────────────────────────────────────────────────────
function genCeros(lv) {
  const z = lv<=2?rnd(1,2):rnd(2,3), pow=Math.pow(10,z);
  const doMult = lv===1||(lv===4&&Math.random()>.5);
  if(doMult||(lv!==2&&lv!==3)) {
    const a=rnd(2,9)*pow, b=rnd(2,9), base=a/pow;
    return {type:"input",expr:`${a} × ${b}`,answer:String(a*b),
      displayAns:`${a} × ${b} = ${a*b}`,
      contextQ:`¿Qué pasaría si fuera ${a*10} × ${b}?`,
      guides:[`¿Cuánto es ${base} × ${b} (sin los ceros)?`,`¿Cuántos ceros tiene el ${a}?`,`Entonces ${base}×${b}=${base*b} y el ${a} tiene ${z} cero${z>1?"s":""}… ¿qué pasa?`]};
  } else {
    const q=rnd(2,9), d=rnd(2,9), div=q*d*pow;
    return {type:"input",expr:`${div} ÷ ${d}`,answer:String(q*pow),
      displayAns:`${div} ÷ ${d} = ${q*pow}`,
      contextQ:`¿Y si dividieras ${div} ÷ ${rnd(2,9)}? ¿Te parece que daría exacto?`,
      guides:[`¿Cuánto es ${q*d} ÷ ${d} (sin los ceros)?`,`¿Cuántos ceros tiene el ${div}?`,`Entonces ${q*d}÷${d}=${q}, y el ${div} tiene ${z} cero${z>1?"s":""}… ¿qué pasa?`]};
  }
}

function genOrden(lv) {
  const count = lv<=2?4:5;
  let nums=[];
  while(nums.length<count){
    const n = lv===1?rnd(100,999):rnd(1000,9999);
    if(!nums.includes(n)) nums.push(n);
  }
  if(lv>=3){
    const base=rnd(1,8)*1000+rnd(0,8)*100;
    nums=[base,base+50,base+200,base+750,base+900].slice(0,count).map(n=>Math.max(1000,Math.min(9999,n)));
    const unique=new Set(nums); while(unique.size<count){unique.add(rnd(1000,9999));} nums=[...unique].slice(0,count);
  }
  const sorted=[...nums].sort((a,b)=>a-b);
  let shuffled=[...nums].sort(()=>Math.random()-.5);
  while(JSON.stringify(shuffled)===JSON.stringify(sorted)) shuffled=[...nums].sort(()=>Math.random()-.5);
  return {type:"order",nums:shuffled,answer:sorted,
    displayAns:sorted.join(" < "),
    contextQ:`¿Cuánto le falta al número ${sorted[0]} para llegar al ${sorted[sorted.length-1]}?`,
    guides:[`¿Cuál es el número más chico que ves?`,`De los que quedan, ¿cuál es el más chico ahora?`,`Fijate cuántas cifras tiene cada número — los que tienen más cifras son más grandes`]};
}

function genFalta(lv) {
  const z=lv<=2?1:rnd(1,2), pow=Math.pow(10,z);
  if(lv<=2){
    const a=rnd(2,9)*pow, b=rnd(2,9), result=a*b;
    const hideA=lv===1||Math.random()>.5;
    return {type:"input",
      expr:hideA?`___ × ${b} = ${result}`:`${a} × ___ = ${result}`,
      answer:hideA?String(a):String(b),
      displayAns:`${a} × ${b} = ${result}`,
      contextQ:hideA?`¿Hay otro número que multiplicado por ${b} dé un resultado parecido?`:`¿Cómo te diste cuenta de cuánto era el número que faltaba?`,
      guides:[hideA?`¿Cuánto es ${result} ÷ ${b}?`:`¿Cuánto es ${result} ÷ ${a}?`,`La multiplicación y la división son operaciones inversas`,`Probá diferentes números hasta encontrar el que funcione`]};
  } else {
    const q=rnd(2,9), d=rnd(2,9), dividend=q*d*pow;
    const hideD=Math.random()>.5;
    return {type:"input",
      expr:hideD?`${dividend} ÷ ___ = ${q*pow}`:`___ ÷ ${d} = ${q*pow}`,
      answer:hideD?String(d):String(dividend),
      displayAns:`${dividend} ÷ ${d} = ${q*pow}`,
      contextQ:`¿Podrías plantear otra división que dé el mismo resultado?`,
      guides:[hideD?`Si ${dividend} ÷ ___ = ${q*pow}, ¿cuánto es ${dividend} ÷ ${q*pow}?`:`Si ___ ÷ ${d} = ${q*pow}, ¿cuánto es ${q*pow} × ${d}?`,`Multiplicación y división se deshacen una a la otra`,hideD?`¿Cuánto es ${dividend} ÷ ${q*pow}?`:`¿Cuánto es ${q*pow} × ${d}?`]};
  }
}

function genValor(lv) {
  const num=rnd(1000,9999);
  const digs=String(num).split("").map(Number);
  const POS=["millares","centenas","decenas","unidades"];
  const VALS=[1000,100,10,1];
  if(lv===1){
    const p=rnd(0,3);
    const answer=digs[p]*VALS[p];
    return {type:"input",expr:`En el número ${num}, ¿cuánto vale el dígito ${digs[p]} que está en los ${POS[p]}?`,
      answer:String(answer),displayAns:`El ${digs[p]} en los ${POS[p]} vale ${answer}`,
      contextQ:`¿Y si ese mismo dígito estuviera en las ${POS[p===0?1:p-1]}? ¿Cuánto valdría?`,
      guides:[`El ${num} tiene: ${digs[0]} en los millares, ${digs[1]} en las centenas, ${digs[2]} en las decenas, ${digs[3]} en las unidades`,`Un dígito en los ${POS[p]} vale dígito × ${VALS[p]}`,`¿Cuánto es ${digs[p]} × ${VALS[p]}?`]};
  }
  if(lv===2){
    const parts=[digs[0]*1000,digs[1]*100,digs[2]*10,digs[3]].filter(x=>x>0);
    const answer=parts.join("+");
    return {type:"input",expr:`Descomponé el ${num} (escribí: 3000+400+20+5)`,
      answer,displayAns:`${num} = ${parts.join(" + ")}`,flexible:true,
      contextQ:`¿Cuánto le tendrías que sumar al ${num} para que el dígito de las centenas sea 9?`,
      guides:[`El ${num} tiene ${digs[0]} millares, ${digs[1]} centenas, ${digs[2]} decenas y ${digs[3]} unidades`,`Calculá el valor de cada parte: ${digs[0]}×1000, ${digs[1]}×100…`,`Escribilos separados con + sin espacios`]};
  }
  if(lv===3){
    const parts=[digs[0]*1000,digs[1]*100,digs[2]*10,digs[3]].filter(x=>x>0);
    return {type:"input",expr:`${parts.join(" + ")} = ___`,
      answer:String(num),displayAns:`${parts.join(" + ")} = ${num}`,
      contextQ:`Si cambiaras el ${digs[1]*100} por ${(digs[1]+1)*100}, ¿cuánto daría en total?`,
      guides:[`Sumá los números de izquierda a derecha`,`Empezá por los más grandes: ${parts[0]} + ${parts[1]||0}`,`Después sumá los que quedan`]};
  }
  // lv===4: comparar
  const a=rnd(1000,9999), b=rnd(1000,9999);
  if(a===b) return genValor(4);
  const answer=a>b?">":"<";
  return {type:"choice",choices:[">","<"],expr:`${a}  ___  ${b}`,
    answer,displayAns:`${a} ${answer} ${b}`,
    contextQ:`¿Cuánto le falta al número más chico para igualar al más grande?`,
    guides:[`Fijate el primer dígito de cada número`,`Si el primer dígito es igual, compará el segundo`,`El número con el dígito mayor en la posición más alta es el número mayor`]};
}

const GENS = {ceros:genCeros,orden:genOrden,falta:genFalta,valor:genValor};

// ─── STYLES ────────────────────────────────────────────────────────────────
const card  = {background:"white",borderRadius:28,padding:"32px 28px",maxWidth:500,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.13)"};
const sinp  = {width:"100%",padding:"13px 16px",borderRadius:14,border:"2px solid #e2e8f0",fontSize:16,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:12};
const sbtn  = (bg,ex={}) => ({padding:"12px 20px",borderRadius:16,border:"none",background:bg,color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit",...ex});
const spg   = (bg="linear-gradient(135deg,#667eea,#764ba2)") => ({minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:bg,padding:20,fontFamily:"'Nunito',sans-serif"});

// ─── HOME ──────────────────────────────────────────────────────────────────
function Home({go}) {
  return (
    <div style={spg()}>
      <div style={{...card,textAlign:"center"}}>
        <div style={{fontSize:60,marginBottom:8}}>🎓</div>
        <h1 style={{fontSize:30,fontWeight:900,color:"#1e293b",margin:"0 0 6px"}}>MateJuegos</h1>
        <p style={{color:"#64748b",fontSize:14,marginBottom:32}}>La plataforma de Dani para aprender matemática jugando</p>
        <button onClick={()=>go("teacher-login")} style={{...sbtn("linear-gradient(135deg,#667eea,#764ba2)"),width:"100%",padding:"16px",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:14}}>👩‍🏫 Soy docente</button>
        <button onClick={()=>go("student-enter")} style={{...sbtn("linear-gradient(135deg,#4F8EF7,#06b6d4)"),width:"100%",padding:"16px",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>👩‍🎓 Soy alumna/o</button>
      </div>
    </div>
  );
}

// ─── TEACHER LOGIN ─────────────────────────────────────────────────────────
function TeacherLogin({go,setTeacher}) {
  const [code,setCode]=useState(""), [err,setErr]=useState("");
  const login=()=>{if(code.trim().toUpperCase()===TEACHER_CODE){setTeacher({});go("teacher-dashboard");}else setErr("Código incorrecto.");};
  return (
    <div style={spg()}>
      <div style={card}>
        <button onClick={()=>go("home")} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:14,marginBottom:20,padding:0}}>← Volver</button>
        <div style={{fontSize:40,textAlign:"center",marginBottom:8}}>👩‍🏫</div>
        <h2 style={{fontSize:24,fontWeight:900,color:"#1e293b",textAlign:"center",marginBottom:20}}>Panel Docente</h2>
        <input style={{...sinp,textAlign:"center",fontSize:20,fontWeight:800,letterSpacing:4}} placeholder="••••••••" value={code} maxLength={12} type="password" onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&login()}/>
        {err&&<p style={{color:"#ef4444",fontSize:13,margin:"0 0 10px"}}>{err}</p>}
        <button style={{...sbtn("linear-gradient(135deg,#667eea,#764ba2)"),width:"100%"}} onClick={login}>Ingresar 🔑</button>
      </div>
    </div>
  );
}

// ─── TEACHER DASHBOARD ─────────────────────────────────────────────────────
function TeacherDashboard({go}) {
  const [classes,setClasses]=useState([]), [selected,setSelected]=useState(null);
  const [newName,setNewName]=useState(""), [loading,setLoading]=useState(true), [creating,setCreating]=useState(false);
  const [tab,setTab]=useState("results");
  const [results,setResults]=useState([]), [reflections,setRef]=useState([]), [attempts,setAttempts]=useState([]);
  const [loadingData,setLoadingData]=useState(false);

  useEffect(()=>{loadClasses();},[]);

  const loadClasses=async()=>{
    setLoading(true);
    const d=await db({table:"classes",filters:"?order=created_at.desc"});
    if(Array.isArray(d)) setClasses(d);
    setLoading(false);
  };

  const selectClass=async(cls)=>{
    setSelected(cls); setLoadingData(true); setTab("results");
    const [res,refs,att]=await Promise.all([
      db({table:"game_results",filters:`?class_code=eq.${cls.code}&order=played_at.desc`}),
      db({table:"reflections",filters:`?class_code=eq.${cls.code}&order=created_at.desc`}),
      db({table:"exercise_attempts",filters:`?class_code=eq.${cls.code}&order=played_at.desc`}),
    ]);
    if(Array.isArray(res)) setResults(res);
    if(Array.isArray(refs)) setRef(refs);
    if(Array.isArray(att)) setAttempts(att);
    setLoadingData(false);
  };

  const createClass=async()=>{
    if(!newName.trim()) return; setCreating(true);
    await db({table:"classes",method:"POST",body:{teacher_email:"dani",name:newName.trim(),code:genCode()}});
    setNewName(""); await loadClasses(); setCreating(false);
  };

  // Group attempts by student + game
  const attemptStats = attempts.reduce((acc,a)=>{
    const key=`${a.student_name}||${a.game_id}`;
    if(!acc[key]) acc[key]={student:a.student_name,game:a.game_id,total:0,hints:0,failed:0,exercises:new Set()};
    acc[key].total++;
    acc[key].hints+=a.hints_used||0;
    if(!a.solved) acc[key].failed++;
    acc[key].exercises.add(a.exercise_expr);
    return acc;
  },{});

  const gameResults = results.reduce((acc,r)=>{
    if(!acc[r.student_name]) acc[r.student_name]={};
    acc[r.student_name][r.game_id]={score:r.score,correct:r.correct_count,wrong:r.wrong_count,level:r.level_reached};
    return acc;
  },{});

  const students = [...new Set([...results.map(r=>r.student_name),...reflections.map(r=>r.student_name)])];

  return (
    <div style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:"'Nunito',sans-serif"}}>
      <div style={{background:"linear-gradient(135deg,#667eea,#764ba2)",padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{color:"rgba(255,255,255,0.65)",fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Panel Docente</div><div style={{color:"white",fontSize:22,fontWeight:900}}>🎓 MateJuegos</div></div>
        <button onClick={()=>go("home")} style={{background:"rgba(255,255,255,0.18)",border:"none",color:"white",borderRadius:12,padding:"8px 18px",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Salir</button>
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"24px 16px",display:"grid",gridTemplateColumns:"260px 1fr",gap:18,alignItems:"start"}}>
        <div>
          <div style={{background:"white",borderRadius:20,padding:20,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <h3 style={{margin:"0 0 12px",color:"#1e293b",fontWeight:900,fontSize:15}}>➕ Nueva clase</h3>
            <input style={{...sinp,marginBottom:8}} placeholder="Nombre (ej: 4to A)" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createClass()}/>
            <button onClick={createClass} disabled={creating||!newName.trim()} style={{...sbtn("linear-gradient(135deg,#667eea,#764ba2)"),width:"100%"}}>{creating?"Creando...":"Crear clase"}</button>
          </div>
          <div style={{background:"white",borderRadius:20,padding:20,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <h3 style={{margin:"0 0 12px",color:"#1e293b",fontWeight:900,fontSize:15}}>📚 Mis clases</h3>
            {loading&&<p style={{color:"#94a3b8",fontSize:14}}>Cargando...</p>}
            {!loading&&classes.length===0&&<p style={{color:"#94a3b8",fontSize:14}}>Todavía no creaste ninguna.</p>}
            {classes.map(cls=>(
              <div key={cls.id} onClick={()=>selectClass(cls)} style={{border:`2px solid ${selected?.id===cls.id?"#667eea":"#f1f5f9"}`,borderRadius:14,padding:"12px 14px",marginBottom:8,cursor:"pointer",background:selected?.id===cls.id?"#f5f3ff":"#fafafa",transition:"all 0.2s"}}>
                <div style={{fontWeight:800,color:"#1e293b",fontSize:14,marginBottom:4}}>{cls.name}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{color:"#94a3b8",fontSize:11}}>{new Date(cls.created_at).toLocaleDateString("es-AR")}</span>
                  <span style={{background:"#667eea22",color:"#667eea",borderRadius:10,padding:"2px 8px",fontWeight:900,fontSize:13,letterSpacing:2}}>{cls.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {!selected&&<div style={{background:"white",borderRadius:20,padding:40,textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}><div style={{fontSize:48,marginBottom:12}}>👈</div><p style={{color:"#94a3b8",fontWeight:700}}>Seleccioná una clase para ver los datos</p></div>}
          {selected&&(
            <div style={{background:"white",borderRadius:20,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div><h3 style={{margin:"0 0 4px",color:"#1e293b",fontWeight:900}}>📊 {selected.name}</h3><p style={{margin:0,color:"#94a3b8",fontSize:12}}>Código: <strong style={{color:"#667eea",letterSpacing:1}}>{selected.code}</strong></p></div>
                <button onClick={()=>selectClass(selected)} style={{...sbtn("#f1f5f9"),color:"#64748b",fontSize:13}}>🔄</button>
              </div>

              <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
                {["results","attempts","reflections"].map(t=>(
                  <button key={t} onClick={()=>setTab(t)} style={{...sbtn(tab===t?"#667eea":"#f1f5f9"),color:tab===t?"white":"#64748b",padding:"8px 14px",fontSize:13,flex:1}}>
                    {t==="results"?"📈 Resultados":t==="attempts"?"🔍 Intentos":"💭 Reflexiones"}
                    {t==="reflections"&&reflections.length>0&&<span style={{background:"#ef4444",color:"white",borderRadius:99,padding:"1px 6px",fontSize:10,marginLeft:4}}>{reflections.length}</span>}
                  </button>
                ))}
              </div>

              {loadingData&&<p style={{color:"#94a3b8"}}>Cargando...</p>}

              {!loadingData&&tab==="results"&&(
                <>
                  {students.length===0&&<div style={{textAlign:"center",padding:"30px 0"}}><div style={{fontSize:40}}>🎮</div><p style={{color:"#94a3b8",marginTop:8}}>Nadie jugó todavía. Código: <strong style={{color:"#667eea"}}>{selected.code}</strong></p></div>}
                  {students.map(name=>(
                    <div key={name} style={{background:"#f8fafc",borderRadius:14,padding:"14px 16px",marginBottom:12}}>
                      <div style={{fontWeight:900,color:"#1e293b",marginBottom:10,fontSize:15}}>{name}</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        {GAMES.map(g=>{
                          const r=gameResults[name]?.[g.id];
                          return (
                            <div key={g.id} style={{background:"white",borderRadius:12,padding:"10px 12px",border:`2px solid ${r?"#e2e8f0":"#f1f5f9"}`}}>
                              <div style={{fontSize:12,fontWeight:800,color:r?g.color:"#94a3b8"}}>{g.emoji} {g.name}</div>
                              {r?<div style={{display:"flex",gap:8,marginTop:6,fontSize:12}}>
                                <span style={{color:"#667eea",fontWeight:800}}>⭐{r.score}</span>
                                <span style={{color:"#22c55e",fontWeight:800}}>✅{r.correct}</span>
                                <span style={{color:"#ef4444",fontWeight:800}}>❌{r.wrong}</span>
                              </div>:<div style={{color:"#cbd5e1",fontSize:11,marginTop:4}}>Sin jugar</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!loadingData&&tab==="attempts"&&(
                <>
                  {Object.keys(attemptStats).length===0&&<div style={{textAlign:"center",padding:"30px 0"}}><div style={{fontSize:40}}>🔍</div><p style={{color:"#94a3b8",marginTop:8}}>Sin datos de intentos todavía.</p></div>}
                  {Object.values(attemptStats).map((s,i)=>{
                    const game=GAMES.find(g=>g.id===s.game);
                    return (
                      <div key={i} style={{background:"#f8fafc",borderRadius:14,padding:"12px 16px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontWeight:800,color:"#1e293b"}}>{s.student}</div>
                          <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{game?.emoji} {game?.name}</div>
                        </div>
                        <div style={{display:"flex",gap:12,textAlign:"center"}}>
                          <div><div style={{fontWeight:900,color:"#667eea",fontSize:16}}>{s.total}</div><div style={{fontSize:10,color:"#94a3b8"}}>intentos</div></div>
                          <div><div style={{fontWeight:900,color:"#f97316",fontSize:16}}>{s.hints}</div><div style={{fontSize:10,color:"#94a3b8"}}>ayudas</div></div>
                          <div><div style={{fontWeight:900,color:"#ef4444",fontSize:16}}>{s.failed}</div><div style={{fontSize:10,color:"#94a3b8"}}>errores</div></div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {!loadingData&&tab==="reflections"&&(
                <>
                  {reflections.length===0&&<div style={{textAlign:"center",padding:"30px 0"}}><div style={{fontSize:40}}>💭</div><p style={{color:"#94a3b8",marginTop:8}}>Sin reflexiones todavía.</p></div>}
                  {reflections.map((r,i)=>(
                    <div key={i} style={{background:"#f5f3ff",borderRadius:14,padding:"14px",marginBottom:10,borderLeft:"4px solid #667eea"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                        <strong style={{color:"#1e293b",fontSize:14}}>{r.student_name}</strong>
                        <span style={{color:"#94a3b8",fontSize:11}}>{new Date(r.created_at).toLocaleDateString("es-AR")} {new Date(r.created_at).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}</span>
                      </div>
                      <p style={{color:"#64748b",fontSize:13,margin:"0 0 4px",fontStyle:"italic"}}>"{r.question}"</p>
                      <p style={{color:"#1e293b",fontSize:14,margin:0,fontWeight:700}}>{r.answer}</p>
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
function StudentEnter({go,setStudent}) {
  const [name,setName]=useState(""), [code,setCode]=useState(""), [err,setErr]=useState(""), [loading,setLoading]=useState(false);
  const enter=async()=>{
    if(!name.trim()||!code.trim()){setErr("Completá tu nombre y el código");return;}
    setLoading(true); setErr("");
    const d=await db({table:"classes",filters:`?code=eq.${code.toUpperCase().trim()}`});
    if(Array.isArray(d)&&d.length>0){setStudent({name:name.trim(),classCode:code.toUpperCase().trim(),className:d[0].name});go("game-menu");}
    else setErr("Código no encontrado. Pedíselo a tu profe 😊");
    setLoading(false);
  };
  return (
    <div style={spg("linear-gradient(135deg,#4F8EF7,#06b6d4)")}>
      <div style={card}>
        <button onClick={()=>go("home")} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:14,marginBottom:20,padding:0}}>← Volver</button>
        <div style={{textAlign:"center",marginBottom:24}}><div style={{fontSize:56,marginBottom:8}}>👩‍🎓</div><h2 style={{fontSize:24,fontWeight:900,color:"#1e293b",margin:"0 0 6px"}}>¡Hola! ¿Cómo te llamás?</h2><p style={{color:"#64748b",fontSize:14,margin:0}}>Ingresá tu nombre y el código de tu clase</p></div>
        <input style={sinp} placeholder="Tu nombre (ej: Sofía)" value={name} onChange={e=>setName(e.target.value)}/>
        <input style={{...sinp,textTransform:"uppercase",letterSpacing:5,fontSize:22,fontWeight:800,textAlign:"center"}} placeholder="CÓDIGO" maxLength={6} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&enter()}/>
        {err&&<p style={{color:"#ef4444",fontSize:13,margin:"0 0 10px"}}>{err}</p>}
        <button style={{...sbtn("linear-gradient(135deg,#4F8EF7,#06b6d4)"),width:"100%",padding:"15px",fontSize:18}} onClick={enter} disabled={loading}>{loading?"Buscando clase...":"¡Entrar a jugar! 🚀"}</button>
      </div>
    </div>
  );
}

// ─── GAME MENU ─────────────────────────────────────────────────────────────
function GameMenu({student,go,setGameSession}) {
  const [progress,setProgress]=useState({});
  const [loading,setLoading]=useState(true);

  useEffect(()=>{loadProgress();},[]);

  const loadProgress=async()=>{
    const d=await db({table:"student_progress",filters:`?class_code=eq.${student.classCode}&student_name=eq.${encodeURIComponent(student.name)}`});
    if(Array.isArray(d)){
      const p={};
      d.forEach(r=>{ p[r.game_id]={level:r.level_reached,completed:r.completed}; });
      setProgress(p);
    }
    setLoading(false);
  };

  const startGame=(gameId,level)=>{
    setGameSession({gameId,level});
    go("game-player");
  };

  const getLevelStatus=(gameId,levelNum)=>{
    const gp=progress[gameId];
    const reached=gp?.level||1;
    if(levelNum<reached) return "done";
    if(levelNum===reached) return "current";
    return "locked";
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#f8faff,#f0f4ff)",fontFamily:"'Nunito',sans-serif"}}>
      <div style={{background:"linear-gradient(135deg,#667eea,#764ba2)",padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{color:"rgba(255,255,255,0.7)",fontSize:12,fontWeight:700}}>¡Hola, {student.name}! 👋</div><div style={{color:"white",fontSize:20,fontWeight:900}}>🎓 Elegí tu juego</div></div>
        <button onClick={()=>go("home")} style={{background:"rgba(255,255,255,0.18)",border:"none",color:"white",borderRadius:12,padding:"8px 16px",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13}}>Salir</button>
      </div>

      {loading&&<div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Cargando tu progreso...</div>}

      {!loading&&(
        <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {GAMES.map(game=>(
            <div key={game.id} style={{background:"white",borderRadius:24,padding:24,boxShadow:"0 4px 20px rgba(0,0,0,0.08)",border:`2px solid ${game.color}22`}}>
              <div style={{fontSize:36,marginBottom:8}}>{game.emoji}</div>
              <h3 style={{margin:"0 0 4px",color:"#1e293b",fontWeight:900,fontSize:17}}>{game.name}</h3>
              <p style={{color:"#64748b",fontSize:13,margin:"0 0 16px"}}>{game.desc}</p>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[1,2,3,4].map(lv=>{
                  const status=getLevelStatus(game.id,lv);
                  const isLocked=status==="locked";
                  const isDone=status==="done";
                  const isCurrent=status==="current";
                  return (
                    <button key={lv} onClick={()=>!isLocked&&startGame(game.id,lv)}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:14,border:`2px solid ${isLocked?"#f1f5f9":game.color}`,background:isLocked?"#fafafa":isDone?"#f0fdf4":isCurrent?`${game.color}15`:"white",cursor:isLocked?"not-allowed":"pointer",transition:"all 0.2s",fontFamily:"inherit"}}>
                      <span style={{fontSize:18}}>{isLocked?"🔒":isDone?"✅":"▶️"}</span>
                      <div style={{flex:1,textAlign:"left"}}>
                        <div style={{fontWeight:800,fontSize:14,color:isLocked?"#cbd5e1":isDone?"#16a34a":game.color}}>Nivel {lv}</div>
                        <div style={{fontSize:11,color:"#94a3b8"}}>{["Básico","Intermedio","Avanzado","Desafío"][lv-1]}</div>
                      </div>
                      {isCurrent&&<span style={{background:game.color,color:"white",borderRadius:8,padding:"2px 8px",fontSize:11,fontWeight:800}}>Jugá</span>}
                      {isDone&&<span style={{color:"#16a34a",fontSize:11,fontWeight:700}}>¡Completo!</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── GAME PLAYER ───────────────────────────────────────────────────────────
function GamePlayer({student,gameSession,go}) {
  const {gameId,level} = gameSession;
  const game = GAMES.find(g=>g.id===gameId);
  const gen  = GENS[gameId];

  const [prob,setProb]           = useState(()=>gen(level));
  const [phase,setPhase]         = useState("question");
  const [answer,setAnswer]       = useState("");
  const [orderSelected,setOrderSelected] = useState([]);
  const [guideStep,setGuideStep] = useState(0);
  const [guideAns,setGuideAns]   = useState("");
  const [wrongMsg,setWrongMsg]   = useState("");
  const [okMsg,setOkMsg]         = useState("");
  const [reflectQ,setReflectQ]   = useState("");
  const [showReflect,setShowReflect] = useState(false);
  const [reflectAns,setReflectAns]   = useState("");
  const [reflectSaved,setReflectSaved] = useState(false);
  const [score,setScore]         = useState(0);
  const [correct,setCorrect]     = useState(0);
  const [wrong,setWrong]         = useState(0);
  const [cil,setCil]             = useState(0);
  const [finished,setFinished]   = useState(false);
  const [saving,setSaving]       = useState(false);
  const [attempts,setAttempts]   = useState(0);
  const [hintsUsed,setHintsUsed] = useState(0);
  const totalExercises           = useRef(0);
  const inputRef                 = useRef(null);

  useEffect(()=>{setTimeout(()=>inputRef.current?.focus(),200);},[phase,prob]);

  const newProb=()=>{
    totalExercises.current++;
    setProb(gen(level)); setAnswer(""); setPhase("question");
    setGuideStep(0); setGuideAns(""); setReflectAns(""); setReflectSaved(false); setShowReflect(false);
    setAttempts(0); setHintsUsed(0);
    setTimeout(()=>inputRef.current?.focus(),100);
  };

  const checkAnswer=(val)=>{
    const userAns=(val||answer);
    let correct_ans=false;
    if(prob.type==="order"){
      const selected=orderSelected;
      correct_ans=JSON.stringify(selected)===JSON.stringify(prob.answer);
    } else if(prob.flexible){
      const norm=s=>s.replace(/\s/g,"");
      correct_ans=norm(String(userAns))===norm(String(prob.answer));
    } else {
      correct_ans=String(userAns).trim()===String(prob.answer);
    }

    // Save attempt
    db({table:"exercise_attempts",method:"POST",body:{class_code:student.classCode,student_name:student.name,game_id:gameId,level,exercise_expr:prob.expr,attempts:attempts+1,hints_used:hintsUsed,solved:correct_ans}});
    setAttempts(a=>a+1);

    if(correct_ans){
      totalExercises.current++;
      const shouldReflect=totalExercises.current%5===0;
      setOkMsg(pick(MSG_OK));
      if(shouldReflect){setReflectQ(pick(MSG_REFLECT));setShowReflect(true);}
      setScore(s=>s+10); setCorrect(c=>c+1);
      setCil(c=>{ const n=c+1; return n; });
      setPhase("correct");
    } else {
      setWrongMsg(pick(MSG_WRONG));
      setWrong(c=>c+1);
      setPhase("wrong");
      setOrderSelected([]);
    }
  };

  const saveReflection=async()=>{
    if(!reflectAns.trim()) return;
    await db({table:"reflections",method:"POST",body:{class_code:student.classCode,student_name:student.name,question:reflectQ,answer:reflectAns}});
    setReflectSaved(true);
  };

  const handleContinue=async()=>{
    const newCil=cil;
    if(newCil>=5){
      setSaving(true);
      await Promise.all([
        db({table:"game_results",method:"POST",body:{class_code:student.classCode,student_name:student.name,game_id:gameId,game_name:game.name,score,correct_count:correct,wrong_count:wrong,level_reached:level}}),
        db({table:"student_progress",method:"POST",upsertOn:"class_code,student_name,game_id",body:{class_code:student.classCode,student_name:student.name,game_id:gameId,level_reached:level+1,exercises_completed:totalExercises.current,completed:level>=4,last_played:new Date().toISOString()}}),
      ]);
      setSaving(false);
      setFinished(true);
    } else {
      newProb();
    }
  };

  const saveAndExit=async()=>{
    await db({table:"student_progress",method:"POST",upsertOn:"class_code,student_name,game_id",body:{class_code:student.classCode,student_name:student.name,game_id:gameId,level_reached:level,exercises_completed:totalExercises.current,completed:false,last_played:new Date().toISOString()}});
    go("game-menu");
  };

  const pct=Math.min((cil/5)*100,100);

  // ── ORDER GAME HELPERS ──
  const handleOrderClick=(num)=>{
    if(orderSelected.includes(num)){
      setOrderSelected(orderSelected.filter(n=>n!==num));
    } else {
      const next=[...orderSelected,num];
      setOrderSelected(next);
      if(next.length===prob.nums.length) checkAnswer(next);
    }
  };

  if(finished) return (
    <div style={spg(`linear-gradient(135deg,${game.color},${game.color}99)`)}>
      <div style={{...card,textAlign:"center"}}>
        <div style={{fontSize:68}}>🏆</div>
        <h2 style={{fontSize:26,fontWeight:900,color:"#1e293b",margin:"10px 0 4px"}}>¡Nivel {level} completado!</h2>
        <p style={{color:"#64748b",marginBottom:24}}>¡Excelente trabajo, {student.name}! 🎉</p>
        <div style={{background:`${game.color}15`,borderRadius:20,padding:"20px 24px",marginBottom:24,display:"flex",justifyContent:"space-around"}}>
          <div><div style={{fontSize:36,fontWeight:900,color:game.color}}>{score}</div><div style={{fontSize:12,color:"#475569",fontWeight:800}}>PUNTOS</div></div>
          <div><div style={{fontSize:36,fontWeight:900,color:"#22c55e"}}>{correct}</div><div style={{fontSize:12,color:"#475569",fontWeight:800}}>CORRECTAS</div></div>
          <div><div style={{fontSize:36,fontWeight:900,color:"#ef4444"}}>{wrong}</div><div style={{fontSize:12,color:"#475569",fontWeight:800}}>ERRORES</div></div>
        </div>
        {saving&&<p style={{color:"#94a3b8",fontSize:13,marginBottom:12}}>Guardando... ⏳</p>}
        {!saving&&<p style={{color:"#22c55e",fontSize:13,marginBottom:12,fontWeight:700}}>✅ ¡Tu progreso fue guardado!</p>}
        <button style={{...sbtn("linear-gradient(135deg,#667eea,#764ba2)"),width:"100%",marginBottom:10}} onClick={()=>go("game-menu")}>Volver a los juegos 🎮</button>
        {level<4&&<p style={{color:game.color,fontSize:13,fontWeight:700,margin:0}}>🔓 ¡Desbloqueaste el Nivel {level+1}!</p>}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${game.color}12,${game.color}28)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Nunito',sans-serif",transition:"background 0.5s"}}>
      <style>{`@keyframes pop{0%{transform:scale(.85);opacity:0}70%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}`}</style>

      {/* Header */}
      <div style={{width:"100%",maxWidth:500,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{background:game.color,color:"white",borderRadius:14,padding:"7px 14px",fontWeight:800,fontSize:13}}>{game.emoji} {game.name} · Nivel {level}</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <div style={{background:"white",borderRadius:12,padding:"6px 12px",fontWeight:800,color:"#22c55e",fontSize:13,boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>✅ {correct}</div>
          <div style={{background:"white",borderRadius:12,padding:"6px 12px",fontWeight:800,color:game.color,fontSize:13,boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>⭐ {score}</div>
          <button onClick={saveAndExit} style={{background:"rgba(255,255,255,0.9)",border:"none",borderRadius:12,padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,color:"#64748b"}}>💾 Salir</button>
        </div>
      </div>

      {/* Progress */}
      <div style={{width:"100%",maxWidth:500,marginBottom:12}}>
        <div style={{background:"#e2e8f0",borderRadius:99,height:7,overflow:"hidden"}}>
          <div style={{height:"100%",background:game.color,width:`${pct}%`,borderRadius:99,transition:"width 0.4s"}}/>
        </div>
        <div style={{fontSize:11,color:"#94a3b8",textAlign:"right",marginTop:3}}>{cil}/5 para completar el nivel</div>
      </div>

      <div style={{...card,maxWidth:500}}>

        {/* ── QUESTION ── */}
        {phase==="question"&&(
          <>
            <p style={{textAlign:"center",color:"#94a3b8",fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>
              {prob.type==="order"?"Tocá los números de menor a mayor":prob.type==="choice"?"¿Qué símbolo va en el medio?":"¿Cuánto es?"}
            </p>

            {/* INPUT TYPE */}
            {prob.type==="input"&&(
              <>
                <div style={{textAlign:"center",marginBottom:20}}>
                  <p style={{fontSize:prob.expr.length>30?16:26,fontWeight:900,color:"#1e293b",margin:0,lineHeight:1.4}}>{prob.expr.includes("___")?prob.expr:`${prob.expr} =`}</p>
                  {!prob.expr.includes("___")&&<div style={{fontSize:28,fontWeight:900,color:game.color,borderBottom:`3px solid ${game.color}`,paddingBottom:2,minWidth:100,display:"inline-block",marginTop:8}}>{answer||"　　　　"}</div>}
                </div>
                <input ref={inputRef} type="text" inputMode={prob.flexible?"text":"numeric"} placeholder={prob.flexible?"Escribí la descomposición...":"Escribí el resultado"}
                  value={answer} onChange={e=>setAnswer(prob.flexible?e.target.value:e.target.value.replace(/[^0-9]/g,""))}
                  onKeyDown={e=>e.key==="Enter"&&answer&&checkAnswer()}
                  style={{...sinp,fontSize:18,fontWeight:800,textAlign:"center"}}/>
                <button onClick={()=>checkAnswer()} disabled={!answer} style={{...sbtn(answer?game.color:"#e2e8f0"),width:"100%",color:answer?"white":"#94a3b8",cursor:answer?"pointer":"not-allowed"}}>✓ Comprobar</button>
              </>
            )}

            {/* CHOICE TYPE */}
            {prob.type==="choice"&&(
              <>
                <p style={{fontSize:28,fontWeight:900,color:"#1e293b",textAlign:"center",marginBottom:20}}>{prob.expr}</p>
                <div style={{display:"flex",gap:12}}>
                  {prob.choices.map(c=>(
                    <button key={c} onClick={()=>checkAnswer(c)} style={{...sbtn("#f1f5f9"),flex:1,fontSize:32,color:"#1e293b",padding:"18px"}}>{c}</button>
                  ))}
                </div>
              </>
            )}

            {/* ORDER TYPE */}
            {prob.type==="order"&&(
              <>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:16}}>
                  {prob.nums.map((n,i)=>{
                    const sel=orderSelected.includes(n);
                    const selIdx=orderSelected.indexOf(n);
                    return (
                      <button key={i} onClick={()=>handleOrderClick(n)} style={{...sbtn(sel?game.color:"#f1f5f9"),color:sel?"white":"#1e293b",padding:"12px 18px",fontSize:20,fontWeight:900,minWidth:80,position:"relative"}}>
                        {n}
                        {sel&&<span style={{position:"absolute",top:-8,right:-8,background:"#1e293b",color:"white",borderRadius:99,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900}}>{selIdx+1}</span>}
                      </button>
                    );
                  })}
                </div>
                {orderSelected.length>0&&(
                  <div style={{background:"#f8fafc",borderRadius:14,padding:"10px 14px",marginBottom:12,textAlign:"center"}}>
                    <p style={{margin:0,fontSize:13,color:"#64748b",fontWeight:700}}>Tu orden: {orderSelected.join(" → ")}</p>
                  </div>
                )}
                {orderSelected.length>0&&<button onClick={()=>setOrderSelected([])} style={{...sbtn("#f1f5f9"),width:"100%",color:"#64748b",fontSize:13}}>Borrar selección</button>}
              </>
            )}
          </>
        )}

        {/* ── WRONG ── */}
        {phase==="wrong"&&(
          <div style={{animation:"pop 0.3s ease"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:44,marginBottom:8}}>🤔</div>
              <p style={{fontSize:19,fontWeight:900,color:"#f97316",margin:0,lineHeight:1.4}}>{wrongMsg}</p>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setHintsUsed(h=>h+1);setPhase("guide");setGuideStep(0);setGuideAns("");}} style={{...sbtn("linear-gradient(135deg,#667eea,#764ba2)"),flex:1}}>Quiero una guía 💡</button>
              <button onClick={()=>{setAnswer("");setOrderSelected([]);setPhase("question");}} style={{...sbtn("#f1f5f9"),flex:1,color:"#475569"}}>Lo intento nuevamente 🔄</button>
            </div>
          </div>
        )}

        {/* ── GUIDE ── */}
        {phase==="guide"&&(
          <div style={{animation:"pop 0.3s ease"}}>
            <p style={{textAlign:"center",color:"#94a3b8",fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Guía · paso {guideStep+1} de {prob.guides.length}</p>
            <div style={{background:"#f5f3ff",borderRadius:16,padding:"16px 20px",marginBottom:16,borderLeft:`4px solid ${game.color}`}}>
              <p style={{fontSize:16,fontWeight:700,color:"#1e293b",margin:0}}>{prob.guides[guideStep]}</p>
            </div>
            <input ref={inputRef} type="text" placeholder="Tu respuesta..." value={guideAns} onChange={e=>setGuideAns(e.target.value)} style={{...sinp,fontSize:16,fontWeight:700,textAlign:"center"}}
              onKeyDown={e=>{if(e.key==="Enter"&&guideAns.trim()){if(guideStep<prob.guides.length-1){setGuideStep(g=>g+1);setGuideAns("");}else{setPhase("question");setAnswer("");setOrderSelected([]);}}}}/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setAnswer("");setOrderSelected([]);setPhase("question");}} style={{...sbtn("#f1f5f9"),color:"#475569",flex:1,fontSize:13}}>Salir de la guía</button>
              <button onClick={()=>{if(!guideAns.trim())return;if(guideStep<prob.guides.length-1){setGuideStep(g=>g+1);setGuideAns("");}else{setPhase("question");setAnswer("");setOrderSelected("");}}} style={{...sbtn(`linear-gradient(135deg,${game.color},${game.color}cc)`),flex:2}}>
                {guideStep<prob.guides.length-1?"Siguiente →":"¡Entonces… a intentarlo! 🚀"}
              </button>
            </div>
          </div>
        )}

        {/* ── CORRECT ── */}
        {phase==="correct"&&(
          <div style={{animation:"pop 0.3s ease"}}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:48,marginBottom:8}}>🎉</div>
              <p style={{fontSize:20,fontWeight:900,color:"#16a34a",margin:0,lineHeight:1.4}}>{okMsg}</p>
              <p style={{fontSize:13,color:"#64748b",marginTop:6}}>{prob.displayAns}</p>
            </div>

            {/* Contextual question — always shown */}
            <div style={{background:`${game.color}12`,borderRadius:14,padding:"12px 16px",marginBottom:16,borderLeft:`3px solid ${game.color}`}}>
              <p style={{fontSize:14,fontWeight:700,color:"#1e293b",margin:0}}>💬 {prob.contextQ}</p>
            </div>

            {/* Reflection — only at exercises 5 and 10 */}
            {showReflect&&(
              <div style={{background:"#f0fdf4",borderRadius:14,padding:"14px 18px",marginBottom:16,border:"1px solid #bbf7d0"}}>
                <p style={{fontSize:14,fontWeight:700,color:"#15803d",margin:"0 0 10px"}}>🧠 {reflectQ}</p>
                {!reflectSaved
                  ?<>
                    <textarea placeholder="Escribí tu respuesta… (optativo)" value={reflectAns} onChange={e=>setReflectAns(e.target.value)} style={{width:"100%",padding:"10px 12px",borderRadius:12,border:"2px solid #86efac",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",resize:"none",minHeight:60,marginBottom:8}}/>
                    <div style={{display:"flex",gap:8}}>
                      {reflectAns.trim()&&<button onClick={saveReflection} style={{...sbtn("#16a34a"),flex:1,fontSize:13,padding:"9px"}}>Guardar ✓</button>}
                      <button onClick={handleContinue} style={{...sbtn("#f1f5f9"),flex:1,color:"#475569",fontSize:13,padding:"9px"}}>Seguir →</button>
                    </div>
                  </>
                  :<>
                    <div style={{background:"#dcfce7",borderRadius:10,padding:"10px 14px",textAlign:"center",marginBottom:10}}>
                      <p style={{color:"#15803d",fontWeight:800,margin:"0 0 2px",fontSize:13}}>✨ ¡Guardado!</p>
                      <p style={{color:"#16a34a",fontSize:11,margin:0}}>Tu profe lo va a ver después 📊</p>
                    </div>
                    <button onClick={handleContinue} style={{...sbtn(`linear-gradient(135deg,${game.color},${game.color}cc)`),width:"100%"}}>Seguir →</button>
                  </>
                }
              </div>
            )}

            {!showReflect&&(
              <button onClick={handleContinue} style={{...sbtn(`linear-gradient(135deg,${game.color},${game.color}cc)`),width:"100%",fontSize:17}}>
                {cil>=5?"¡Completé el nivel! 🏆":"Seguir →"}
              </button>
            )}
          </div>
        )}
      </div>

      <p style={{color:"#64748b",fontSize:12,marginTop:14}}>
        {student.name} · {game.emoji} Nivel {level} · <span style={{color:game.color,fontWeight:700}}>{cil}/5</span>
      </p>
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen]       = useState("home");
  const [teacher,setTeacher]     = useState(null);
  const [student,setStudent]     = useState(null);
  const [gameSession,setGameSession] = useState(null);
  return (
    <>
      {screen==="home"             &&<Home go={setScreen}/>}
      {screen==="teacher-login"    &&<TeacherLogin go={setScreen} setTeacher={setTeacher}/>}
      {screen==="teacher-dashboard"&&<TeacherDashboard go={setScreen}/>}
      {screen==="student-enter"    &&<StudentEnter go={setScreen} setStudent={setStudent}/>}
      {screen==="game-menu"        &&student&&<GameMenu student={student} go={setScreen} setGameSession={setGameSession}/>}
      {screen==="game-player"      &&student&&gameSession&&<GamePlayer student={student} gameSession={gameSession} go={setScreen}/>}
    </>
  );
}
