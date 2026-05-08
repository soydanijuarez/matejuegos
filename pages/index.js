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

// ─── ROMAN NUMERAL HELPERS ────────────────────────────────────────────────
const ROMAN_MAP = [
  [1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],
  [100,"C"],[90,"XC"],[50,"L"],[40,"XL"],
  [10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"],
];

function toRoman(num) {
  let result = "";
  for (const [val, sym] of ROMAN_MAP) {
    while (num >= val) { result += sym; num -= val; }
  }
  return result;
}

function fromRoman(str) {
  const vals = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
  let total = 0;
  for (let i = 0; i < str.length; i++) {
    const cur = vals[str[i]], next = vals[str[i+1]];
    if (next && cur < next) total -= cur;
    else total += cur;
  }
  return total;
}

// Generate a wrong roman numeral for error-detection exercises
function makeWrongRoman(num, lv) {
  const correct = toRoman(num);
  const errors = [];

  // Error 1: repeat symbol too many times (IIII instead of IV)
  if (num % 5 === 4 || num % 10 === 9) {
    // Instead of IV write IIII, instead of IX write VIIII
    const wrong = correct.replace("IV","IIII").replace("IX","VIIII").replace("XL","XXXX").replace("XC","LXXXX").replace("CD","CCCC").replace("CM","DCCCC");
    if (wrong !== correct) errors.push(wrong);
  }
  // Error 2: reverse order (add instead of subtract)
  if (correct.includes("IV")) errors.push(correct.replace("IV","VI"));
  if (correct.includes("IX")) errors.push(correct.replace("IX","XI"));
  if (correct.includes("XL")) errors.push(correct.replace("XL","LX"));
  if (correct.includes("XC")) errors.push(correct.replace("XC","CX"));
  if (correct.includes("CD")) errors.push(correct.replace("CD","DC"));
  if (correct.includes("CM")) errors.push(correct.replace("CM","MC"));

  // Error 3: add an extra symbol
  errors.push(correct + "I");

  const valid = errors.filter(e => e !== correct && e.length > 0);
  return valid.length > 0 ? pick(valid) : correct + "I";
}

// ─── GAMES CONFIG ─────────────────────────────────────────────────────────
const GAMES = [
  { id:"ceros",   name:"Los Ceros Mágicos",  color:"#3B82F6", levels:4, desc:"Multiplicación y división por múltiplos de 10" },
  { id:"orden",   name:"El Gran Orden",       color:"#10B981", levels:4, desc:"Ordenar y comparar números hasta 9.999" },
  { id:"falta",   name:"¿Qué número falta?",  color:"#F59E0B", levels:4, desc:"Encontrá el factor o dividendo que falta" },
  { id:"valor",   name:"Valor posicional",     color:"#8B5CF6", levels:4, desc:"Unidades de mil, centenas, decenas y unidades" },
  { id:"romanos", name:"Números Romanos",      color:"#DC2626", levels:5, desc:"Leé y escribí números romanos" },
];

// ─── ROMAN LEVELS CONFIG ───────────────────────────────────────────────────
// lv1: I V X  — 1 to 15, no subtraction
// lv2: I V X  — 1 to 39, with subtraction (IV, IX)
// lv3: L C    — 40 to 99 (XL, XC)
// lv4: D      — 100 to 499 (CD)
// lv5: M      — 500 to 3999 (CM)
const ROMAN_RANGES = {
  1: { min:1,  max:15,  symbols:"I · V · X",          note:"Solo sumas" },
  2: { min:1,  max:39,  symbols:"I · V · X",          note:"Con resta (IV, IX)" },
  3: { min:40, max:99,  symbols:"I · V · X · L · C",  note:"Con L y C" },
  4: { min:100,max:499, symbols:"+ D",                 note:"Con D" },
  5: { min:500,max:3999,symbols:"+ M",                 note:"Sistema completo" },
};

// For lv1: avoid numbers that require subtraction notation
function genNumberForLevel(lv) {
  const { min, max } = ROMAN_RANGES[lv];
  if (lv === 1) {
    // Only numbers that don't need IV or IX
    const safe = [];
    for (let n = min; n <= max; n++) {
      const r = toRoman(n);
      if (!r.includes("IV") && !r.includes("IX")) safe.push(n);
    }
    return pick(safe);
  }
  return rnd(min, max);
}

// ─── ROMAN GENERATOR ──────────────────────────────────────────────────────
function genRomanos(lv) {
  const num = genNumberForLevel(lv);
  const roman = toRoman(num);
  const type = pick(lv === 1 ? ["read","write"] : ["read","write","error"]);

  if (type === "read") {
    return {
      type: "input",
      subtype: "read",
      expr: `¿Cuánto vale ${roman}?`,
      answer: String(num),
      displayAns: `${roman} = ${num}`,
      feedbackOk:    `Correcto. ${roman} vale ${num}.`,
      feedbackWrong: `No es correcto. ${roman} vale ${num}. Revisá cada símbolo de izquierda a derecha.`,
      _num: num, _roman: roman, _lv: lv,
    };
  }

  if (type === "write") {
    return {
      type: "input",
      subtype: "write",
      expr: `Escribí el ${num} en números romanos`,
      answer: roman,
      displayAns: `${num} = ${roman}`,
      feedbackOk:    `Correcto. El ${num} en números romanos es ${roman}.`,
      feedbackWrong: `No es correcto. El ${num} en números romanos se escribe ${roman}.`,
      _num: num, _roman: roman, _lv: lv,
      isText: true,
    };
  }

  // type === "error": pick 2 options, one correct one wrong
  const wrong = makeWrongRoman(num, lv);
  const options = Math.random() > 0.5 ? [roman, wrong] : [wrong, roman];
  return {
    type: "pick2",
    subtype: "error",
    question: `¿Cuál es la forma correcta de escribir el ${num}?`,
    options,
    answer: roman,
    displayAns: `El ${num} se escribe ${roman}.`,
    feedbackOk:    `Correcto. ${roman} es la forma correcta de escribir el ${num}.`,
    feedbackWrong: `No es correcto. La forma correcta es ${roman}.`,
    _num: num, _roman: roman, _lv: lv,
  };
}

// ─── THINK MODALS ─────────────────────────────────────────────────────────
const THINK_MODALS = {
  ceros:   ["¿Multiplicar por 10 siempre agrega un cero al resultado?","¿Dividir entre 10 siempre quita un cero?","¿200 × 3 es lo mismo que 2 × 300?"],
  orden:   ["¿Todos los números de 4 cifras son mayores que cualquier número de 3 cifras?","¿Cuál es el número más chico de 4 cifras que existe?","Si tenés dos números con los mismos dígitos pero en distinto orden, ¿cuál es mayor?"],
  falta:   ["¿La multiplicación y la división son operaciones inversas?","Si conocés el resultado y uno de los factores, ¿podés encontrar el otro?"],
  valor:   ["¿El mismo dígito puede valer distinto según su posición?","¿Cuál es el número más grande de 4 cifras que existe?","¿Cuál es el número más chico de 4 cifras que existe?"],
  romanos: [
    "¿Podés pensar en algún lugar donde hayas visto números romanos?",
    "¿Por qué creés que los romanos inventaron este sistema?",
    "¿Qué símbolo romano se parece a una letra que conocés?",
  ],
};

// ─── CONTEXTUAL GUIDES ────────────────────────────────────────────────────
function buildGuides(gameId, level, prob) {
  if (gameId === "romanos") {
    const { _num, _roman, _lv, subtype } = prob;

    if (subtype === "read") {
      // Help reading a roman numeral
      const chars = _roman.split("");
      const vals  = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };

      if (_lv === 1) {
        return [
          { type:"info",     text:`Los símbolos básicos son: I = 1, V = 5, X = 10.` },
          { type:"info",     text:`En el ${_roman}, todos los símbolos se suman de izquierda a derecha.` },
          { type:"question", text:`¿Cuántos símbolos tiene ${_roman} y cuánto vale cada uno?` },
        ];
      }
      // lv 2+: may have subtraction
      const hasSubtraction = _roman.match(/IV|IX|XL|XC|CD|CM/);
      if (hasSubtraction) {
        const sub = hasSubtraction[0];
        const subVal = fromRoman(sub);
        return [
          { type:"info",     text:`Cuando un símbolo más chico aparece ANTES de uno más grande, se resta.` },
          { type:"info",     text:`En ${_roman}, el ${sub} significa ${fromRoman(sub[0])} antes de ${fromRoman(sub[1])}: ${fromRoman(sub[1])} - ${fromRoman(sub[0])} = ${subVal}.` },
          { type:"question", text:`Ahora que sabés que ${sub} = ${subVal}, ¿cuánto vale el número completo ${_roman}?` },
        ];
      }
      return [
        { type:"info",     text:`Cuando los símbolos van de mayor a menor, de izquierda a derecha, se suman.` },
        { type:"info",     text:`En ${_roman}, sumá el valor de cada símbolo: ${chars.map(c=>`${c}=${vals[c]}`).join(", ")}.` },
        { type:"question", text:`¿Cuánto es ${chars.map(c=>vals[c]).join(" + ")}?` },
      ];
    }

    if (subtype === "write") {
      if (_lv === 1) {
        return [
          { type:"info",     text:`Los tres símbolos que usamos son: I = 1, V = 5, X = 10.` },
          { type:"info",     text:`Para escribir un número, empezamos por el símbolo de mayor valor y vamos sumando.` },
          { type:"question", text:`¿Cuántas X necesitás para llegar a ${_num}? ¿Cuántas I o V sobran?` },
        ];
      }
      if (_num % 10 === 4 || _num % 10 === 9) {
        return [
          { type:"info",     text:`Cuando un número termina en 4, usamos IV (que vale 5 - 1 = 4).` },
          { type:"info",     text:`Cuando termina en 9, usamos IX (que vale 10 - 1 = 9).` },
          { type:"question", text:`El ${_num} termina en ${_num % 10}. ¿Qué combinación usarías?` },
        ];
      }
      if (_num >= 40 && _num < 50) {
        return [
          { type:"info",     text:`XL vale 40 (X antes de L: 50 - 10 = 40).` },
          { type:"info",     text:`Para el ${_num}: empezá con XL y después completá lo que falta.` },
          { type:"question", text:`¿Cuánto falta después del 40 para llegar al ${_num}?` },
        ];
      }
      return [
        { type:"info",     text:`Pensá cuántas veces cabe el símbolo más grande posible en ${_num}.` },
        { type:"info",     text:`Símbolos disponibles en este nivel: ${ROMAN_RANGES[_lv].symbols}.` },
        { type:"question", text:`¿Con qué símbolo arrancarías para escribir el ${_num}?` },
      ];
    }

    // subtype === "error"
    return [
      { type:"info",     text:`Un símbolo más chico ANTES de uno más grande significa resta. Ejemplo: IV = 4, no VI = 6.` },
      { type:"info",     text:`Un símbolo no puede repetirse más de 3 veces seguidas. En vez de IIII se escribe IV.` },
      { type:"question", text:`Mirá las dos opciones. ¿Alguna tiene un símbolo repetido más de 3 veces o en el orden equivocado?` },
    ];
  }

  // ── Other games guides (same as before) ──
  if (gameId === "valor") {
    const num = prob._num;
    if (level === 1) {
      const posName = prob._posName || "";
      const d = num ? String(num).split("").map(Number) : [0,0,0,0];
      const [m,c,dec,u] = d;
      const byPos = {
        "unidades de mil": pick([
          [{type:"info",text:`El número ${num} tiene 4 cifras: unidades de mil, centenas, decenas y unidades.`},{type:"info",text:`La primera cifra de la izquierda indica las unidades de mil. En el ${num}, esa cifra es el ${m}.`},{type:"question",text:`¿Cuántas unidades de mil tiene el ${num}?`}],
          [{type:"info",text:`Para encontrar las unidades de mil, mirá el primer dígito: en el ${num} es el ${m}.`},{type:"question",text:`¿Cuál es el primer dígito del ${num}?`}],
        ]),
        "centenas": pick([
          [{type:"info",text:`En el ${num}, el orden de las cifras es: ${m} · ${c} · ${dec} · ${u}.`},{type:"info",text:`El segundo dígito de la izquierda indica las centenas. En el ${num}, ese dígito es el ${c}.`},{type:"question",text:`¿Cuántas centenas tiene el ${num}?`}],
          [{type:"info",text:`Contá las posiciones de izquierda a derecha: miles → centenas → decenas → unidades.`},{type:"question",text:`¿Qué número está en la segunda posición del ${num}?`}],
        ]),
        "decenas": [{type:"info",text:`En el ${num}, el orden es: ${m} miles · ${c} centenas · ${dec} decenas · ${u} unidades.`},{type:"info",text:`El tercer dígito de la izquierda indica las decenas. En el ${num} es el ${dec}.`},{type:"question",text:`¿Cuántas decenas tiene el ${num}?`}],
        "unidades": [{type:"info",text:`Las unidades siempre están en el último lugar, a la derecha del todo.`},{type:"info",text:`El ${num} termina en ${u}. Ese es el dígito de las unidades.`},{type:"question",text:`¿Cuántas unidades tiene el ${num}?`}],
      };
      return byPos[posName] || byPos["unidades de mil"];
    }
    if (level === 2) {
      const d = num ? String(num).split("").map(Number) : [0,0,0,0];
      const [m,c,dec,u] = d;
      return pick([
        [{type:"info",text:`Descomponer significa separar un número en sus partes.`},{type:"info",text:`El ${num} tiene ${m} unidades de mil, ${c} centenas, ${dec} decenas y ${u} unidades.`},{type:"question",text:`¿Cuánto vale cada parte? Sumalas con + sin espacios.`}],
        [{type:"info",text:`Ejemplo: 3456 = 3000 + 400 + 50 + 6, que se escribe 3000+400+50+6.`},{type:"info",text:`El ${num} tiene ${m} miles = ${m*1000}, ${c} centenas = ${c*100}, ${dec} decenas = ${dec*10}, ${u} unidades = ${u}.`},{type:"question",text:`¿Cómo escribirías la descomposición del ${num}?`}],
      ]);
    }
    if (level === 3) return [{type:"info",text:`Para armar el número, sumá todas sus partes.`},{type:"info",text:`Ejemplo: 2 unidades de mil + 3 centenas + 4 decenas + 5 unidades = 2000+300+40+5 = 2345.`},{type:"question",text:`¿Cuánto da la suma de todas las partes?`}];
    return pick([[{type:"info",text:`Para comparar números, empezá por la primera cifra de la izquierda: las unidades de mil.`},{type:"question",text:`¿Cuántas unidades de mil tiene cada número?`}],[{type:"info",text:`Un número con más unidades de mil siempre es mayor, sin importar las otras cifras.`},{type:"info",text:`Ejemplo: 4100 es mayor que 3999 porque 4 miles > 3 miles.`},{type:"question",text:`¿Cuál de los números tiene más unidades de mil?`}]]);
  }
  if (gameId === "ceros") return pick([[{type:"info",text:`Multiplicar por un número con ceros se hace en dos pasos.`},{type:"info",text:`Primero multiplicás los dígitos sin ceros, después agregás todos los ceros.`},{type:"question",text:`¿Cuántos ceros tiene uno de los números de esta operación?`}],[{type:"info",text:`Los ceros al final indican que multiplicaste por 10, por 100 o por 1000.`},{type:"question",text:`¿Cuántas veces multiplicaste por 10 en esta operación?`}]]);
  if (gameId === "orden") return pick([[{type:"info",text:`Un número con más cifras siempre es mayor que uno con menos cifras.`},{type:"question",text:`¿Todos los números de esta lista tienen la misma cantidad de cifras?`}],[{type:"info",text:`Si dos números tienen la misma cantidad de cifras, compará dígito por dígito, de izquierda a derecha.`},{type:"question",text:`¿En qué posición difieren los números más parecidos?`}]]);
  if (gameId === "falta") return pick([[{type:"info",text:`La multiplicación y la división son operaciones inversas.`},{type:"info",text:`Si A × B = C, entonces C ÷ B = A.`},{type:"question",text:`¿Qué operación inversa podés usar para encontrar el número que falta?`}],[{type:"info",text:`Para encontrar un factor que falta, podés dividir el resultado por el factor conocido.`},{type:"question",text:`¿Cuánto da el resultado si lo dividís por el número que ya tenés?`}]]);
  return [{type:"info",text:"Revisá el enunciado con calma e intentalo de nuevo."}];
}

// ─── REFLECT QUESTIONS ────────────────────────────────────────────────────
function getReflectQuestion(gameId, prob) {
  if (gameId === "romanos") {
    const { _num, _roman } = prob;
    return pick([
      `Si el ${_roman} vale ${_num}, ¿cuánto valdría si le agregaras una I al final?`,
      `¿Podés pensar en algún número parecido al ${_num} y cómo se escribiría en romano?`,
      `¿Por qué creés que ${_roman} se escribe así y no de otra forma?`,
      `¿Podés escribir el número anterior al ${_num} en romano?`,
    ]);
  }
  if (gameId === "valor") {
    const num = prob._num;
    return pick([`Si cambiaras el dígito de las centenas del ${num} por 9, ¿qué número quedaría?`,`¿Cuánto le falta al ${num} para llegar a ${Math.ceil(num/1000)*1000}?`,`¿Cómo cambiaría el ${num} si le agregaras 100 más?`]);
  }
  if (gameId === "ceros") return pick(["¿Cómo podrías verificar tu respuesta sin calcular de nuevo?","¿Este método funciona con cualquier número que termine en cero?"]);
  if (gameId === "orden") return pick(["¿Podrías construir un número más grande que todos los de la lista?","¿Cuánto tendría que cambiar el número más chico para ser mayor que el segundo?"]);
  if (gameId === "falta") return pick(["¿Hay alguna otra forma de verificar que tu respuesta es correcta?","¿Qué operación usaste para encontrar el número que faltaba?"]);
  return "¿Cómo llegaste a ese resultado?";
}

// ─── OTHER GENERATORS ─────────────────────────────────────────────────────
function genCeros(lv) {
  const z = lv<=2?rnd(1,2):rnd(2,3), pow=Math.pow(10,z);
  if(lv===1||lv===3||(lv===4&&Math.random()>.5)){
    const a=rnd(2,9)*pow,b=rnd(2,9),base=a/pow;
    return{type:"input",expr:`${a} × ${b}`,answer:String(a*b),displayAns:`${a} × ${b} = ${a*b}`,feedbackOk:`Correcto. ${a} × ${b} = ${a*b}.`,feedbackWrong:`No es correcto. Calculá primero ${base} × ${b}, después sumá los ${z} cero${z>1?"s":""} del ${a}.`};
  }
  const q=rnd(2,9),d=rnd(2,9),dividend=q*d*pow;
  return{type:"input",expr:`${dividend} ÷ ${d}`,answer:String(q*pow),displayAns:`${dividend} ÷ ${d} = ${q*pow}`,feedbackOk:`Correcto. ${dividend} ÷ ${d} = ${q*pow}.`,feedbackWrong:`No es correcto. Calculá primero ${q*d} ÷ ${d}, después pensá en los ceros.`};
}

function genOrden(lv) {
  const count=lv<=2?4:5,min=lv===1?100:1000,max=lv===1?999:9999;
  let s=new Set(); while(s.size<count)s.add(rnd(min,max)); const nums=[...s];
  const sorted=[...nums].sort((a,b)=>a-b);
  let shuffled=[...nums].sort(()=>Math.random()-.5),t=0;
  while(JSON.stringify(shuffled)===JSON.stringify(sorted)&&t<20){shuffled=[...nums].sort(()=>Math.random()-.5);t++;}
  return{type:"order",nums:shuffled,answer:sorted,displayAns:sorted.join(" < "),feedbackOk:`Correcto. El orden de menor a mayor es: ${sorted.join(" < ")}.`,feedbackWrong:`No es correcto. Revisá tu respuesta.`};
}

function genFalta(lv) {
  const z=lv<=2?1:rnd(1,2),pow=Math.pow(10,z);
  if(lv<=2){
    const a=rnd(2,9)*pow,b=rnd(2,9),result=a*b,hideA=Math.random()>.5;
    return{type:"input",expr:hideA?`___ × ${b} = ${result}`:`${a} × ___ = ${result}`,answer:hideA?String(a):String(b),displayAns:`${a} × ${b} = ${result}`,feedbackOk:`Correcto. ${a} × ${b} = ${result}.`,feedbackWrong:`No es correcto. Pensá: ¿cuánto es ${result} ÷ ${hideA?b:a}?`};
  }
  const q=rnd(2,9),d=rnd(2,9),dividend=q*d*pow,result=q*pow,hideD=Math.random()>.5;
  return{type:"input",expr:hideD?`${dividend} ÷ ___ = ${result}`:`___ ÷ ${d} = ${result}`,answer:hideD?String(d):String(dividend),displayAns:`${dividend} ÷ ${d} = ${result}`,feedbackOk:`Correcto. ${dividend} ÷ ${d} = ${result}.`,feedbackWrong:`No es correcto. Usá la operación inversa para encontrar el número que falta.`};
}

function genValor(lv) {
  if(lv===1){
    let num,d,p;
    do{num=rnd(1000,9999);d=String(num).split("").map(Number);const POS=[{name:"unidades de mil",idx:0},{name:"centenas",idx:1},{name:"decenas",idx:2},{name:"unidades",idx:3}].filter(p=>d[p.idx]!==0);p=pick(POS);}while(!p);
    return{type:"input",expr:`En el número ${num}, ¿cuántas ${p.name} hay?`,answer:String(d[p.idx]),displayAns:`El ${num} tiene ${d[p.idx]} ${p.name}.`,feedbackOk:`Correcto. El ${num} tiene ${d[p.idx]} ${p.name}.`,feedbackWrong:`No es correcto. El ${num} se lee: ${d[0]} unidades de mil, ${d[1]} centenas, ${d[2]} decenas y ${d[3]} unidades.`,_num:num,_posName:p.name,_correctVal:d[p.idx]};
  }
  if(lv===2){
    const num=rnd(1000,9999),d=String(num).split("").map(Number),labels=[];
    if(d[0])labels.push(`${d[0]}000`);if(d[1])labels.push(`${d[1]}00`);if(d[2])labels.push(`${d[2]}0`);if(d[3])labels.push(`${d[3]}`);
    const answer=labels.join("+");
    return{type:"input",flexible:true,expr:`Descomponé el número ${num}`,placeholder:`Ejemplo: ${labels[0]}+${labels[1]||"0"}`,answer,displayAns:`${num} = ${labels.join(" + ")}`,feedbackOk:`Correcto. ${num} = ${labels.join(" + ")}.`,feedbackWrong:`No es correcto. Escribí cada parte y sumalas con + sin espacios. Ejemplo: 8000+500`,_num:num};
  }
  if(lv===3){
    const num=rnd(1000,9999),d=String(num).split("").map(Number),labels=[];
    if(d[0])labels.push(`${d[0]} unidades de mil`);if(d[1])labels.push(`${d[1]} centenas`);if(d[2])labels.push(`${d[2]} decenas`);if(d[3])labels.push(`${d[3]} unidades`);
    return{type:"input",expr:`¿Qué número se forma con ${labels.join(", ")}?`,answer:String(num),displayAns:`El número es ${num}.`,feedbackOk:`Correcto. ${labels.join(", ")} forman el número ${num}.`,feedbackWrong:`No es correcto. Sumá cada parte: ${d[0]*1000} + ${d[1]*100} + ${d[2]*10} + ${d[3]}.`,_num:num};
  }
  const subType=rnd(1,4);
  if(subType===1){let a=rnd(1000,9999),b=rnd(1000,9999);while(a===b)b=rnd(1000,9999);const bigger=Math.max(a,b);return{type:"pick2",question:"¿Cuál es el número mayor?",options:[a,b].sort(()=>Math.random()-.5),answer:String(bigger),displayAns:`${bigger} es el número mayor.`,feedbackOk:`Correcto. ${bigger} es mayor.`,feedbackWrong:`No es correcto. Comparalos cifra por cifra, de izquierda a derecha.`};}
  if(subType===2){let a=rnd(1000,9999),b=rnd(1000,9999);while(a===b)b=rnd(1000,9999);const smaller=Math.min(a,b);return{type:"pick2",question:"¿Cuál es el número menor?",options:[a,b].sort(()=>Math.random()-.5),answer:String(smaller),displayAns:`${smaller} es el número menor.`,feedbackOk:`Correcto. ${smaller} es menor.`,feedbackWrong:`No es correcto. Comparalos cifra por cifra, de izquierda a derecha.`};}
  if(subType===3){let s=new Set();while(s.size<3)s.add(rnd(1000,9999));const nums=[...s],sorted=[...nums].sort((a,b)=>b-a);let shuffled=[...nums].sort(()=>Math.random()-.5),t=0;while(JSON.stringify(shuffled)===JSON.stringify(sorted)&&t<20){shuffled=[...nums].sort(()=>Math.random()-.5);t++;}return{type:"order",question:"Ordená de mayor a menor",descending:true,nums:shuffled,answer:sorted,displayAns:sorted.join(" > "),feedbackOk:`Correcto. De mayor a menor: ${sorted.join(" > ")}.`,feedbackWrong:`No es correcto. Empezá por el número con más unidades de mil.`};}
  let s2=new Set();while(s2.size<4)s2.add(rnd(1000,9999));const nums4=[...s2],sorted4=[...nums4].sort((a,b)=>b-a);let shuffled4=[...nums4].sort(()=>Math.random()-.5),t2=0;while(JSON.stringify(shuffled4)===JSON.stringify(sorted4)&&t2<20){shuffled4=[...nums4].sort(()=>Math.random()-.5);t2++;}
  return{type:"order",question:"Ordená de mayor a menor",descending:true,nums:shuffled4,answer:sorted4,displayAns:sorted4.join(" > "),feedbackOk:`Correcto. De mayor a menor: ${sorted4.join(" > ")}.`,feedbackWrong:`No es correcto. Comparalos dígito por dígito.`};
}

const GENS = { ceros:genCeros, orden:genOrden, falta:genFalta, valor:genValor, romanos:genRomanos };

// ─── DESIGN ───────────────────────────────────────────────────────────────
const T = {
  white:"#FFFFFF",bg:"#F8FAFC",border:"#E2E8F0",
  text:"#1E293B",muted:"#64748B",hint:"#94A3B8",
  success:"#16A34A",successBg:"#F0FDF4",
  error:"#DC2626",errorBg:"#FEF2F2",
  infoBg:"#EFF6FF",infoText:"#1D4ED8",
  radius:20,radiusSm:12,
};
const S = {
  page:(bg=T.bg)=>({minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:bg,padding:20,fontFamily:"'Inter','Nunito',system-ui,sans-serif"}),
  card:{background:T.white,borderRadius:T.radius,padding:"36px 32px",maxWidth:480,width:"100%",boxShadow:"0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.08)",border:`1px solid ${T.border}`},
  input:{width:"100%",padding:"12px 16px",borderRadius:T.radiusSm,border:`1.5px solid ${T.border}`,fontSize:16,fontFamily:"inherit",outline:"none",boxSizing:"border-box",color:T.text,background:T.white,display:"block"},
  btn:(color="#1E293B",variant="filled",ex={})=>({padding:"11px 20px",borderRadius:T.radiusSm,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",border:variant==="outline"?`1.5px solid ${color}`:"none",background:variant==="filled"?color:"transparent",color:variant==="filled"?"#fff":color,...ex}),
};

// ─── GUIDE MODAL ──────────────────────────────────────────────────────────
function GuideModal({ slides, onClose }) {
  const [step,setStep]=useState(0);
  const slide=slides[step],isLast=step===slides.length-1;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,backdropFilter:"blur(4px)"}}>
      <div style={{background:T.white,borderRadius:T.radius,padding:"32px 28px",maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",border:`1px solid ${T.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <span style={{fontSize:12,fontWeight:600,color:T.hint,textTransform:"uppercase",letterSpacing:0.5}}>Guía ({step+1} de {slides.length})</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:T.hint,fontSize:18,lineHeight:1,padding:4}}>✕</button>
        </div>
        <div style={{display:"flex",gap:4,marginBottom:24}}>
          {slides.map((_,i)=><div key={i} style={{height:3,flex:1,borderRadius:99,background:i<=step?T.infoText:T.border,transition:"background 0.2s"}}/>)}
        </div>
        <div style={{background:slide.type==="question"?"#F5F3FF":T.infoBg,borderRadius:T.radiusSm,padding:"18px 20px",marginBottom:28,minHeight:72,display:"flex",alignItems:"center"}}>
          <p style={{fontSize:17,fontWeight:slide.type==="question"?600:500,color:slide.type==="question"?"#6D28D9":T.infoText,margin:0,lineHeight:1.6}}>
            {slide.type==="question"?"🤔 ":"💡 "}{slide.text}
          </p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={S.btn("#F1F5F9","filled",{color:T.muted,flex:1})}>Salir</button>
          {isLast?<button onClick={onClose} style={S.btn("#334155","filled",{flex:2})}>Intentar nuevamente</button>:<button onClick={()=>setStep(s=>s+1)} style={S.btn(T.infoText,"filled",{flex:2})}>Siguiente →</button>}
        </div>
      </div>
    </div>
  );
}

function ThinkModal({ text, onClose }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,backdropFilter:"blur(4px)"}}>
      <div style={{background:T.white,borderRadius:T.radius,padding:"32px 28px",maxWidth:400,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",border:`1px solid ${T.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <span style={{background:T.infoBg,color:T.infoText,borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:600}}>Para pensar</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:T.hint,fontSize:18,lineHeight:1,padding:4}}>✕</button>
        </div>
        <p style={{fontSize:18,fontWeight:600,color:T.text,lineHeight:1.5,margin:"0 0 24px"}}>{text}</p>
        <button onClick={onClose} style={S.btn("#1E293B","filled",{width:"100%"})}>Cerrar y seguir jugando</button>
      </div>
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────
function Home({ go }) {
  return (
    <div style={S.page()}>
      <div style={{...S.card,textAlign:"center"}}>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:12}}>🎓</div>
          <h1 style={{fontSize:26,fontWeight:700,color:T.text,margin:"0 0 8px"}}>MateJuegos</h1>
          <p style={{color:T.muted,fontSize:14,margin:0}}>Plataforma de matemática · 4to grado</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
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
        <button onClick={()=>go("home")} style={{background:"none",border:"none",color:T.hint,cursor:"pointer",fontSize:13,marginBottom:24,padding:0}}>← Volver</button>
        <h2 style={{fontSize:22,fontWeight:700,color:T.text,margin:"0 0 24px"}}>Acceso docente</h2>
        <input style={S.input} placeholder="Código de acceso" value={code} maxLength={12} type="password" onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&login()}/>
        {err&&<p style={{color:T.error,fontSize:13,margin:"8px 0 0"}}>{err}</p>}
        <button style={S.btn("#334155","filled",{width:"100%",marginTop:12})} onClick={login}>Ingresar</button>
      </div>
    </div>
  );
}

// ─── TEACHER DASHBOARD ────────────────────────────────────────────────────
function TeacherDashboard({ go }) {
  const [classes,setClasses]=useState([]),[selected,setSelected]=useState(null);
  const [newName,setNewName]=useState(""),[loading,setLoading]=useState(true),[creating,setCreating]=useState(false);
  const [tab,setTab]=useState("results");
  const [results,setResults]=useState([]),[reflections,setRef]=useState([]),[attempts,setAttempts]=useState([]);
  const [assignments,setAssignments]=useState([]),[loadingData,setLoadingData]=useState(false);
  useEffect(()=>{loadClasses();},[]);
  const loadClasses=async()=>{setLoading(true);const d=await db({table:"classes",filters:"?order=created_at.desc"});if(Array.isArray(d))setClasses(d);setLoading(false);};
  const selectClass=async(cls)=>{
    setSelected(cls);setLoadingData(true);setTab("results");
    const [res,refs,att,ass]=await Promise.all([db({table:"game_results",filters:`?class_code=eq.${cls.code}&order=played_at.desc`}),db({table:"reflections",filters:`?class_code=eq.${cls.code}&order=created_at.desc`}),db({table:"exercise_attempts",filters:`?class_code=eq.${cls.code}&order=played_at.desc`}),db({table:"game_assignments",filters:`?class_code=eq.${cls.code}`})]);
    if(Array.isArray(res))setResults(res);if(Array.isArray(refs))setRef(refs);if(Array.isArray(att))setAttempts(att);if(Array.isArray(ass))setAssignments(ass);
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
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{background:"#1E293B",color:"white",padding:"16px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:11,color:"#94A3B8",textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>Panel docente</div><div style={{fontSize:18,fontWeight:700}}>MateJuegos</div></div>
        <button onClick={()=>go("home")} style={S.btn("#334155","filled",{fontSize:13})}>Salir</button>
      </div>
      <div style={{maxWidth:960,margin:"0 auto",padding:"24px 16px",display:"grid",gridTemplateColumns:"260px 1fr",gap:20,alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{background:T.white,borderRadius:T.radius,padding:20,border:`1px solid ${T.border}`}}>
            <h3 style={{margin:"0 0 14px",color:T.text,fontWeight:700,fontSize:14}}>Nueva clase</h3>
            <input style={{...S.input,marginBottom:10}} placeholder="Nombre (ej: 4to A)" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createClass()}/>
            <button onClick={createClass} disabled={creating||!newName.trim()} style={S.btn("#334155","filled",{width:"100%",opacity:creating||!newName.trim()?0.5:1})}>{creating?"Creando...":"Crear clase"}</button>
          </div>
          <div style={{background:T.white,borderRadius:T.radius,padding:20,border:`1px solid ${T.border}`}}>
            <h3 style={{margin:"0 0 14px",color:T.text,fontWeight:700,fontSize:14}}>Mis clases</h3>
            {loading&&<p style={{color:T.hint,fontSize:13}}>Cargando...</p>}
            {!loading&&classes.length===0&&<p style={{color:T.hint,fontSize:13}}>No hay clases todavía.</p>}
            {classes.map(cls=>(
              <div key={cls.id} onClick={()=>selectClass(cls)} style={{border:`1.5px solid ${selected?.id===cls.id?"#3B82F6":T.border}`,borderRadius:T.radiusSm,padding:"12px 14px",marginBottom:8,cursor:"pointer",background:selected?.id===cls.id?"#EFF6FF":T.white,transition:"all 0.15s"}}>
                <div style={{fontWeight:600,color:T.text,fontSize:14,marginBottom:4}}>{cls.name}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{color:T.hint,fontSize:11}}>{new Date(cls.created_at).toLocaleDateString("es-AR")}</span>
                  <span style={{background:"#EFF6FF",color:T.infoText,borderRadius:6,padding:"2px 8px",fontWeight:700,fontSize:12,letterSpacing:1}}>{cls.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          {!selected&&<div style={{background:T.white,borderRadius:T.radius,padding:48,textAlign:"center",border:`1px solid ${T.border}`}}><p style={{color:T.hint,fontWeight:500,margin:0}}>Seleccioná una clase para ver los datos</p></div>}
          {selected&&(
            <div style={{background:T.white,borderRadius:T.radius,padding:24,border:`1px solid ${T.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                <div><h3 style={{margin:"0 0 4px",color:T.text,fontWeight:700}}>{selected.name}</h3><p style={{margin:0,color:T.hint,fontSize:12}}>Código: <strong style={{color:T.infoText}}>{selected.code}</strong></p></div>
                <button onClick={()=>selectClass(selected)} style={S.btn("#F1F5F9","filled",{color:T.muted,fontSize:12})}>Actualizar</button>
              </div>
              <div style={{display:"flex",gap:6,marginBottom:20,borderBottom:`1px solid ${T.border}`}}>
                {["results","games","attempts","reflections"].map(t=>(
                  <button key={t} onClick={()=>setTab(t)} style={{...S.btn("transparent","filled",{color:tab===t?"#3B82F6":T.muted,borderRadius:"8px 8px 0 0",borderBottom:tab===t?"2px solid #3B82F6":"2px solid transparent",padding:"8px 14px",fontSize:13})}}>
                    {t==="results"?"Resultados":t==="games"?"Juegos":t==="attempts"?"Intentos":"Reflexiones"}
                    {t==="reflections"&&reflections.length>0&&<span style={{background:"#EF4444",color:"white",borderRadius:99,padding:"1px 6px",fontSize:10,marginLeft:4}}>{reflections.length}</span>}
                  </button>
                ))}
              </div>
              {loadingData&&<p style={{color:T.hint}}>Cargando...</p>}
              {!loadingData&&tab==="results"&&(<>
                {students.length===0&&<p style={{color:T.hint,textAlign:"center",padding:"32px 0"}}>Sin datos. Código: <strong style={{color:T.infoText}}>{selected.code}</strong></p>}
                {students.map(name=>(
                  <div key={name} style={{background:T.bg,borderRadius:T.radiusSm,padding:"14px 16px",marginBottom:12}}>
                    <div style={{fontWeight:700,color:T.text,marginBottom:10}}>{name}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {GAMES.map(g=>{const r=gameResults[name]?.[g.id];return(
                        <div key={g.id} style={{background:T.white,borderRadius:T.radiusSm,padding:"10px 12px",border:`1px solid ${T.border}`}}>
                          <div style={{fontSize:12,fontWeight:600,color:r?g.color:T.hint,marginBottom:r?6:0}}>{g.name}</div>
                          {r?<div style={{display:"flex",gap:10,fontSize:12}}><span style={{color:"#2563EB",fontWeight:700}}>{r.score} pts</span><span style={{color:T.success,fontWeight:700}}>{r.correct} ✓</span><span style={{color:T.error,fontWeight:700}}>{r.wrong} ✗</span></div>:<div style={{color:T.hint,fontSize:11}}>Sin actividad</div>}
                        </div>
                      );})}
                    </div>
                  </div>
                ))}
              </>)}
              {!loadingData&&tab==="games"&&(<div>{GAMES.map(g=>{const enabled=isEnabled(g.id);return(
                <div key={g.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderRadius:T.radiusSm,border:`1px solid ${T.border}`,marginBottom:8,background:T.white}}>
                  <div><div style={{fontWeight:600,color:T.text,fontSize:14}}>{g.name}</div><div style={{color:T.hint,fontSize:12,marginTop:2}}>{g.desc}</div></div>
                  <button onClick={()=>toggleGame(g.id,enabled)} style={S.btn(enabled?T.success:T.hint,"filled",{fontSize:13,minWidth:80})}>{enabled?"Activo":"Inactivo"}</button>
                </div>
              );})}</div>)}
              {!loadingData&&tab==="attempts"&&(<>
                {Object.keys(attStats).length===0&&<p style={{color:T.hint,textAlign:"center",padding:"32px 0"}}>Sin datos todavía.</p>}
                {Object.values(attStats).map((s,i)=>{const game=GAMES.find(g=>g.id===s.game);return(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderRadius:T.radiusSm,border:`1px solid ${T.border}`,marginBottom:8,background:T.white}}>
                    <div><div style={{fontWeight:600,color:T.text}}>{s.student}</div><div style={{fontSize:12,color:T.hint,marginTop:2}}>{game?.name}</div></div>
                    <div style={{display:"flex",gap:16,textAlign:"center"}}>
                      <div><div style={{fontWeight:700,color:"#2563EB",fontSize:16}}>{s.total}</div><div style={{fontSize:11,color:T.hint}}>intentos</div></div>
                      <div><div style={{fontWeight:700,color:"#D97706",fontSize:16}}>{s.hints}</div><div style={{fontSize:11,color:T.hint}}>ayudas</div></div>
                      <div><div style={{fontWeight:700,color:T.error,fontSize:16}}>{s.failed}</div><div style={{fontSize:11,color:T.hint}}>errores</div></div>
                    </div>
                  </div>
                );})}
              </>)}
              {!loadingData&&tab==="reflections"&&(<>
                {reflections.length===0&&<p style={{color:T.hint,textAlign:"center",padding:"32px 0"}}>Sin reflexiones todavía.</p>}
                {reflections.map((r,i)=>(
                  <div key={i} style={{background:"#F5F3FF",borderRadius:T.radiusSm,padding:16,marginBottom:10,borderLeft:"3px solid #8B5CF6"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><strong style={{color:T.text,fontSize:14}}>{r.student_name}</strong><span style={{color:T.hint,fontSize:11}}>{new Date(r.created_at).toLocaleDateString("es-AR")}</span></div>
                    <p style={{color:T.muted,fontSize:13,margin:"0 0 4px",fontStyle:"italic"}}>"{r.question}"</p>
                    <p style={{color:T.text,fontSize:14,margin:0,fontWeight:600}}>{r.answer}</p>
                  </div>
                ))}
              </>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── STUDENT ENTER ────────────────────────────────────────────────────────
function StudentEnter({ go, setStudent }) {
  const [name,setName]=useState(""),[code,setCode]=useState(""),[err,setErr]=useState(""),[loading,setLoading]=useState(false);
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
        <button onClick={()=>go("home")} style={{background:"none",border:"none",color:T.hint,cursor:"pointer",fontSize:13,marginBottom:24,padding:0}}>← Volver</button>
        <h2 style={{fontSize:22,fontWeight:700,color:T.text,margin:"0 0 6px"}}>¡Hola!</h2>
        <p style={{color:T.muted,fontSize:14,margin:"0 0 24px"}}>Ingresá tu nombre y el código de tu clase.</p>
        <label style={{fontSize:13,fontWeight:600,color:T.text,display:"block",marginBottom:6}}>Tu nombre</label>
        <input style={{...S.input,marginBottom:16}} placeholder="Ej: Sofía" value={name} onChange={e=>setName(e.target.value)}/>
        <label style={{fontSize:13,fontWeight:600,color:T.text,display:"block",marginBottom:6}}>Código de clase</label>
        <input style={{...S.input,textTransform:"uppercase",letterSpacing:4,fontSize:20,fontWeight:700,textAlign:"center",marginBottom:16}} placeholder="ABC123" maxLength={6} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&enter()}/>
        {err&&<p style={{color:T.error,fontSize:13,margin:"0 0 12px"}}>{err}</p>}
        <button style={S.btn("#3B82F6","filled",{width:"100%",padding:"13px",fontSize:15})} onClick={enter} disabled={loading}>{loading?"Buscando...":"Ingresar"}</button>
      </div>
    </div>
  );
}

// ─── GAME MENU ────────────────────────────────────────────────────────────
function GameMenu({ student, go, setGameSession }) {
  const [progress,setProgress]=useState({}),[assignments,setAssignments]=useState([]),[loading,setLoading]=useState(true);
  useEffect(()=>{loadData();},[]);
  const loadData=async()=>{
    const [prog,ass]=await Promise.all([db({table:"student_progress",filters:`?class_code=eq.${student.classCode}&student_name=eq.${encodeURIComponent(student.name)}`}),db({table:"game_assignments",filters:`?class_code=eq.${student.classCode}`})]);
    if(Array.isArray(prog)){const p={};prog.forEach(r=>{p[r.game_id]={level:r.level_reached,completed:r.completed};});setProgress(p);}
    if(Array.isArray(ass))setAssignments(ass);
    setLoading(false);
  };
  const isEnabled=gid=>{if(assignments.length===0)return true;const a=assignments.find(a=>a.game_id===gid);return a?a.enabled:true;};
  const getLevelStatus=(gid,lv)=>{const reached=progress[gid]?.level||1;if(lv<reached)return"done";if(lv===reached)return"current";return"locked";};
  const startGame=(gid,lv)=>{const status=getLevelStatus(gid,lv);setGameSession({gameId:gid,level:lv,alreadyDone:status==="done"});go("game-player");};
  const enabledGames=GAMES.filter(g=>isEnabled(g.id));
  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{background:"#1E293B",color:"white",padding:"16px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:11,color:"#94A3B8",textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>{student.className}</div><div style={{fontSize:18,fontWeight:700}}>Hola, {student.name}</div></div>
        <button onClick={()=>go("home")} style={S.btn("#334155","filled",{fontSize:13})}>Salir</button>
      </div>
      {loading&&<div style={{textAlign:"center",padding:48,color:T.hint}}>Cargando...</div>}
      {!loading&&(
        <div style={{maxWidth:900,margin:"0 auto",padding:"24px 16px"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:20}}>Elegí un juego</h2>
          {enabledGames.length===0&&<p style={{color:T.hint}}>Tu docente todavía no activó ningún juego.</p>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
            {enabledGames.map(game=>(
              <div key={game.id} style={{background:T.white,borderRadius:T.radius,padding:24,border:`1px solid ${T.border}`,borderTop:`3px solid ${game.color}`}}>
                <h3 style={{margin:"0 0 4px",color:T.text,fontWeight:700,fontSize:16}}>{game.name}</h3>
                <p style={{color:T.muted,fontSize:13,margin:"0 0 18px"}}>{game.desc}</p>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {Array.from({length:game.levels},(_,i)=>i+1).map(lv=>{
                    const status=getLevelStatus(game.id,lv),isLocked=status==="locked",isDone=status==="done",isCurrent=status==="current";
                    const lvLabels=["Básico","Intermedio","Avanzado","Desafío","Experto"];
                    return(
                      <button key={lv} onClick={()=>!isLocked&&startGame(game.id,lv)}
                        style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:T.radiusSm,border:`1px solid ${isLocked?T.border:isDone?"#D1FAE5":game.color}`,background:isLocked?T.bg:isDone?"#F0FDF4":`${game.color}12`,cursor:isLocked?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
                        <span style={{fontSize:13,minWidth:16,color:isLocked?T.hint:isDone?T.success:game.color}}>{isLocked?"🔒":isDone?"✓":"▶"}</span>
                        <div style={{flex:1,textAlign:"left"}}>
                          <div style={{fontWeight:600,fontSize:13,color:isLocked?T.hint:isDone?T.success:game.color}}>Nivel {lv} — {lvLabels[lv-1]}</div>
                        </div>
                        {isDone&&<span style={{fontSize:11,color:T.success,fontWeight:600}}>Completo</span>}
                        {isCurrent&&<span style={{background:game.color,color:"white",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600}}>Jugar</span>}
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

// ─── COMPLETED LEVEL ──────────────────────────────────────────────────────
function CompletedLevel({ student, gameSession, onRepeat, go }) {
  const { gameId, level } = gameSession;
  return (
    <div style={S.page()}>
      <div style={{...S.card,textAlign:"center"}}>
        <div style={{width:56,height:56,background:T.successBg,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:24}}>✓</div>
        <h2 style={{fontSize:20,fontWeight:700,color:T.text,margin:"0 0 8px"}}>Ya completaste el Nivel {level}</h2>
        <p style={{color:T.muted,fontSize:14,margin:"0 0 28px",lineHeight:1.6}}>Tu progreso está guardado. Podés repasar el nivel o volver a los juegos.</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={()=>go("game-menu")} style={S.btn("#334155","filled",{width:"100%",padding:"13px"})}>Volver a los juegos</button>
          <button onClick={onRepeat} style={S.btn("#F1F5F9","filled",{width:"100%",padding:"13px",color:T.muted})}>Repasar este nivel</button>
        </div>
      </div>
    </div>
  );
}

// ─── GAME PLAYER ──────────────────────────────────────────────────────────
function GamePlayer({ student, gameSession, go }) {
  const {gameId,level}=gameSession;
  const game=GAMES.find(g=>g.id===gameId);
  const gen=GENS[gameId];

  const [prob,setProb]               =useState(()=>gen(level));
  const [phase,setPhase]             =useState("question");
  const [answer,setAnswer]           =useState("");
  const [lastAnswer,setLastAnswer]   =useState("");
  const [orderSelected,setOrderSel]  =useState([]);
  const [guideSlides,setGuideSlides] =useState(null);
  const [thinkText,setThinkText]     =useState(null);
  const [reflectQ,setReflectQ]       =useState("");
  const [showReflect,setShowReflect] =useState(false);
  const [reflectAns,setReflectAns]   =useState("");
  const [reflectSaved,setReflectSaved]=useState(false);
  const [feedback,setFeedback]       =useState("");
  const [score,setScore]             =useState(0);
  const [correct,setCorrect]         =useState(0);
  const [wrong,setWrong]             =useState(0);
  const [cil,setCil]                 =useState(0);
  const [finished,setFinished]       =useState(false);
  const [saving,setSaving]           =useState(false);
  const [hintsUsed,setHintsUsed]     =useState(0);
  const totalEx=useRef(0);
  const inputRef=useRef(null);

  useEffect(()=>{if(phase==="question")setTimeout(()=>inputRef.current?.focus(),150);},[phase,prob]);

  const newProb=()=>{
    setProb(gen(level));setAnswer("");setLastAnswer("");setPhase("question");
    setGuideSlides(null);setReflectAns("");setReflectSaved(false);
    setShowReflect(false);setHintsUsed(0);setOrderSel([]);setFeedback("");
  };

  const isCorrect=(userAns)=>{
    if(prob.type==="order") return JSON.stringify(userAns)===JSON.stringify(prob.answer);
    if(prob.type==="pick2") return String(userAns)===String(prob.answer);
    if(prob.flexible){const norm=s=>s.replace(/\s/g,"");return norm(String(userAns))===norm(String(prob.answer));}
    // For roman write: case-insensitive, trimmed
    if(prob.subtype==="write") return String(userAns).trim().toUpperCase()===String(prob.answer).toUpperCase();
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
      if(shouldReflect){setReflectQ(getReflectQuestion(gameId,prob));setShowReflect(true);}
      if(showThink)setThinkText(pick(THINK_MODALS[gameId]));
      setScore(s=>s+10);setCorrect(c=>c+1);setCil(c=>c+1);
      setPhase("correct");
    } else {
      setLastAnswer(prob.type==="order"?[...orderSelected]:answer);
      setFeedback(prob.feedbackWrong);
      setWrong(c=>c+1);setPhase("wrong");setOrderSel([]);
    }
  };

  const openGuide=()=>{setHintsUsed(h=>h+1);setGuideSlides(buildGuides(gameId,level,prob));setPhase("question");};

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
        db({table:"student_progress",method:"POST",upsertOn:"class_code,student_name,game_id",body:{class_code:student.classCode,student_name:student.name,game_id:gameId,level_reached:level+1,exercises_completed:totalEx.current,completed:level>=game.levels,last_played:new Date().toISOString()}}),
      ]);
      setSaving(false);setFinished(true);
    } else newProb();
  };

  const saveAndExit=async()=>{
    await db({table:"student_progress",method:"POST",upsertOn:"class_code,student_name,game_id",body:{class_code:student.classCode,student_name:student.name,game_id:gameId,level_reached:level,exercises_completed:totalEx.current,completed:false,last_played:new Date().toISOString()}});
    go("game-menu");
  };

  const pct=Math.min((cil/5)*100,100);
  const lvLabels=["Básico","Intermedio","Avanzado","Desafío","Experto"];

  // Reference table for romanos
  const ROMAN_REF = {
    1: [["I","1"],["V","5"],["X","10"]],
    2: [["I","1"],["V","5"],["X","10"],["IV","4"],["IX","9"]],
    3: [["I","1"],["V","5"],["X","10"],["L","50"],["C","100"],["IV","4"],["IX","9"],["XL","40"],["XC","90"]],
    4: [["C","100"],["D","500"],["CD","400"],["L","50"],["XL","40"]],
    5: [["M","1000"],["CM","900"],["D","500"],["CD","400"],["C","100"]],
  };

  if(finished) return (
    <div style={S.page()}>
      {thinkText&&<ThinkModal text={thinkText} onClose={()=>setThinkText(null)}/>}
      <div style={{...S.card,textAlign:"center"}}>
        <div style={{width:56,height:56,background:T.successBg,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:24}}>✓</div>
        <h2 style={{fontSize:22,fontWeight:700,color:T.text,margin:"0 0 8px"}}>Nivel {level} completado</h2>
        {level<game.levels&&<p style={{color:T.success,fontSize:14,fontWeight:600,margin:"0 0 24px"}}>Desbloqueaste el Nivel {level+1}.</p>}
        {level>=game.levels&&<p style={{color:T.muted,fontSize:14,margin:"0 0 24px"}}>¡Completaste todos los niveles de este juego!</p>}
        <div style={{background:T.bg,borderRadius:T.radiusSm,padding:"16px 20px",marginBottom:24,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <div><div style={{fontSize:28,fontWeight:700,color:"#2563EB"}}>{score}</div><div style={{fontSize:12,color:T.hint}}>puntos</div></div>
          <div><div style={{fontSize:28,fontWeight:700,color:T.success}}>{correct}</div><div style={{fontSize:12,color:T.hint}}>correctas</div></div>
          <div><div style={{fontSize:28,fontWeight:700,color:T.error}}>{wrong}</div><div style={{fontSize:12,color:T.hint}}>errores</div></div>
        </div>
        {saving?<p style={{color:T.hint,fontSize:13,marginBottom:12}}>Guardando progreso...</p>:<p style={{color:T.success,fontSize:13,marginBottom:12,fontWeight:600}}>Progreso guardado correctamente.</p>}
        <button style={S.btn("#334155","filled",{width:"100%"})} onClick={()=>go("game-menu")}>Volver a los juegos</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:`${game.color}08`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Inter',system-ui,sans-serif"}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {guideSlides&&<GuideModal slides={guideSlides} onClose={()=>setGuideSlides(null)}/>}
      {thinkText&&<ThinkModal text={thinkText} onClose={()=>setThinkText(null)}/>}

      {/* Header */}
      <div style={{width:"100%",maxWidth:520,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button onClick={saveAndExit} style={S.btn("#F1F5F9","filled",{color:T.muted,fontSize:13})}>← Volver al menú</button>
        <div style={{display:"flex",gap:8}}>
          <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radiusSm,padding:"6px 12px",fontWeight:600,color:T.success,fontSize:13}}>{correct} correctas</div>
          <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radiusSm,padding:"6px 12px",fontWeight:600,color:"#2563EB",fontSize:13}}>{score} pts</div>
        </div>
      </div>

      <div style={{marginBottom:10,background:game.color,color:"white",borderRadius:T.radiusSm,padding:"5px 14px",fontWeight:600,fontSize:13}}>
        {game.name} · Nivel {level} — {lvLabels[level-1]}
      </div>

      {/* Roman reference card */}
      {gameId==="romanos"&&(
        <div style={{width:"100%",maxWidth:520,marginBottom:12,background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radiusSm,padding:"10px 16px"}}>
          <div style={{fontSize:11,color:T.hint,fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>Símbolos de este nivel</div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            {(ROMAN_REF[level]||[]).map(([sym,val])=>(
              <div key={sym} style={{background:`${game.color}15`,borderRadius:8,padding:"4px 10px",display:"flex",gap:6,alignItems:"center"}}>
                <span style={{fontWeight:800,color:game.color,fontSize:16,fontFamily:"serif"}}>{sym}</span>
                <span style={{fontSize:13,color:T.muted}}>=</span>
                <span style={{fontWeight:700,color:T.text,fontSize:14}}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      <div style={{width:"100%",maxWidth:520,marginBottom:16}}>
        <div style={{background:T.border,borderRadius:99,height:6,overflow:"hidden"}}>
          <div style={{height:"100%",background:game.color,width:`${pct}%`,borderRadius:99,transition:"width 0.4s"}}/>
        </div>
        <div style={{fontSize:11,color:T.hint,textAlign:"right",marginTop:4}}>{cil} de 5 ejercicios</div>
      </div>

      <div style={{...S.card,maxWidth:520,animation:"fadeUp 0.2s ease"}}>

        {/* QUESTION */}
        {phase==="question"&&(
          <>
            <p style={{textAlign:"center",color:T.hint,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:20}}>
              {prob.type==="order"?(prob.question||"Ordená de menor a mayor"):prob.type==="pick2"?(prob.question||"Elegí la opción correcta"):"Resolvé"}
            </p>

            {prob.type==="input"&&(
              <>
                <div style={{textAlign:"center",marginBottom:20}}>
                  <p style={{fontSize:prob.expr.length>40?16:prob.subtype==="read"?32:22,fontWeight:700,color:T.text,margin:0,lineHeight:1.5,fontFamily:prob.subtype==="read"?"serif":"inherit"}}>
                    {prob.expr.includes("___")||prob.expr.endsWith("?")?prob.expr:`${prob.expr}`}
                  </p>
                </div>
                <input ref={inputRef} type="text"
                  inputMode={prob.flexible?"text":prob.subtype==="write"?"text":"numeric"}
                  placeholder={prob.placeholder||(prob.subtype==="write"?"Escribí en números romanos":"Escribí el resultado")}
                  value={answer} autoFocus
                  onChange={e=>setAnswer(prob.flexible?e.target.value:prob.subtype==="write"?e.target.value.toUpperCase():e.target.value.replace(/[^0-9]/g,""))}
                  onKeyDown={e=>e.key==="Enter"&&answer.trim()&&checkAnswer()}
                  style={{...S.input,fontSize:prob.subtype==="write"?22:18,fontWeight:700,textAlign:"center",marginBottom:12,borderColor:answer?game.color:T.border,fontFamily:prob.subtype==="write"?"serif":"inherit"}}
                />
                <button onClick={()=>answer.trim()&&checkAnswer()} disabled={!answer.trim()}
                  style={S.btn(answer.trim()?game.color:"#E2E8F0","filled",{width:"100%",color:answer.trim()?"white":T.hint,cursor:answer.trim()?"pointer":"not-allowed"})}>
                  Comprobar
                </button>
              </>
            )}

            {prob.type==="pick2"&&(
              <>
                <p style={{textAlign:"center",fontSize:15,color:T.text,fontWeight:600,marginBottom:24}}>{prob.question}</p>
                <div style={{display:"flex",gap:16,justifyContent:"center"}}>
                  {prob.options.map((n,i)=>(
                    <button key={i} onClick={()=>checkAnswer(String(n))}
                      style={{flex:1,padding:"24px 16px",borderRadius:T.radius,border:`2px solid ${T.border}`,background:T.white,cursor:"pointer",fontFamily:"serif",transition:"all 0.15s",fontSize:28,fontWeight:700,color:T.text}}>
                      {n}
                    </button>
                  ))}
                </div>
              </>
            )}

            {prob.type==="order"&&(
              <>
                <p style={{textAlign:"center",fontSize:13,color:T.muted,marginBottom:14}}>{prob.descending?"Tocá los números de mayor a menor:":"Tocá los números de menor a mayor:"}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:16}}>
                  {prob.nums.map((n,i)=>{const selIdx=orderSelected.indexOf(n),sel=selIdx!==-1;return(
                    <button key={`${n}-${i}`} onClick={()=>{if(sel)setOrderSel(orderSelected.filter(x=>x!==n));else setOrderSel([...orderSelected,n]);}}
                      style={S.btn(sel?game.color:"#F1F5F9","filled",{color:sel?"white":T.text,padding:"12px 16px",fontSize:18,fontWeight:700,minWidth:80,position:"relative"})}>
                      {n}{sel&&<span style={{position:"absolute",top:-8,right:-8,background:"#1E293B",color:"white",borderRadius:99,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{selIdx+1}</span>}
                    </button>
                  );})}
                </div>
                {orderSelected.length>0&&<div style={{background:T.bg,borderRadius:T.radiusSm,padding:"10px 14px",marginBottom:12,fontSize:13,color:T.muted}}>Tu orden: {orderSelected.join(" → ")}</div>}
                <div style={{display:"flex",gap:8}}>
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

        {/* WRONG */}
        {phase==="wrong"&&(
          <div style={{animation:"fadeUp 0.2s ease"}}>
            <div style={{background:T.errorBg,border:`1px solid #FECACA`,borderRadius:T.radiusSm,padding:"14px 16px",marginBottom:20}}>
              <p style={{fontSize:14,color:T.error,fontWeight:600,margin:0,lineHeight:1.5}}>{feedback}</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={openGuide} style={S.btn("#334155","filled",{width:"100%"})}>Ver guía</button>
              <button onClick={()=>{setAnswer("");setOrderSel([]);setPhase("question");}} style={S.btn("#F1F5F9","filled",{width:"100%",color:T.text})}>Intentar nuevamente</button>
              <button onClick={()=>{if(prob.type==="order")setOrderSel(Array.isArray(lastAnswer)?[...lastAnswer]:[]);else setAnswer(typeof lastAnswer==="string"?lastAnswer:"");setPhase("question");}}
                style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:13,textDecoration:"underline",padding:"6px 0",fontFamily:"inherit"}}>
                ← Volver y revisar mi respuesta
              </button>
            </div>
          </div>
        )}

        {/* CORRECT */}
        {phase==="correct"&&(
          <div style={{animation:"fadeUp 0.2s ease"}}>
            <div style={{background:T.successBg,border:`1px solid #BBF7D0`,borderRadius:T.radiusSm,padding:"14px 16px",marginBottom:20}}>
              <p style={{fontSize:14,color:T.success,fontWeight:600,margin:0,lineHeight:1.5}}>{feedback}</p>
            </div>
            {showReflect&&(
              <div style={{background:"#F5F3FF",border:`1px solid #DDD6FE`,borderRadius:T.radiusSm,padding:"16px",marginBottom:16}}>
                <p style={{fontSize:13,fontWeight:700,color:"#6D28D9",margin:"0 0 10px",lineHeight:1.5}}>{reflectQ}</p>
                {!reflectSaved?(
                  <>
                    <textarea placeholder="Escribí tu respuesta (optativo)..." value={reflectAns} onChange={e=>setReflectAns(e.target.value)}
                      style={{width:"100%",padding:"10px 12px",borderRadius:T.radiusSm,border:`1.5px solid #DDD6FE`,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",resize:"none",minHeight:64,marginBottom:8}}/>
                    <div style={{display:"flex",gap:8}}>
                      {reflectAns.trim()&&<button onClick={saveReflection} style={S.btn(T.success,"filled",{flex:1,fontSize:13})}>Guardar</button>}
                      <button onClick={handleContinue} style={S.btn("#F1F5F9","filled",{flex:1,color:T.muted,fontSize:13})}>Omitir</button>
                    </div>
                  </>
                ):(
                  <>
                    <p style={{color:T.success,fontSize:13,fontWeight:600,margin:"0 0 12px"}}>Respuesta guardada. Tu docente la va a ver.</p>
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

      <p style={{color:T.hint,fontSize:11,marginTop:14}}>{student.name} · {game.name} · Nivel {level}</p>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen]           =useState("home");
  const [teacher,setTeacher]         =useState(null);
  const [student,setStudent]         =useState(null);
  const [gameSession,setGameSession] =useState(null);
  const [repeatMode,setRepeatMode]   =useState(false);

  const go=(scr)=>{
    if(scr==="game-player"&&gameSession?.alreadyDone&&!repeatMode){
      setScreen("completed-level");
      return;
    }
    setRepeatMode(false);
    setScreen(scr);
  };

  return (
    <>
      {screen==="home"              &&<Home go={go}/>}
      {screen==="teacher-login"     &&<TeacherLogin go={go} setTeacher={setTeacher}/>}
      {screen==="teacher-dashboard" &&<TeacherDashboard go={go}/>}
      {screen==="student-enter"     &&<StudentEnter go={go} setStudent={setStudent}/>}
      {screen==="game-menu"         &&student&&<GameMenu student={student} go={go} setGameSession={setGameSession}/>}
      {screen==="completed-level"   &&student&&gameSession&&(
        <CompletedLevel student={student} gameSession={gameSession} go={go}
          onRepeat={()=>{setRepeatMode(true);setScreen("game-player");}}/>
      )}
      {screen==="game-player"       &&student&&gameSession&&<GamePlayer student={student} gameSession={gameSession} go={go}/>}
    </>
  );
}
