const $=s=>document.querySelector(s);
const pantallas={inicio:$("#inicio"),menu:$("#menu"),juego:$("#juego"),final:$("#final")};
const caras=["⚀","⚁","⚂","⚃","⚄","⚅"];
const estado={colegio:"",op:"",turno:1,puntos:0,nivel:1,a:1,b:1,c:1,correcta:0,respondido:false,aciertos:0};

function mostrar(nombre){Object.values(pantallas).forEach(p=>p.classList.remove("activa"));pantallas[nombre].classList.add("activa");}

// ===== SONIDOS Y VOZ (sin archivos externos) =====
let audioCtx=null;
function activarAudio(){
  try{
    if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==="suspended") audioCtx.resume();
  }catch(e){}
}
function tono(freq,duracion,tipo="sine",vol=.07,cuando=0){
  try{
    activarAudio();
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type=tipo;o.frequency.value=freq;
    g.gain.setValueAtTime(0.0001,audioCtx.currentTime+cuando);
    g.gain.exponentialRampToValueAtTime(vol,audioCtx.currentTime+cuando+.02);
    g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+cuando+duracion);
    o.connect(g);g.connect(audioCtx.destination);
    o.start(audioCtx.currentTime+cuando);o.stop(audioCtx.currentTime+cuando+duracion+.03);
  }catch(e){}
}
function aplausos(){
  try{
    activarAudio();
    // Aplausos electrónicos: varios golpes cortos + campanitas.
    for(let i=0;i<14;i++){
      setTimeout(()=>{
        tono(i%2?900:1200,.055,"square",.13);
        tono(300+Math.random()*300,.035,"triangle",.07);
      },i*75);
    }
    setTimeout(()=>tono(660,.25,"triangle",.13),1150);
    setTimeout(()=>tono(880,.35,"triangle",.13),1370);
  }catch(e){}
}
function sonidoError(){
  tono(220,.18,"sawtooth",.06,0);
  tono(170,.25,"sawtooth",.05,.18);
}
function sonidoDado(){
  [330,390,450].forEach((f,i)=>tono(f,.07,"square",.035,i*.06));
}
function hablar(texto,feliz=false){
  try{
    if(!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(texto);
    u.lang="es-ES";u.rate=feliz?.95:1;u.pitch=feliz?1.25:1.05;u.volume=1;
    window.speechSynthesis.speak(u);
  }catch(e){}
}
document.addEventListener("click",activarAudio,{once:true});

function lanzarConfeti(){for(let i=0;i<18;i++){const e=document.createElement("div");e.textContent=["🎈","⭐","🎉","✨"][i%4];e.style.position="fixed";e.style.left=Math.random()*100+"vw";e.style.top="-30px";e.style.fontSize=25+Math.random()*25+"px";e.style.zIndex=99;e.style.animation=`caer ${1.5+Math.random()}s linear`;$("#confeti").appendChild(e);setTimeout(()=>e.remove(),2600)}}
const style=document.createElement("style");style.textContent="@keyframes caer{to{transform:translateY(110vh) rotate(360deg);opacity:0}}";document.head.appendChild(style);

$("#btnEmpezar").onclick=()=>{
  estado.colegio=$("#colegio").value.trim()||"Mi colegio";
  $("#nombreColegio").textContent=estado.colegio;
  mostrar("menu");
};
document.querySelectorAll(".mision").forEach(b=>b.onclick=()=>iniciar(b.dataset.op));
$("#btnVolver").onclick=()=>mostrar("menu");
$("#btnOtra").onclick=()=>mostrar("menu");

function iniciar(op){
  estado.op=op;estado.turno=1;estado.puntos=0;estado.nivel=1;estado.aciertos=0;
  $("#puntos").textContent=0;$("#turno").textContent=1;$("#nivel").textContent=1;
  const nombres={suma:"SUMAS ➕",resta:"RESTAS ➖",multiplicacion:"MULTIPLICACIÓN ✖️",combinada:"OPERACIONES COMBINADAS 🧠"};
  $("#tituloOperacion").textContent=nombres[op];
  mostrar("juego"); activarAudio(); hablar("¡Vamos a jugar! Tira los dados y responde."); nuevaPregunta();
}

function numero(max){return Math.floor(Math.random()*max)+1}
function generar(){
  let a,b,c;
  if(estado.op==="suma"){
    const max=estado.nivel===1?6:estado.nivel===2?10:estado.nivel===3?20:estado.nivel===4?50:100;
    a=numero(max);b=numero(max);return {a,b,c:0,text:`${a} + ${b} = ?`,r:a+b,s1:"+",s2:""};
  }
  if(estado.op==="resta"){
    const max=estado.nivel===1?6:estado.nivel===2?10:estado.nivel===3?20:estado.nivel===4?50:100;
    a=numero(max);b=numero(max);if(b>a)[a,b]=[b,a];
    return {a,b,c:0,text:`${a} − ${b} = ?`,r:a-b,s1:"−",s2:""};
  }
  if(estado.op==="multiplicacion"){
    const max=estado.nivel===1?5:estado.nivel===2?7:estado.nivel===3?10:estado.nivel===4?12:15;
    a=numero(max);b=numero(max);return {a,b,c:0,text:`${a} × ${b} = ?`,r:a*b,s1:"×",s2:""};
  }
  // Combinadas: dificultad progresiva y expresión clara.
  if(estado.nivel<=2){
    a=numero(9);b=numero(9);c=numero(Math.min(a+b-1,6)+1);
    return {a,b,c,text:`${a} + ${b} − ${c} = ?`,r:a+b-c,s1:"+",s2:"−"};
  }
  if(estado.nivel<=4){
    a=numero(8);b=numero(8);c=numero(10);
    return {a,b,c,text:`${a} × ${b} + ${c} = ?`,r:a*b+c,s1:"×",s2:"+"};
  }
  a=numero(10);b=numero(10);c=numero(Math.max(1,a*b-1));
  return {a,b,c,text:`${a} × ${b} − ${c} = ?`,r:a*b-c,s1:"×",s2:"−"};
}

function nuevaPregunta(){
  estado.respondido=false;
  const q=generar();Object.assign(estado,{a:q.a,b:q.b,c:q.c,correcta:q.r});
  $("#pregunta").textContent=q.text;
  $("#dado1").textContent=caras[Math.min(q.a,6)-1];
  $("#dado2").textContent=caras[Math.min(q.b,6)-1];
  $("#dado3").textContent=caras[Math.min(q.c||1,6)-1];
  $("#signo1").textContent=q.s1;$("#signo2").textContent=q.s2;
  $("#extra").classList.toggle("oculto",estado.op!=="combinada");
  $("#respuesta").value="";$("#respuesta").disabled=false;$("#btnResponder").disabled=false;
  $("#btnSiguiente").classList.add("oculto");$("#resultado").textContent="";
  $("#frase").textContent=estado.nivel===1?"¡Tira los dados! 🎲":`Nivel ${estado.nivel}: ¡puedes hacerlo! 💪`; activarAudio(); sonidoDado();
  $("#mensajePizarra").textContent=`Reto ${estado.turno}: ¡Piensa y responde!`;
  document.querySelectorAll(".dado").forEach(d=>{d.style.animation="none";void d.offsetWidth;d.style.animation="dado .45s ease"});
}

$("#btnResponder").onclick=resolver;
$("#respuesta").addEventListener("keydown",e=>{if(e.key==="Enter")resolver()});

function resolver(){
  if(estado.respondido)return;
  const valor=Number($("#respuesta").value);
  if($("#respuesta").value.trim()==="")return;
  estado.respondido=true;
  $("#respuesta").disabled=true;$("#btnResponder").disabled=true;
  const resultado=$("#resultado");
  if(valor===estado.correcta){
    const gana=10*estado.nivel;estado.puntos+=gana;estado.aciertos++;
    resultado.textContent=`🎉👏 ¡CORRECTO! +${gana} puntos ⭐🎈`;
    resultado.className="resultado correcto";
    $("#frase").textContent="¡Excelente! 🌟 ¡Avanzaste!";
    $("#mensajePizarra").textContent="¡Muy bien! Sigue así 👏";
    moverJugador(true); aplausos(); hablar("¡Correcto! ¡Excelente trabajo!",true); lanzarConfeti();
  }else{
    resultado.textContent=`❌ ¡INCORRECTO! La respuesta era ${estado.correcta}. Pierdes este turno.`;
    resultado.className="resultado incorrecto";
    $("#frase").textContent="No pasa nada 😊. ¡Perdiste este turno!";
    $("#mensajePizarra").textContent="Aprender también es equivocarse 💡";
    moverJugador(false); sonidoError(); hablar("Incorrecto. Perdiste este turno. ¡Sigue intentando!");
  }
  $("#puntos").textContent=estado.puntos;$("#puntosMenu").textContent=estado.puntos;
  $("#btnSiguiente").classList.remove("oculto");
}

$("#btnSiguiente").onclick=()=>{
  if(estado.turno>=10){terminar();return}
  estado.turno++;
  // Cada dos turnos sube la dificultad.
  estado.nivel=Math.min(5,Math.floor((estado.turno-1)/2)+1);
  $("#turno").textContent=estado.turno;$("#nivel").textContent=estado.nivel;
  nuevaPregunta();
};


function celebrarMeta(numero){
  const meta=numero===1?document.querySelector(".meta1"):document.querySelector(".meta2");
  meta.classList.add("metaLlegada");
  const e=document.createElement("div");
  e.className="explosion";
  e.textContent=numero===1?"🎉⭐🎈":"🏆🎉🎊";
  document.body.appendChild(e);
  setTimeout(()=>e.remove(),1300);
  lanzarConfeti();
  if(numero===1){
    hablar("¡Llegaste a la primera meta! ¡Muy bien!",true);
    aplausos();
    $("#frase").textContent="🎉 ¡META 1! ¡Sigue hasta el trofeo!";
  }else{
    hablar("¡Llegaste a la meta final! ¡Eres una estrella de las matemáticas!",true);
    aplausos(); aplausos();
    $("#frase").textContent="🏆 ¡META FINAL! ¡Lo lograste!";
  }
}
function moverJugador(acerto){
  const pos=Math.min(87,3+(estado.turno-1)*9.2);
  $("#jugador").style.left=pos+"%";
  $("#jugador").style.animation=acerto?"salto .7s ease":"caminar .5s ease";
  if(acerto && estado.turno===5) setTimeout(()=>celebrarMeta(1),450);
  if(acerto && estado.turno===10) setTimeout(()=>celebrarMeta(2),450);
}
const st=document.createElement("style");st.textContent="@keyframes salto{50%{transform:translateY(-28px) rotate(-8deg)}100%{transform:translateY(0)}}";document.head.appendChild(st);

function terminar(){
  $("#resumenFinal").innerHTML=`Terminaste la misión de <b>${estado.op==="suma"?"SUMAS":estado.op==="resta"?"RESTAS":estado.op==="multiplicacion"?"MULTIPLICACIÓN":"OPERACIONES COMBINADAS"}</b>.<br><br>⭐ Puntaje: <b>${estado.puntos}</b><br>🎯 Aciertos: <b>${estado.aciertos}/10</b><br><br>${estado.aciertos>=8?"🏆 ¡Eres una estrella de las matemáticas!":"🌟 ¡Buen trabajo! Sigue practicando y mejorarás aún más."}`;
  lanzarConfeti();mostrar("final");
}
