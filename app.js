let base = "principal";
let cv = 13;
let filtro = false;

let itens = [];
let muros = [];

function getIcone(tipo){
  const icones = {
    defesa: "🛡️",
    heroi: "👑",
    armadilha: "💣",
    lab: "🧪"
  };

  return icones[tipo] || "🏗️";
}

function gerarCusto(nivel){
  return {
    custo: Math.floor(1000 * Math.pow(1.8, nivel)),
    tempo: Math.floor(Math.pow(1.5, nivel))
  };
}

function mudarCV(n){ cv=Number(n); render(); }
function toggleFiltro(){ filtro=!filtro; render(); }

function resetar(){
  localStorage.removeItem("clash");
  location.reload();
}

function gerar(){
  itens = [];

  const adicionar = (lista, tipo)=>{
    lista.forEach(x=>{
      if(x.qtd){
        for(let i=0;i<x.qtd;i++){
          itens.push({
            id: crypto.randomUUID(),
            nome:x.nome,
            tipo,
            nivel:1,
            maxPorCV:x.maxPorCV,
            prioridade:false
          });
        }
      }else{
        itens.push({
          id:Date.now()+Math.random(),
          nome:x.nome,
          tipo,
          nivel:1,
          maxPorCV:x.maxPorCV,
          prioridade:false
        });
      }
    });
  };

  adicionar(DB[base].defesas, "defesa");
  adicionar(DB[base].herois, "heroi");
  adicionar(DB[base].armadilhas, "armadilha");
  adicionar(DB[base].laboratorio, "lab");

  salvar();
  render();
}

function togglePrioridade(id){
  const i = itens.find(x=>x.id===id);
  if(!i) return;

  i.prioridade = !i.prioridade;
  salvar();
  render();
}

function getMax(i){
  return i.maxPorCV?.[cv] || 0;
}

function upar(id){
  const i = itens.find(x=>x.id===id);
  if(!i) return;

  if(i.nivel < getMax(i)) i.nivel++;
  salvar();
  render();
}

function descer(id){
  const i = itens.find(x=>x.id===id);
  if(!i) return;

  if(i.nivel > 1) i.nivel--;
  salvar();
  render();
}

function salvar(){
  localStorage.setItem("clash", JSON.stringify({itens, cv}));
}

function carregar(){
  const d = JSON.parse(localStorage.getItem("clash"));
  if(!d) return;

  itens = d.itens || [];
  cv = d.cv || 13;
}

function render(){

  let falta = 0;
  let custoTotal = 0;
  let tempoTotal = 0;
  let total = 0;
  let atual = 0;

  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  const categorias = {
    defesa: [],
    heroi: [],
    armadilha: [],
    lab: []
  };

  itens.forEach(i=>{
    categorias[i.tipo].push(i);
  });

  const nomes = {
    defesa:"🛡 Defesas",
    heroi:"👑 Heróis",
    armadilha:"💣 Armadilhas",
    lab:"🧪 Laboratório"
  };

  Object.keys(categorias).forEach(tipo=>{

    if(categorias[tipo].length === 0) return;

    lista.innerHTML += `<h3>${nomes[tipo]}</h3>`;

    categorias[tipo].forEach(i=>{

      const max = getMax(i);
      const isMax = i.nivel >= max;
      const custo = gerarCusto(i.nivel);

      total += max;
      atual += i.nivel;

      if(!isMax){
        falta += (max - i.nivel);
        custoTotal += custo.custo;
        tempoTotal += custo.tempo;
      }

      if(filtro && isMax) return;

      lista.innerHTML += `
        <div class="item">

          <div style="display:flex; gap:10px; align-items:center;">
            <div style="font-size:24px;">
              ${getIcone(i.tipo)}
            </div>
            <div>
              <strong>${i.nome}</strong>
              <div><span class="nivel">${i.nivel}</span> / ${max}</div>
              <div class="info">
                💰 ${custo.custo.toLocaleString()} | ⏱ ${custo.tempo}h
              </div>
            </div>
          </div>

          <div style="display:flex; gap:5px;">
            <button class="btn-prioridade" data-id="${i.id}">
              ${i.prioridade ? "⭐" : "☆"}
            </button>

            <button class="btn-descer" data-id="${i.id}">
              ⬇
            </button>

            <button class="btn-upar" data-id="${i.id}">
              ${isMax ? "MAX" : "⬆"}
            </button>
          </div>

        </div>
      `;
    });
  });

  document.querySelectorAll(".btn-upar").forEach(btn=>{
    btn.onclick = () => upar(btn.dataset.id);
  });

  document.querySelectorAll(".btn-descer").forEach(btn=>{
    btn.onclick = () => descer(btn.dataset.id);
  });

  document.querySelectorAll(".btn-prioridade").forEach(btn=>{
    btn.onclick = () => togglePrioridade(btn.dataset.id);
  });

  const progresso = total ? Math.floor((atual / total) * 100) : 0;

  document.getElementById("barra").style.width = progresso + "%";

  document.getElementById("contador").innerText =
    `Faltam ${falta} upgrades | 💰 ${custoTotal.toLocaleString()} | ⏱ ${tempoTotal}h | ${progresso}%`;
}

carregar();
render();