import { useState, useRef, useEffect } from "react";

const SUPABASE_URL = "https://ckzcgtwdyuqdtaziqsfb.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNremNndHdkeXVxZHRhemlxc2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NTEyMjQsImV4cCI6MjA5MjEyNzIyNH0.d6uDSRhVOBl2BriIUTE43vA042mYPSRqCL95AqtIn6U";
const TEACHER_CODE = "DANI2025";
const pick = a => a[Math.floor(Math.random() * a.length)];
const rnd  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

async function db({ table, method = "GET", body, filters = "", upsertOn = "" }) {
  try {
    const h = { "Content-Type": "application/json", "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` };
    if (method === "POST") h["Prefer"] = upsertOn ? "resolution=merge-duplicates,return=representation" : "return=representation";
    const url = `${SUPABASE_URL}/rest/v1/${table}${upsertOn ? `?on_conflict=${upsertOn}` : ""}${filters}`;
    const r = await fetch(url, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    return r.json();
  } catch { return null; }
}

// ─── GAMES CONFIG ─────────────────────────────────────────────────────────
const GAMES = [
  { id: "ceros", name: "Los Ceros Mágicos",  color: "#3B82F6", levels: 4, desc: "Multiplicación y división por múltiplos de 10" },
  { id: "orden", name: "El Gran Orden",       color: "#10B981", levels: 4, desc: "Ordenar y comparar números hasta 9.999" },
  { id: "falta", name: "¿Qué número falta?",  color: "#F59E0B", levels: 4, desc: "Encontrá el factor o dividendo que falta" },
  { id: "valor", name: "Valor posicional",     color: "#8B5CF6", levels: 4, desc: "Unidades de mil, centenas, decenas y unidades" },
];

// ─── THINK MODALS ─────────────────────────────────────────────────────────
const THINK_MODALS = {
  ceros: ["¿Multiplicar por 10 siempre agrega un cero al resultado?","¿Dividir entre 10 siempre quita un cero?","¿200 × 3 es lo mismo que 2 × 300?"],
  orden: ["¿Todos los números de 4 cifras son mayores que cualquier número de 3 cifras?","¿Cuál es el número más chico de 4 cifras que existe?","¿Dos números distintos pueden ocupar el mismo lugar en la recta numérica?"],
  falta: ["¿La multiplicación y la división son operaciones inversas?","¿Si conocés el resultado y uno de los factores, podés encontrar el otro?"],
  valor: ["¿El mismo dígito puede valer distinto según su posición?","¿En 3.456, el dígito 3 representa miles?","¿Cuál es el número más grande que se puede escribir con los dígitos 1, 2, 3 y 4?"],
};

// ─── CONTEXTUAL GUIDES (no input, affirmations + reflective questions) ────
// Each guide is an array of slides: { type: "info"|"question", text }
function buildGuides(gameId, level, prob, wrongAnswer) {
  if (gameId === "valor") {
    if (level === 1) {
      const num = prob._num || 0;
      const d = String(num).split("").map(Number);
      const posName = prob._posName || "unidades de mil";
      const correctVal = prob._correctVal || 0;
      const wrongNum = parseInt(wrongAnswer) || 0;

      // Determine what the student got wrong
      const isWrongByOneOff = Math.abs(wrongNum - correctVal) === 1;
      const isConfusedWithNeighbor = !isWrongByOneOff && wrongNum > 0 && wrongNum <= 9;

      if (posName === "unidades de mil") {
        return pick([
          [
            { type: "info",     text: `Todo número de 4 cifras tiene: unidades de mil, centenas, decenas y unidades.` },
            { type: "info",     text: `En el número ${num}, el primer dígito es el ${d[0]}.` },
            { type: "question", text: `¿Cuántas unidades de mil tiene el ${num}?` },
          ],
          [
            { type: "info",     text: `Las unidades de mil son el primer dígito, el de la izquierda.` },
            { type: "info",     text: `El número ${num} empieza con ${d[0]}.` },
            { type: "question", text: `¿Cuál es el primer dígito del ${num}?` },
          ],
        ]);
      }
      if (posName === "centenas") {
        return pick([
          [
            { type: "info",     text: `Las centenas están en la segunda posición de izquierda a derecha.` },
            { type: "info",     text: `El número ${num} se lee: ${d[0]} unidades de mil, ${d[1]} centenas, ${d[2]} decenas, ${d[3]} unidades.` },
            { type: "question", text: `¿Cuántas centenas aparecen en el ${num}?` },
          ],
          [
            { type: "info",     text: `Para encontrar las centenas, contá desde la izquierda: el primer dígito son miles, el segundo son centenas.` },
            { type: "question", text: `En el número ${num}, ¿qué dígito ocupa el segundo lugar?` },
          ],
        ]);
      }
      if (posName === "decenas") {
        return [
          { type: "info",     text: `Las decenas están en el tercer lugar contando desde la izquierda.` },
          { type: "info",     text: `En el ${num}: ${d[0]} miles · ${d[1]} centenas · ${d[2]} decenas · ${d[3]} unidades.` },
          { type: "question", text: `¿Cuál es el tercer dígito del número ${num}?` },
        ];
      }
      // unidades
      return [
        { type: "info",     text: `Las unidades siempre están en el último lugar, a la derecha del todo.` },
        { type: "info",     text: `El ${num} termina en ${d[3]}.` },
        { type: "question", text: `¿Cuántas unidades tiene el número ${num}?` },
      ];
    }

    if (level === 2) {
      return pick([
        [
          { type: "info",     text: `Descomponer un número significa separarlo en sus partes: miles, centenas, decenas y unidades.` },
          { type: "info",     text: `Ejemplo: 3456 = 3000 + 400 + 50 + 6` },
          { type: "question", text: `¿Podés identificar cuántos miles, centenas, decenas y unidades tiene este número?` },
        ],
        [
          { type: "info",     text: `Cada dígito tiene un valor según su posición.` },
          { type: "info",     text: `Si el primer dígito es 5, vale 5000. Si el segundo es 3, vale 300.` },
          { type: "question", text: `¿Cuánto vale cada dígito de este número?` },
        ],
      ]);
    }

    if (level === 3) {
      return [
        { type: "info",     text: `Para armar un número desde su descripción, sumá cada parte.` },
        { type: "info",     text: `Ejemplo: 2 unidades de mil + 3 centenas + 4 decenas + 5 unidades = 2000 + 300 + 40 + 5 = 2345` },
        { type: "question", text: `¿Cuánto es la suma de todas las partes de este número?` },
      ];
    }

    if (level === 4) {
      return pick([
        [
          { type: "info",     text: `Para saber cuál número es mayor, empezá por la posición más importante: las unidades de mil.` },
          { type: "question", text: `¿Cuántas unidades de mil tiene cada número?` },
        ],
        [
          { type: "info",     text: `Si los miles son iguales, comparás las centenas. Si las centenas también son iguales, pasás a las decenas.` },
          { type: "question", text: `¿En qué posición empiezan a diferir los dos números?` },
        ],
        [
          { type: "info",     text: `Un número con más unidades de mil siempre es mayor, sin importar las demás cifras.` },
          { type: "info",     text: `Ejemplo: 4.100 > 3.999 porque 4 miles > 3 miles.` },
          { type: "question", text: `¿Cuál de los dos números tiene más unidades de mil?` },
        ],
      ]);
    }
  }

  if (gameId === "ceros") {
    if (level <= 2) {
      const expr = prob.expr || "";
      return pick([
        [
          { type: "info",     text: `Multiplicar por un número con ceros se puede hacer en dos pasos.` },
          { type: "info",     text: `Primero multiplicás los dígitos sin ceros, después agregás los ceros.` },
          { type: "question", text: `¿Cuántos ceros tiene uno de los números de esta operación?` },
        ],
        [
          { type: "info",     text: `Los ceros al final de un número indican que estás multiplicando por 10, 100 o 1000.` },
          { type: "question", text: `¿Cuántas veces multiplicaste por 10 en esta operación?` },
        ],
      ]);
    }
    return [
      { type: "info",     text: `Dividir entre un número con ceros también se hace en dos pasos.` },
      { type: "info",     text: `Primero dividís los dígitos sin ceros, después quitás los ceros del resultado.` },
      { type: "question", text: `¿Cuántos ceros tiene el divisor de esta operación?` },
    ];
  }

  if (gameId === "orden") {
    return pick([
      [
        { type: "info",     text: `Un número con más cifras siempre es mayor que uno con menos cifras.` },
        { type: "question", text: `¿Todos los números de esta lista tienen la misma cantidad de cifras?` },
      ],
      [
        { type: "info",     text: `Si dos números tienen la misma cantidad de cifras, compará dígito por dígito de izquierda a derecha.` },
        { type: "question", text: `¿En qué posición difieren estos números?` },
      ],
    ]);
  }

  if (gameId === "falta") {
    return pick([
      [
        { type: "info",     text: `La multiplicación y la división son operaciones inversas.` },
        { type: "info",     text: `Si A × B = C, entonces C ÷ B = A.` },
        { type: "question", text: `¿Qué operación inversa podrías usar para encontrar el número que falta?` },
      ],
      [
        { type: "info",     text: `Para encontrar un factor que falta, podés usar la división.` },
        { type: "question", text: `¿Cuánto da el resultado si lo dividís por el número que sí conocés?` },
      ],
    ]);
  }

  return [{ type: "info", text: "Revisá el enunciado con calma e intentalo de nuevo." }];
}

// ─── GENERATORS ──────────────────────────────────────────────────────────
function genCeros(lv) {
  const z = lv <= 2 ? rnd(1, 2) : rnd(2, 3), pow = Math.pow(10, z);
  if (lv === 1 || lv === 3 || (lv === 4 && Math.random() > 0.5)) {
    const a = rnd(2, 9) * pow, b = rnd(2, 9), base = a / pow;
    return {
      type: "input", expr: `${a} × ${b}`, answer: String(a * b),
      displayAns: `${a} × ${b} = ${a * b}`,
      feedbackOk:    `Correcto. ${a} × ${b} = ${a * b}.`,
      feedbackWrong: `No es correcto. Primero calculá ${base} × ${b}, después pensá en los ceros del ${a}.`,
    };
  }
  const q = rnd(2, 9), d = rnd(2, 9), dividend = q * d * pow;
  return {
    type: "input", expr: `${dividend} ÷ ${d}`, answer: String(q * pow),
    displayAns: `${dividend} ÷ ${d} = ${q * pow}`,
    feedbackOk:    `Correcto. ${dividend} ÷ ${d} = ${q * pow}.`,
    feedbackWrong: `No es correcto. Primero calculá ${q * d} ÷ ${d}, después pensá en los ceros.`,
  };
}

function genOrden(lv) {
  const count = lv <= 2 ? 4 : 5, min = lv === 1 ? 100 : 1000, max = lv === 1 ? 999 : 9999;
  let nums = new Set();
  while (nums.size < count) nums.add(rnd(min, max));
  nums = [...nums];
  const sorted = [...nums].sort((a, b) => a - b);
  let shuffled = [...nums].sort(() => Math.random() - 0.5);
  let tries = 0;
  while (JSON.stringify(shuffled) === JSON.stringify(sorted) && tries < 20) { shuffled = [...nums].sort(() => Math.random() - 0.5); tries++; }
  return {
    type: "order", nums: shuffled, answer: [...sorted],
    displayAns: sorted.join(" < "),
    feedbackOk:    `Correcto. El orden de menor a mayor es: ${sorted.join(" < ")}.`,
    feedbackWrong: `No es correcto. Revisá tu respuesta y volvé a intentarlo.`,
  };
}

function genFalta(lv) {
  const z = lv <= 2 ? 1 : rnd(1, 2), pow = Math.pow(10, z);
  if (lv <= 2) {
    const a = rnd(2, 9) * pow, b = rnd(2, 9), result = a * b, hideA = Math.random() > 0.5;
    return {
      type: "input",
      expr: hideA ? `___ × ${b} = ${result}` : `${a} × ___ = ${result}`,
      answer: hideA ? String(a) : String(b),
      displayAns: `${a} × ${b} = ${result}`,
      feedbackOk:    `Correcto. ${a} × ${b} = ${result}.`,
      feedbackWrong: `No es correcto. Pensá en la operación inversa: ¿cuánto es ${result} ÷ ${hideA ? b : a}?`,
    };
  }
  const q = rnd(2, 9), d = rnd(2, 9), dividend = q * d * pow, result = q * pow, hideD = Math.random() > 0.5;
  return {
    type: "input",
    expr: hideD ? `${dividend} ÷ ___ = ${result}` : `___ ÷ ${d} = ${result}`,
    answer: hideD ? String(d) : String(dividend),
    displayAns: `${dividend} ÷ ${d} = ${result}`,
    feedbackOk:    `Correcto. ${dividend} ÷ ${d} = ${result}.`,
    feedbackWrong: `No es correcto. Usá la operación inversa para encontrar el número que falta.`,
  };
}

function genValor(lv) {
  if (lv === 1) {
    const num = rnd(1000, 9999);
    const d = String(num).split("").map(Number);
    const POS = [
      { name: "unidades de mil", idx: 0 },
      { name: "centenas",        idx: 1 },
      { name: "decenas",         idx: 2 },
      { name: "unidades",        idx: 3 },
    ];
    const p = pick(POS.filter(p => d[p.idx] !== 0));
    return {
      type: "input",
      expr: `En el número ${num}, ¿cuántas ${p.name} hay?`,
      answer: String(d[p.idx]),
      displayAns: `El ${num} tiene ${d[p.idx]} ${p.name}.`,
      feedbackOk:    `Correcto. El ${num} tiene ${d[p.idx]} ${p.name}.`,
      feedbackWrong: `No es correcto. Volvé a intentarlo.`,
      _num: num, _posName: p.name, _correctVal: d[p.idx],
    };
  }

  if (lv === 2) {
    const num = rnd(1000, 9999);
    const d = String(num).split("").map(Number);
    const parts = [], labels = [];
    if (d[0]) { parts.push(d[0] * 1000); labels.push(`${d[0]}000`); }
    if (d[1]) { parts.push(d[1] * 100);  labels.push(`${d[1]}00`); }
    if (d[2]) { parts.push(d[2] * 10);   labels.push(`${d[2]}0`); }
    if (d[3]) { parts.push(d[3]);         labels.push(`${d[3]}`); }
    const answer = labels.join("+");
    return {
      type: "input", flexible: true,
      expr: `Descomponé el ${num}`,
      placeholder: `Ejemplo: ${labels[0]}+${labels[1] || "0"}`,
      answer,
      displayAns: `${num} = ${labels.join(" + ")}`,
      feedbackOk:    `Correcto. ${num} = ${labels.join(" + ")}.`,
      feedbackWrong: `No es correcto. Escribí cada parte y sumalas con + sin espacios. Ejemplo: 8000+500`,
      _num: num,
    };
  }

  if (lv === 3) {
    const num = rnd(1000, 9999);
    const d = String(num).split("").map(Number);
    const labels = [];
    if (d[0]) labels.push(`${d[0]} unidades de mil`);
    if (d[1]) labels.push(`${d[1]} centenas`);
    if (d[2]) labels.push(`${d[2]} decenas`);
    if (d[3]) labels.push(`${d[3]} unidades`);
    return {
      type: "input",
      expr: `¿Qué número se forma con ${labels.join(", ")}?`,
      answer: String(num),
      displayAns: `El número es ${num}.`,
      feedbackOk:    `Correcto. ${labels.join(", ")} forman el número ${num}.`,
      feedbackWrong: `No es correcto. Sumá cada parte: ${d[0] * 1000} + ${d[1] * 100} + ${d[2] * 10} + ${d[3]}.`,
      _num: num,
    };
  }

  // lv === 4: visual comparison - NO < >
  const subLevel = rnd(1, 4);
  if (subLevel <= 2) {
    // "¿Cuál es mayor?" with 2 numbers
    const a = rnd(1000, 9999), b = rnd(1000, 9999);
    if (a === b) return genValor(4);
    const question = subLevel === 1 ? "¿Cuál es el número mayor?" : "¿Cuál es el número menor?";
    const correctAnswer = subLevel === 1 ? String(Math.max(a, b)) : String(Math.min(a, b));
    return {
      type: "pick2",
      question,
      options: [a, b],
      answer: correctAnswer,
      displayAns: subLevel === 1 ? `${Math.max(a, b)} es el mayor.` : `${Math.min(a, b)} es el menor.`,
      feedbackOk:    subLevel === 1 ? `Correcto. ${Math.max(a, b)} es mayor que ${Math.min(a, b)}.` : `Correcto. ${Math.min(a, b)} es menor que ${Math.max(a, b)}.`,
      feedbackWrong: `No es correcto. Revisá la posición de cada dígito.`,
    };
  }
  if (subLevel === 3) {
    // Order 3 numbers from greatest to least
    let nums = new Set(); while (nums.size < 3) nums.add(rnd(1000, 9999)); nums = [...nums];
    const sorted = [...nums].sort((a, b) => b - a);
    let shuffled = [...nums].sort(() => Math.random() - 0.5);
    return {
      type: "order", nums: shuffled, answer: [...sorted],
      question: "Ordená de mayor a menor",
      displayAns: `${sorted.join(" > ")}`,
      feedbackOk:    `Correcto. De mayor a menor: ${sorted.join(" > ")}.`,
      feedbackWrong: `No es correcto. Empezá por el número con más unidades de mil.`,
      descending: true,
    };
  }
  // subLevel === 4: Order 4 numbers
  let nums4 = new Set(); while (nums4.size < 4) nums4.add(rnd(1000, 9999)); nums4 = [...nums4];
  const sorted4 = [...nums4].sort((a, b) => b - a);
  let shuffled4 = [...nums4].sort(() => Math.random() - 0.5);
  return {
    type: "order", nums: shuffled4, answer: [...sorted4],
    question: "Ordená de mayor a menor",
    displayAns: `${sorted4.join(" > ")}`,
    feedbackOk:    `Correcto. De mayor a menor: ${sorted4.join(" > ")}.`,
    feedbackWrong: `No es correcto. Comparalos dígito por dígito.`,
    descending: true,
  };
}

const GENS = { ceros: genCeros, orden: genOrden, falta: genFalta, valor: genValor };

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────
const T = {
  white:"#FFFFFF", bg:"#F8FAFC", border:"#E2E8F0",
  text:"#1E293B", muted:"#64748B", hint:"#94A3B8",
  success:"#16A34A", successBg:"#F0FDF4",
  error:"#DC2626", errorBg:"#FEF2F2",
  infoBg:"#EFF6FF", infoText:"#1D4ED8", infoBorder:"#BFDBFE",
  radius:20, radiusSm:12,
};
const S = {
  page:(bg=T.bg)=>({minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:bg,padding:20,fontFamily:"'Inter','Nunito',system-ui,sans-serif"}),
  card:{background:T.white,borderRadius:T.radius,padding:"36px 32px",maxWidth:480,width:"100%",boxShadow:"0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.08)",border:`1px solid ${T.border}`},
  input:{width:"100%",padding:"12px 16px",borderRadius:T.radiusSm,border:`1.5px solid ${T.border}`,fontSize:16,fontFamily:"inherit",outline:"none",boxSizing:"border-box",color:T.text,background:T.white,transition:"border-color 0.15s",display:"block"},
  btn:(color="#1E293B",variant="filled",ex={})=>({padding:"11px 20px",borderRadius:T.radiusSm,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",border:variant==="outline"?`1.5px solid ${color}`:"none",background:variant==="filled"?color:"transparent",color:variant==="filled"?"#fff":color,...ex}),
};

// ─── GUIDE MODAL ──────────────────────────────────────────────────────────
function GuideModal({ slides, onClose }) {
  const [step, setStep] = useState(0);
  const slide = slides[step];
  const isLast = step === slides.length - 1;
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,backdropFilter:"blur(4px)" }}>
      <div style={{ background:T.white,borderRadius:T.radius,padding:"32px 28px",maxWidth:400,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",border:`1px solid ${T.border}` }}>
        {/* Header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <span style={{ fontSize:12,fontWeight:600,color:T.hint,textTransform:"uppercase",letterSpacing:0.5 }}>
            Guía ({step + 1} de {slides.length})
          </span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:T.hint,fontSize:18,lineHeight:1,padding:4 }}>✕</button>
        </div>
        {/* Progress dots */}
        <div style={{ display:"flex",gap:6,marginBottom:24 }}>
          {slides.map((_,i)=>(
            <div key={i} style={{ height:4,flex:1,borderRadius:99,background:i<=step?T.infoText:T.border,transition:"background 0.2s" }}/>
          ))}
        </div>
        {/* Content */}
        <div style={{ background:slide.type==="question"?"#F5F3FF":T.infoBg,borderRadius:T.radiusSm,padding:"18px 20px",marginBottom:28,minHeight:80,display:"flex",alignItems:"center" }}>
          <p style={{ fontSize:17,fontWeight:slide.type==="question"?600:500,color:slide.type==="question"?"#6D28D9":T.infoText,margin:0,lineHeight:1.6 }}>
            {slide.type==="question"?"🤔 ":"💡 "}{slide.text}
          </p>
        </div>
        {/* Buttons */}
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={onClose} style={S.btn(T.border,"filled",{color:T.muted,flex:1})}>Salir</button>
          {isLast
            ? <button onClick={onClose} style={S.btn("#334155","filled",{flex:2})}>Intentar nuevamente</button>
            : <button onClick={()=>setStep(s=>s+1)} style={S.btn(T.infoText,"filled",{flex:2})}>Siguiente →</button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── THINK MODAL ──────────────────────────────────────────────────────────
function ThinkModal({ text, onClose }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,backdropFilter:"blur(4px)" }}>
      <div style={{ background:T.white,borderRadius:T.radius,padding:"32px 28px",maxWidth:400,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",border:`1px solid ${T.border}` }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}>
          <span style={{ background:T.infoBg,color:T.infoText,borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:600 }}>Para pensar</span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:T.hint,fontSize:18,lineHeight:1,padding:4 }}>✕</button>
        </div>
        <p style={{ fontSize:18,fontWeight:600,color:T.text,lineHeight:1.5,margin:"0 0 24px" }}>{text}</p>
        <button onClick={onClose} style={S.btn("#1E293B","filled",{width:"100%"})}>Cerrar y seguir jugando</button>
      </div>
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────
function Home({ go }) {
  return (
    <div style={S.page()}>
      <div style={{ ...S.card, textAlign:"center" }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:40,marginBottom:12 }}>🎓</div>
          <h1 style={{ fontSize:26,fontWeight:700,color:T.text,margin:"0 0 8px" }}>MateJuegos</h1>
          <p style={{ color:T.muted,fontSize:14,margin:0 }}>Plataforma de matemática · 4to grado</p>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          <button onClick={()=>go("teacher-login")} style={S.btn("#334155","filled",{width:"100%",padding:"14px",fontSize:15})}>Panel docente</button>
          <button onClick={()=>go("student-enter")} style={S.btn("#3B82F6","filled",{width:"100%",padding:"14px",fontSize:15})}>Ingresar como alumno</button>
        </div>
      </div>
    </div>
  );
}

// ─── TEACHER LOGIN ────────────────────────────────────────────────────────
function TeacherLogin({ go, setTeacher }) {
  const [code,setCode]=useState(""), [err,setErr]=useState("");
  const login=()=>{if(code.trim().toUpperCase()===TEACHER_CODE){setTeacher({});go("teacher-dashboard");}else setErr("Código incorrecto.");};
  return (
    <div style={S.page()}>
      <div style={S.card}>
        <button onClick={()=>go("home")} style={{ background:"none",border:"none",color:T.hint,cursor:"pointer",fontSize:13,marginBottom:24,padding:0 }}>← Volver</button>
        <h2 style={{ fontSize:22,fontWeight:700,color:T.text,margin:"0 0 24px" }}>Acceso docente</h2>
        <input style={S.input} placeholder="Código de acceso" value={code} maxLength={12} type="password" onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&login()}/>
        {err&&<p style={{ color:T.error,fontSize:13,margin:"8px 0 0" }}>{err}</p>}
        <button style={S.btn("#334155","filled",{width:"100%",marginTop:12})} onClick={login}>Ingresar</button>
      </div>
    </div>
  );
}

// ─── TEACHER DASHBOARD ────────────────────────────────────────────────────
function TeacherDashboard({ go }) {
  const [classes,setClasses]=useState([]), [selected,setSelected]=useState(null);
  const [newName,setNewName]=useState(""), [loading,setLoading]=useState(true), [creating,setCreating]=useState(false);
  const [tab,setTab]=useState("results");
  const [results,setResults]=useState([]), [reflections,setRef]=useState([]), [attempts,setAttempts]=useState([]);
  const [assignments,setAssignments]=useState([]), [loadingData,setLoadingData]=useState(false);
  useEffect(()=>{loadClasses();},[]);
  const loadClasses=async()=>{setLoading(true);const d=await db({table:"classes",filters:"?order=created_at.desc"});if(Array.isArray(d))setClasses(d);setLoading(false);};
  const selectClass=async(cls)=>{
    setSelected(cls);setLoadingData(true);setTab("results");
    const [res,refs,att,ass]=await Promise.all([
      db({table:"game_results",filters:`?class_code=eq.${cls.code}&order=played_at.desc`}),
      db({table:"reflections",filters:`?class_code=eq.${cls.code}&order=created_at.desc`}),
      db({table:"exercise_attempts",filters:`?class_code=eq.${cls.code}&order=played_at.desc`}),
      db({table:"game_assignments",filters:`?class_code=eq.${cls.code}`}),
    ]);
    if(Array.isArray(res))setResults(res);if(Array.isArray(refs))setRef(refs);
    if(Array.isArray(att))setAttempts(att);if(Array.isArray(ass))setAssignments(ass);
    setLoadingData(false);
  };
  const createClass=async()=>{
    if(!newName.trim())return;setCreating(true);
    const cls=await db({table:"classes",method:"POST",body:{teacher_email:"dani",name:newName.trim(),code:genCode()}});
    if(Array.isArray(cls)&&cls[0]){const code=cls[0].code;await Promise.all(GAMES.map(g=>db({table:"game_assignments",method:"POST",body:{class_code:code,game_id:g.id,enabled:true}})));}
    setNewName("");await loadClasses();setCreating(false);
  };
  const toggleGame=async(gameId,enabled)=>{
    await db({table:"game_assignments",method:"POST",upsertOn:"class_code,game_id",body:{class_code:selected.code,game_id:gameId,enabled:!enabled}});
    setAssignments(prev=>{const e=prev.find(a=>a.game_id===gameId);return e?prev.map(a=>a.game_id===gameId?{...a,enabled:!enabled}:a):[...prev,{game_id:gameId,enabled:!enabled}];});
  };
  const isEnabled=gid=>{const a=assignments.find(a=>a.game_id===gid);return a?a.enabled:true;};
  const gameResults=results.reduce((acc,r)=>{if(!acc[r.student_name])acc[r.student_name]={};acc[r.student_name][r.game_id]={score:r.score,correct:r.correct_count,wrong:r.wrong_count};return acc;},{});
  const attStats=attempts.reduce((acc,a)=>{const k=`${a.student_name}||${a.game_id}`;if(!acc[k])acc[k]={student:a.student_name,game:a.game_id,total:0,hints:0,failed:0};acc[k].total++;acc[k].hints+=a.hints_used||0;if(!a.solved)acc[k].failed++;return acc;},{});
  const students=[...new Set([...results.map(r=>r.student_name),...reflections.map(r=>r.student_name)])];
  return (
    <div style={{ minHeight:"100vh",background:T.bg,fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ background:"#1E293B",color:"white",padding:"16px 24px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div><div style={{ fontSize:11,color:"#94A3B8",textTransform:"uppercase",letterSpacing:1,fontWeight:600 }}>Panel docente</div><div style={{ fontSize:18,fontWeight:700 }}>MateJuegos</div></div>
        <button onClick={()=>go("home")} style={S.btn("#334155","filled",{fontSize:13})}>Salir</button>
      </div>
      <div style={{ maxWidth:960,margin:"0 auto",padding:"24px 16px",display:"grid",gridTemplateColumns:"260px 1fr",gap:20,alignItems:"start" }}>
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <div style={{ background:T.white,borderRadius:T.radius,padding:20,border:`1px solid ${T.border}` }}>
            <h3 style={{ margin:"0 0 14px",color:T.text,fontWeight:700,fontSize:14 }}>Nueva clase</h3>
            <input style={{ ...S.input,marginBottom:10 }} placeholder="Nombre (ej: 4to A)" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createClass()}/>
            <button onClick={createClass} disabled={creating||!newName.trim()} style={S.btn("#334155","filled",{width:"100%",opacity:creating||!newName.trim()?0.5:1})}>{creating?"Creando...":"Crear clase"}</button>
          </div>
          <div style={{ background:T.white,borderRadius:T.radius,padding:20,border:`1px solid ${T.border}` }}>
            <h3 style={{ margin:"0 0 14px",color:T.text,fontWeight:700,fontSize:14 }}>Mis clases</h3>
            {loading&&<p style={{ color:T.hint,fontSize:13 }}>Cargando...</p>}
            {!loading&&classes.length===0&&<p style={{ color:T.hint,fontSize:13 }}>No hay clases todavía.</p>}
            {classes.map(cls=>(
              <div key={cls.id} onClick={()=>selectClass(cls)} style={{ border:`1.5px solid ${selected?.id===cls.id?"#3B82F6":T.border}`,borderRadius:T.radiusSm,padding:"12px 14px",marginBottom:8,cursor:"pointer",background:selected?.id===cls.id?"#EFF6FF":T.white,transition:"all 0.15s" }}>
                <div style={{ fontWeight:600,color:T.text,fontSize:14,marginBottom:4 }}>{cls.name}</div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span style={{ color:T.hint,fontSize:11 }}>{new Date(cls.created_at).toLocaleDateString("es-AR")}</span>
                  <span style={{ background:"#EFF6FF",color:T.infoText,borderRadius:6,padding:"2px 8px",fontWeight:700,fontSize:12,letterSpacing:1 }}>{cls.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          {!selected&&<div style={{ background:T.white,borderRadius:T.radius,padding:48,textAlign:"center",border:`1px solid ${T.border}` }}><p style={{ color:T.hint,fontWeight:500,margin:0 }}>Seleccioná una clase para ver los datos</p></div>}
          {selected&&(
            <div style={{ background:T.white,borderRadius:T.radius,padding:24,border:`1px solid ${T.border}` }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20 }}>
                <div><h3 style={{ margin:"0 0 4px",color:T.text,fontWeight:700 }}>{selected.name}</h3><p style={{ margin:0,color:T.hint,fontSize:12 }}>Código: <strong style={{ color:T.infoText }}>{selected.code}</strong></p></div>
                <button onClick={()=>selectClass(selected)} style={S.btn("#F1F5F9","filled",{color:T.muted,fontSize:12})}>Actualizar</button>
              </div>
              <div style={{ display:"flex",gap:6,marginBottom:20,borderBottom:`1px solid ${T.border}`,paddingBottom:0 }}>
                {["results","games","attempts","reflections"].map(t=>(
                  <button key={t} onClick={()=>setTab(t)} style={{ ...S.btn("transparent","filled",{color:tab===t?"#3B82F6":T.muted,borderRadius:"8px 8px 0 0",borderBottom:tab===t?"2px solid #3B82F6":"2px solid transparent",padding:"8px 14px",fontSize:13}) }}>
                    {t==="results"?"Resultados":t==="games"?"Juegos":t==="attempts"?"Intentos":"Reflexiones"}
                    {t==="reflections"&&reflections.length>0&&<span style={{ background:"#EF4444",color:"white",borderRadius:99,padding:"1px 6px",fontSize:10,marginLeft:4 }}>{reflections.length}</span>}
                  </button>
                ))}
              </div>
              {loadingData&&<p style={{ color:T.hint }}>Cargando...</p>}
              {!loadingData&&tab==="results"&&(
                <>
                  {students.length===0&&<p style={{ color:T.hint,textAlign:"center",padding:"32px 0" }}>Sin datos. Código: <strong style={{ color:T.infoText }}>{selected.code}</strong></p>}
                  {students.map(name=>(
                    <div key={name} style={{ background:T.bg,borderRadius:T.radiusSm,padding:"14px 16px",marginBottom:12 }}>
                      <div style={{ fontWeight:700,color:T.text,marginBottom:10 }}>{name}</div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                        {GAMES.map(g=>{const r=gameResults[name]?.[g.id];return(
                          <div key={g.id} style={{ background:T.white,borderRadius:T.radiusSm,padding:"10px 12px",border:`1px solid ${T.border}` }}>
                            <div style={{ fontSize:12,fontWeight:600,color:r?g.color:T.hint,marginBottom:r?6:0 }}>{g.name}</div>
                            {r?<div style={{ display:"flex",gap:10,fontSize:12 }}><span style={{ color:"#2563EB",fontWeight:700 }}>{r.score} pts</span><span style={{ color:T.success,fontWeight:700 }}>{r.correct} ✓</span><span style={{ color:T.error,fontWeight:700 }}>{r.wrong} ✗</span></div>:<div style={{ color:T.hint,fontSize:11 }}>Sin actividad</div>}
                          </div>
                        );})}
                      </div>
                    </div>
                  ))}
                </>
              )}
              {!loadingData&&tab==="games"&&(
                <div>{GAMES.map(g=>{const enabled=isEnabled(g.id);return(
                  <div key={g.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderRadius:T.radiusSm,border:`1px solid ${T.border}`,marginBottom:8,background:T.white }}>
                    <div><div style={{ fontWeight:600,color:T.text,fontSize:14 }}>{g.name}</div><div style={{ color:T.hint,fontSize:12,marginTop:2 }}>{g.desc}</div></div>
                    <button onClick={()=>toggleGame(g.id,enabled)} style={S.btn(enabled?T.success:T.hint,"filled",{fontSize:13,minWidth:80})}>{enabled?"Activo":"Inactivo"}</button>
                  </div>
                );})}</div>
              )}
              {!loadingData&&tab==="attempts"&&(
                <>
                  {Object.keys(attStats).length===0&&<p style={{ color:T.hint,textAlign:"center",padding:"32px 0" }}>Sin datos todavía.</p>}
                  {Object.values(attStats).map((s,i)=>{const game=GAMES.find(g=>g.id===s.game);return(
                    <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderRadius:T.radiusSm,border:`1px solid ${T.border}`,marginBottom:8,background:T.white }}>
                      <div><div style={{ fontWeight:600,color:T.text }}>{s.student}</div><div style={{ fontSize:12,color:T.hint,marginTop:2 }}>{game?.name}</div></div>
                      <div style={{ display:"flex",gap:16,textAlign:"center" }}>
                        <div><div style={{ fontWeight:700,color:"#2563EB",fontSize:16 }}>{s.total}</div><div style={{ fontSize:11,color:T.hint }}>intentos</div></div>
                        <div><div style={{ fontWeight:700,color:"#D97706",fontSize:16 }}>{s.hints}</div><div style={{ fontSize:11,color:T.hint }}>ayudas</div></div>
                        <div><div style={{ fontWeight:700,color:T.error,fontSize:16 }}>{s.failed}</div><div style={{ fontSize:11,color:T.hint }}>errores</div></div>
                      </div>
                    </div>
                  );})}
                </>
              )}
              {!loadingData&&tab==="reflections"&&(
                <>
                  {reflections.length===0&&<p style={{ color:T.hint,textAlign:"center",padding:"32px 0" }}>Sin reflexiones todavía.</p>}
                  {reflections.map((r,i)=>(
                    <div key={i} style={{ background:"#F5F3FF",borderRadius:T.radiusSm,padding:16,marginBottom:10,borderLeft:"3px solid #8B5CF6" }}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}><strong style={{ color:T.text,fontSize:14 }}>{r.student_name}</strong><span style={{ color:T.hint,fontSize:11 }}>{new Date(r.created_at).toLocaleDateString("es-AR")}</span></div>
                      <p style={{ color:T.muted,fontSize:13,margin:"0 0 4px",fontStyle:"italic" }}>"{r.question}"</p>
                      <p style={{ color:T.text,fontSize:14,margin:0,fontWeight:600 }}>{r.answer}</p>
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

// ─── STUDENT ENTER ────────────────────────────────────────────────────────
function StudentEnter({ go, setStudent }) {
  const [name,setName]=useState(""), [code,setCode]=useState(""), [err,setErr]=useState(""), [loading,setLoading]=useState(false);
  const enter=async()=>{
    if(!name.trim()||!code.trim()){setErr("Completá tu nombre y el código.");return;}
    setLoading(true);setErr("");
    const d=await db({table:"classes",filters:`?code=eq.${code.toUpperCase().trim()}`});
    if(Array.isArray(d)&&d.length>0){setStudent({name:name.trim(),classCode:code.toUpperCase().trim(),className:d[0].name});go("game-menu");}
    else setErr("Código no encontrado. Pedíselo a tu profe.");
    setLoading(false);
  };
  return (
    <div style={S.page("#EFF6FF")}>
      <div style={S.card}>
        <button onClick={()=>go("home")} style={{ background:"none",border:"none",color:T.hint,cursor:"pointer",fontSize:13,marginBottom:24,padding:0 }}>← Volver</button>
        <h2 style={{ fontSize:22,fontWeight:700,color:T.text,margin:"0 0 6px" }}>¡Hola!</h2>
        <p style={{ color:T.muted,fontSize:14,margin:"0 0 24px" }}>Ingresá tu nombre y el código de tu clase.</p>
        <label style={{ fontSize:13,fontWeight:600,color:T.text,display:"block",marginBottom:6 }}>Tu nombre</label>
        <input style={{ ...S.input,marginBottom:16 }} placeholder="Ej: Sofía" value={name} onChange={e=>setName(e.target.value)}/>
        <label style={{ fontSize:13,fontWeight:600,color:T.text,display:"block",marginBottom:6 }}>Código de clase</label>
        <input style={{ ...S.input,textTransform:"uppercase",letterSpacing:4,fontSize:20,fontWeight:700,textAlign:"center",marginBottom:16 }}
          placeholder="ABC123" maxLength={6} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&enter()}/>
        {err&&<p style={{ color:T.error,fontSize:13,margin:"0 0 12px" }}>{err}</p>}
        <button style={S.btn("#3B82F6","filled",{width:"100%",padding:"13px",fontSize:15})} onClick={enter} disabled={loading}>{loading?"Buscando...":"Ingresar"}</button>
      </div>
    </div>
  );
}

// ─── GAME MENU ────────────────────────────────────────────────────────────
function GameMenu({ student, go, setGameSession }) {
  const [progress,setProgress]=useState({});
  const [assignments,setAssignments]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{loadData();},[]);
  const loadData=async()=>{
    const [prog,ass]=await Promise.all([
      db({table:"student_progress",filters:`?class_code=eq.${student.classCode}&student_name=eq.${encodeURIComponent(student.name)}`}),
      db({table:"game_assignments",filters:`?class_code=eq.${student.classCode}`}),
    ]);
    if(Array.isArray(prog)){const p={};prog.forEach(r=>{p[r.game_id]={level:r.level_reached,completed:r.completed};});setProgress(p);}
    if(Array.isArray(ass))setAssignments(ass);
    setLoading(false);
  };
  const isEnabled=gid=>{if(assignments.length===0)return true;const a=assignments.find(a=>a.game_id===gid);return a?a.enabled:true;};
  const getLevelStatus=(gid,lv)=>{const reached=progress[gid]?.level||1;if(lv<reached)return"done";if(lv===reached)return"current";return"locked";};
  const startGame=(gid,lv)=>{setGameSession({gameId:gid,level:lv});go("game-player");};
  const enabledGames=GAMES.filter(g=>isEnabled(g.id));
  return (
    <div style={{ minHeight:"100vh",background:T.bg,fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ background:"#1E293B",color:"white",padding:"16px 24px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div><div style={{ fontSize:11,color:"#94A3B8",textTransform:"uppercase",letterSpacing:1,fontWeight:600 }}>{student.className}</div><div style={{ fontSize:18,fontWeight:700 }}>Hola, {student.name}</div></div>
        <button onClick={()=>go("home")} style={S.btn("#334155","filled",{fontSize:13})}>Salir</button>
      </div>
      {loading&&<div style={{ textAlign:"center",padding:48,color:T.hint }}>Cargando...</div>}
      {!loading&&(
        <div style={{ maxWidth:800,margin:"0 auto",padding:"24px 16px" }}>
          <h2 style={{ fontSize:18,fontWeight:700,color:T.text,marginBottom:20 }}>Elegí un juego</h2>
          {enabledGames.length===0&&<p style={{ color:T.hint }}>Tu docente todavía no activó ningún juego.</p>}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
            {enabledGames.map(game=>(
              <div key={game.id} style={{ background:T.white,borderRadius:T.radius,padding:24,border:`1px solid ${T.border}`,borderTop:`3px solid ${game.color}` }}>
                <h3 style={{ margin:"0 0 4px",color:T.text,fontWeight:700,fontSize:16 }}>{game.name}</h3>
                <p style={{ color:T.muted,fontSize:13,margin:"0 0 18px" }}>{game.desc}</p>
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {[1,2,3,4].map(lv=>{
                    const status=getLevelStatus(game.id,lv),isLocked=status==="locked",isDone=status==="done",isCurrent=status==="current";
                    return(
                      <button key={lv} onClick={()=>!isLocked&&startGame(game.id,lv)} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:T.radiusSm,border:`1px solid ${isLocked?T.border:isDone?"#D1FAE5":game.color}`,background:isLocked?T.bg:isDone?"#F0FDF4":`${game.color}12`,cursor:isLocked?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.15s" }}>
                        <span style={{ fontSize:13,minWidth:16,color:isLocked?T.hint:isDone?T.success:game.color }}>{isLocked?"🔒":isDone?"✓":"▶"}</span>
                        <div style={{ flex:1,textAlign:"left" }}>
                          <div style={{ fontWeight:600,fontSize:13,color:isLocked?T.hint:isDone?T.success:game.color }}>Nivel {lv} — {["Básico","Intermedio","Avanzado","Desafío"][lv-1]}</div>
                        </div>
                        {isDone&&<span style={{ fontSize:11,color:T.success,fontWeight:600 }}>Completo</span>}
                        {isCurrent&&<span style={{ background:game.color,color:"white",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600 }}>Jugar</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GAME PLAYER ──────────────────────────────────────────────────────────
function GamePlayer({ student, gameSession, go }) {
  const {gameId,level}=gameSession;
  const game=GAMES.find(g=>g.id===gameId);
  const gen=GENS[gameId];

  const [prob,setProb]               = useState(()=>gen(level));
  const [phase,setPhase]             = useState("question");
  const [answer,setAnswer]           = useState("");
  const [lastAnswer,setLastAnswer]   = useState("");
  const [orderSelected,setOrderSel]  = useState([]);
  const [wrongAnswer,setWrongAnswer] = useState("");
  const [guideSlides,setGuideSlides] = useState(null);
  const [thinkText,setThinkText]     = useState(null);
  const [reflectQ,setReflectQ]       = useState("");
  const [showReflect,setShowReflect] = useState(false);
  const [reflectAns,setReflectAns]   = useState("");
  const [reflectSaved,setReflectSaved]=useState(false);
  const [score,setScore]             = useState(0);
  const [correct,setCorrect]         = useState(0);
  const [wrong,setWrong]             = useState(0);
  const [cil,setCil]                 = useState(0);
  const [finished,setFinished]       = useState(false);
  const [saving,setSaving]           = useState(false);
  const [hintsUsed,setHintsUsed]     = useState(0);
  const [feedback,setFeedback]       = useState("");
  const totalEx = useRef(0);
  const inputRef = useRef(null);

  // Always focus input when question phase
  useEffect(()=>{
    if(phase==="question") setTimeout(()=>inputRef.current?.focus(),150);
  },[phase,prob]);

  const newProb=()=>{
    setProb(gen(level));setAnswer("");setLastAnswer("");setPhase("question");
    setGuideSlides(null);setWrongAnswer("");setReflectAns("");setReflectSaved(false);
    setShowReflect(false);setHintsUsed(0);setOrderSel([]);setFeedback("");
  };

  const isCorrect=(userAns)=>{
    if(prob.type==="order"||prob.type==="pick2") return String(userAns)===String(prob.answer);
    if(prob.flexible){const norm=s=>s.replace(/\s/g,"");return norm(String(userAns))===norm(String(prob.answer));}
    return String(userAns).trim()===String(prob.answer);
  };

  const checkAnswer=(val)=>{
    const userAns=val!==undefined?val:(prob.type==="order"?orderSelected:answer);
    const ok=isCorrect(userAns);
    db({table:"exercise_attempts",method:"POST",body:{class_code:student.classCode,student_name:student.name,game_id:gameId,level,exercise_expr:prob.expr||prob.question||"",attempts:1,hints_used:hintsUsed,solved:ok}});
    if(ok){
      totalEx.current++;
      const shouldReflect=totalEx.current%5===0;
      const showThink=totalEx.current%3===0&&!shouldReflect;
      setFeedback(prob.feedbackOk);
      if(shouldReflect){setReflectQ(pick(["¿Cómo llegaste a ese resultado?","¿Hay otra manera de resolverlo?","¿Esto siempre va a dar lo mismo?","¿Cómo se lo explicarías a un compañero?"]));setShowReflect(true);}
      if(showThink)setThinkText(pick(THINK_MODALS[gameId]));
      setScore(s=>s+10);setCorrect(c=>c+1);setCil(c=>c+1);
      setPhase("correct");
    } else {
      const wa=prob.type==="order"?JSON.stringify(orderSelected):String(val!==undefined?val:answer);
      setWrongAnswer(wa);setLastAnswer(prob.type==="order"?[...orderSelected]:answer);
      setFeedback(prob.feedbackWrong);setWrong(c=>c+1);
      setPhase("wrong");setOrderSel([]);
    }
  };

  const openGuide=()=>{
    setHintsUsed(h=>h+1);
    setGuideSlides(buildGuides(gameId,level,prob,wrongAnswer));
    setPhase("question");
  };

  const saveReflection=async()=>{
    if(!reflectAns.trim())return;
    await db({table:"reflections",method:"POST",body:{class_code:student.classCode,student_name:student.name,question:reflectQ,answer:reflectAns}});
    setReflectSaved(true);
  };

  const handleContinue=async()=>{
    if(cil>=5){
      setSaving(true);
      await Promise.all([
        db({table:"game_results",method:"POST",body:{class_code:student.classCode,student_name:student.name,game_id:gameId,game_name:game.name,score,correct_count:correct,wrong_count:wrong,level_reached:level}}),
        db({table:"student_progress",method:"POST",upsertOn:"class_code,student_name,game_id",body:{class_code:student.classCode,student_name:student.name,game_id:gameId,level_reached:level+1,exercises_completed:totalEx.current,completed:level>=4,last_played:new Date().toISOString()}}),
      ]);
      setSaving(false);setFinished(true);
    } else newProb();
  };

  const saveAndExit=async()=>{
    await db({table:"student_progress",method:"POST",upsertOn:"class_code,student_name,game_id",body:{class_code:student.classCode,student_name:student.name,game_id:gameId,level_reached:level,exercises_completed:totalEx.current,completed:false,last_played:new Date().toISOString()}});
    go("game-menu");
  };

  const pct=Math.min((cil/5)*100,100);

  // ── FINISHED ──
  if(finished) return (
    <div style={S.page()}>
      {thinkText&&<ThinkModal text={thinkText} onClose={()=>setThinkText(null)}/>}
      <div style={{ ...S.card,textAlign:"center" }}>
        <div style={{ width:56,height:56,background:T.successBg,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:24 }}>✓</div>
        <h2 style={{ fontSize:22,fontWeight:700,color:T.text,margin:"0 0 8px" }}>Nivel {level} completado</h2>
        {level<4&&<p style={{ color:T.success,fontSize:14,fontWeight:600,margin:"0 0 24px" }}>Desbloqueaste el Nivel {level+1}.</p>}
        {level>=4&&<p style={{ color:T.muted,fontSize:14,margin:"0 0 24px" }}>¡Completaste todos los niveles de este juego!</p>}
        <div style={{ background:T.bg,borderRadius:T.radiusSm,padding:"16px 20px",marginBottom:24,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
          <div><div style={{ fontSize:28,fontWeight:700,color:"#2563EB" }}>{score}</div><div style={{ fontSize:12,color:T.hint }}>puntos</div></div>
          <div><div style={{ fontSize:28,fontWeight:700,color:T.success }}>{correct}</div><div style={{ fontSize:12,color:T.hint }}>correctas</div></div>
          <div><div style={{ fontSize:28,fontWeight:700,color:T.error }}>{wrong}</div><div style={{ fontSize:12,color:T.hint }}>errores</div></div>
        </div>
        {saving?<p style={{ color:T.hint,fontSize:13,marginBottom:12 }}>Guardando progreso...</p>:<p style={{ color:T.success,fontSize:13,marginBottom:12,fontWeight:600 }}>Progreso guardado correctamente.</p>}
        <button style={S.btn("#334155","filled",{width:"100%"})} onClick={()=>go("game-menu")}>Volver a los juegos</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:`${game.color}08`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Inter',system-ui,sans-serif" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Modals */}
      {guideSlides&&<GuideModal slides={guideSlides} onClose={()=>setGuideSlides(null)}/>}
      {thinkText&&<ThinkModal text={thinkText} onClose={()=>setThinkText(null)}/>}

      {/* Header */}
      <div style={{ width:"100%",maxWidth:480,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
        <button onClick={saveAndExit} style={S.btn("#F1F5F9","filled",{color:T.muted,fontSize:13})}>← Volver al menú</button>
        <div style={{ display:"flex",gap:8 }}>
          <div style={{ background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radiusSm,padding:"6px 12px",fontWeight:600,color:T.success,fontSize:13 }}>{correct} correctas</div>
          <div style={{ background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radiusSm,padding:"6px 12px",fontWeight:600,color:"#2563EB",fontSize:13 }}>{score} pts</div>
        </div>
      </div>

      <div style={{ marginBottom:10,background:game.color,color:"white",borderRadius:T.radiusSm,padding:"5px 14px",fontWeight:600,fontSize:13 }}>
        {game.name} · Nivel {level}
      </div>

      {/* Progress */}
      <div style={{ width:"100%",maxWidth:480,marginBottom:16 }}>
        <div style={{ background:T.border,borderRadius:99,height:6,overflow:"hidden" }}>
          <div style={{ height:"100%",background:game.color,width:`${pct}%`,borderRadius:99,transition:"width 0.4s" }}/>
        </div>
        <div style={{ fontSize:11,color:T.hint,textAlign:"right",marginTop:4 }}>{cil} de 5 ejercicios</div>
      </div>

      <div style={{ ...S.card,maxWidth:480,animation:"fadeUp 0.2s ease" }}>

        {/* ── QUESTION ── */}
        {phase==="question"&&(
          <>
            <p style={{ textAlign:"center",color:T.hint,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:20 }}>
              {prob.type==="order"?(prob.question||"Ordená de menor a mayor"):prob.type==="pick2"?(prob.question||"¿Cuál es mayor?"):prob.type==="choice"?"Elegí el símbolo correcto":"Resolvé"}
            </p>

            {/* INPUT */}
            {prob.type==="input"&&(
              <>
                <div style={{ textAlign:"center",marginBottom:20 }}>
                  <p style={{ fontSize:prob.expr.length>40?16:24,fontWeight:700,color:T.text,margin:0,lineHeight:1.5 }}>
                    {prob.expr.includes("___")||prob.expr.includes("?")?prob.expr:`${prob.expr} =`}
                  </p>
                </div>
                {/* Always visible input — no fake line */}
                <input
                  ref={inputRef}
                  type="text"
                  inputMode={prob.flexible?"text":"numeric"}
                  placeholder={prob.placeholder||"Escribí el resultado"}
                  value={answer}
                  autoFocus
                  onChange={e=>setAnswer(prob.flexible?e.target.value:e.target.value.replace(/[^0-9]/g,""))}
                  onKeyDown={e=>e.key==="Enter"&&answer.trim()&&checkAnswer()}
                  style={{ ...S.input,fontSize:18,fontWeight:700,textAlign:"center",marginBottom:12,borderColor:answer?game.color:T.border }}
                />
                <button onClick={()=>answer.trim()&&checkAnswer()} disabled={!answer.trim()}
                  style={S.btn(answer.trim()?game.color:"#E2E8F0","filled",{width:"100%",color:answer.trim()?"white":T.hint,cursor:answer.trim()?"pointer":"not-allowed"})}>
                  Comprobar
                </button>
              </>
            )}

            {/* PICK 2 — visual comparison, no < > */}
            {prob.type==="pick2"&&(
              <>
                <p style={{ textAlign:"center",fontSize:14,color:T.muted,marginBottom:20 }}>{prob.question}</p>
                <div style={{ display:"flex",gap:16,justifyContent:"center" }}>
                  {prob.options.map((n,i)=>(
                    <button key={i} onClick={()=>checkAnswer(String(n))}
                      style={{ flex:1,padding:"24px 16px",borderRadius:T.radius,border:`2px solid ${T.border}`,background:T.white,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",fontSize:28,fontWeight:700,color:T.text }}>
                      {n}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ORDER */}
            {prob.type==="order"&&(
              <>
                <p style={{ textAlign:"center",fontSize:13,color:T.muted,marginBottom:14 }}>
                  {prob.descending?"Tocá los números de mayor a menor:":"Tocá los números de menor a mayor:"}
                </p>
                <div style={{ display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:16 }}>
                  {prob.nums.map((n,i)=>{
                    const selIdx=orderSelected.indexOf(n),sel=selIdx!==-1;
                    return(
                      <button key={i} onClick={()=>{if(sel)setOrderSel(orderSelected.filter(x=>x!==n));else setOrderSel([...orderSelected,n]);}}
                        style={S.btn(sel?game.color:"#F1F5F9","filled",{color:sel?"white":T.text,padding:"12px 16px",fontSize:18,fontWeight:700,minWidth:80,position:"relative"})}>
                        {n}
                        {sel&&<span style={{ position:"absolute",top:-8,right:-8,background:"#1E293B",color:"white",borderRadius:99,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700 }}>{selIdx+1}</span>}
                      </button>
                    );
                  })}
                </div>
                {orderSelected.length>0&&<div style={{ background:T.bg,borderRadius:T.radiusSm,padding:"10px 14px",marginBottom:12,fontSize:13,color:T.muted }}>Tu orden: {orderSelected.join(" → ")}</div>}
                <div style={{ display:"flex",gap:8 }}>
                  {orderSelected.length>0&&<button onClick={()=>setOrderSel([])} style={S.btn("#F1F5F9","filled",{flex:1,color:T.muted,fontSize:13})}>Borrar</button>}
                  <button onClick={()=>checkAnswer(orderSelected)} disabled={orderSelected.length!==prob.nums.length}
                    style={S.btn(orderSelected.length===prob.nums.length?game.color:"#E2E8F0","filled",{flex:2,color:orderSelected.length===prob.nums.length?"white":T.hint,cursor:orderSelected.length===prob.nums.length?"pointer":"not-allowed"})}>
                    Confirmar orden
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── WRONG ── */}
        {phase==="wrong"&&(
          <div style={{ animation:"fadeUp 0.2s ease" }}>
            <div style={{ background:T.errorBg,border:`1px solid #FECACA`,borderRadius:T.radiusSm,padding:"14px 16px",marginBottom:20 }}>
              <p style={{ fontSize:14,color:T.error,fontWeight:600,margin:0,lineHeight:1.5 }}>{feedback}</p>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              <button onClick={openGuide} style={S.btn("#334155","filled",{width:"100%"})}>Ver guía</button>
              <button onClick={()=>{setAnswer("");setOrderSel([]);setPhase("question");}} style={S.btn("#F1F5F9","filled",{width:"100%",color:T.text})}>Intentar nuevamente</button>
              <button onClick={()=>{
                if(prob.type==="order")setOrderSel(Array.isArray(lastAnswer)?[...lastAnswer]:[]);
                else setAnswer(typeof lastAnswer==="string"?lastAnswer:"");
                setPhase("question");
              }} style={{ ...S.btn("transparent","filled",{width:"100%",color:T.muted,fontSize:13}),textDecoration:"underline" }}>
                ← Volver y revisar mi respuesta
              </button>
            </div>
          </div>
        )}

        {/* ── CORRECT ── */}
        {phase==="correct"&&(
          <div style={{ animation:"fadeUp 0.2s ease" }}>
            <div style={{ background:T.successBg,border:`1px solid #BBF7D0`,borderRadius:T.radiusSm,padding:"14px 16px",marginBottom:20 }}>
              <p style={{ fontSize:14,color:T.success,fontWeight:600,margin:0,lineHeight:1.5 }}>{feedback}</p>
            </div>
            {showReflect&&(
              <div style={{ background:"#F5F3FF",border:`1px solid #DDD6FE`,borderRadius:T.radiusSm,padding:"16px",marginBottom:16 }}>
                <p style={{ fontSize:13,fontWeight:700,color:"#6D28D9",margin:"0 0 10px" }}>{reflectQ}</p>
                {!reflectSaved?(
                  <>
                    <textarea placeholder="Escribí tu respuesta (optativo)..." value={reflectAns} onChange={e=>setReflectAns(e.target.value)}
                      style={{ width:"100%",padding:"10px 12px",borderRadius:T.radiusSm,border:`1.5px solid #DDD6FE`,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",resize:"none",minHeight:64,marginBottom:8 }}/>
                    <div style={{ display:"flex",gap:8 }}>
                      {reflectAns.trim()&&<button onClick={saveReflection} style={S.btn(T.success,"filled",{flex:1,fontSize:13})}>Guardar</button>}
                      <button onClick={handleContinue} style={S.btn("#F1F5F9","filled",{flex:1,color:T.muted,fontSize:13})}>Omitir</button>
                    </div>
                  </>
                ):(
                  <>
                    <p style={{ color:T.success,fontSize:13,fontWeight:600,margin:"0 0 12px" }}>Respuesta guardada. Tu docente la va a ver.</p>
                    <button onClick={handleContinue} style={S.btn("#334155","filled",{width:"100%"})}>Continuar</button>
                  </>
                )}
              </div>
            )}
            {!showReflect&&(
              <button onClick={handleContinue} style={S.btn(game.color,"filled",{width:"100%",fontSize:15})}>
                {cil>=5?"Completar nivel":"Siguiente ejercicio"}
              </button>
            )}
          </div>
        )}
      </div>

      <p style={{ color:T.hint,fontSize:11,marginTop:14 }}>
        {student.name} · {game.name} · Nivel {level}
      </p>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen]           = useState("home");
  const [teacher,setTeacher]         = useState(null);
  const [student,setStudent]         = useState(null);
  const [gameSession,setGameSession] = useState(null);
  return (
    <>
      {screen==="home"              &&<Home go={setScreen}/>}
      {screen==="teacher-login"     &&<TeacherLogin go={setScreen} setTeacher={setTeacher}/>}
      {screen==="teacher-dashboard" &&<TeacherDashboard go={setScreen}/>}
      {screen==="student-enter"     &&<StudentEnter go={setScreen} setStudent={setStudent}/>}
      {screen==="game-menu"         &&student&&<GameMenu student={student} go={setScreen} setGameSession={setGameSession}/>}
      {screen==="game-player"       &&student&&gameSession&&<GamePlayer student={student} gameSession={gameSession} go={setScreen}/>}
    </>
  );
}
