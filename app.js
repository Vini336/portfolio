let base = "principal";
let cv = 13;
let filtro = false;

let itens = [];

function getIcone(tipo){
  const icones = {
    defesa: "🛡️",
    heroi: "👑",
    armadilha: "💣",
    lab: "🧪",
    muro: "🧱"
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

  // 🔥 MUROS AGRUPADOS
  const muros = DB[base].muros;

  itens.push({
    id: "muro_unico",
    nome: "Muro",
    tipo: "muro",
    niveis: {
      1: muros.qtd
    },
    max: muros.max
  });

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

// 🔥 UPAR MURO
function uparMuro(nivel, quantidade = 1){
  const muro = itens.find(i => i.tipo === "muro");
  if(!muro) return;

  if(!muro.niveis[nivel] || muro.niveis[nivel] <= 0) return;
  if(nivel >= muro.max) return;

  const disponivel = muro.niveis[nivel];

  // limita pra não passar do que existe
  const qtdReal = Math.min(quantidade, disponivel);

  // remove do nível atual
  muro.niveis[nivel] -= qtdReal;

  // adiciona no próximo nível
  const prox = nivel + 1;
  muro.niveis[prox] = (muro.niveis[prox] || 0) + qtdReal;

  salvar();
  render();
}
function descerMuro(nivel){
  const muro = itens.find(i => i.tipo === "muro");
  if(!muro) return;

  if(!muro.niveis[nivel] || muro.niveis[nivel] <= 0) return;

  if(nivel <= 1) return; // não pode descer abaixo do nível 1

  // remove 1 do nível atual
  muro.niveis[nivel]--;

  // adiciona no nível anterior
  const anterior = nivel - 1;
  muro.niveis[anterior] = (muro.niveis[anterior] || 0) + 1;

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

  const termo = document.getElementById("pesquisa")?.value.toLowerCase() || "";

  const categorias = {
    defesa: [],
    heroi: [],
    armadilha: [],
    lab: [],
    muro: []
  };

  itens.forEach(i=>{
    categorias[i.tipo].push(i);
  });

  const nomes = {
    defesa:"🛡 Defesas",
    heroi:"👑 Heróis",
    armadilha:"💣 Armadilhas",
    lab:"🧪 Laboratório",
    muro:"🧱 Muros"
  };

  Object.keys(categorias).forEach(tipo=>{

    if(categorias[tipo].length === 0) return;

    lista.innerHTML += `<h3>${nomes[tipo]}</h3>`;

    categorias[tipo].forEach(i=>{

      // 🔥 MURO ESPECIAL
      if(i.tipo === "muro"){

        Object.keys(i.niveis).sort((a,b)=>a-b).forEach(nivel=>{
          const qtd = i.niveis[nivel];
          const nivelNum = Number(nivel);

          if(qtd <= 0) return;

          lista.innerHTML += `
            <div class="item">
              <div class="item-top">
                <div style="font-size:22px;">🧱</div>
                <div>
                  <strong>Muro</strong>
                  <div><span class="nivel">${nivelNum}</span> (${qtd}x)</div>
                </div>
              </div>

              <div class="item-buttons">
  <button onclick="descerMuro(${nivelNum})">⬇</button>

  <button onclick="uparMuro(${nivelNum}, 1)">+1</button>
  <button onclick="uparMuro(${nivelNum}, 10)">+10</button>
  <button onclick="uparMuro(${nivelNum}, 50)">+50</button>
  <button onclick="uparMuro(${nivelNum}, 9999)">MAX</button>
</div>
            </div>
          `;
        });

        return;
      }

      // 🔍 PESQUISA
      if(termo && !i.nome.toLowerCase().includes(termo)) return;

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

          <div class="item-top">
            <div style="font-size:22px;">
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

          <div class="item-buttons">

            <button onclick="togglePrioridade('${i.id}')">
              ${i.prioridade ? "⭐" : "☆"}
            </button>

            <button onclick="descer('${i.id}')">
              ⬇
            </button>

            <button onclick="upar('${i.id}')" ${isMax ? "disabled" : ""}>
              ${isMax ? "MAX" : "⬆"}
            </button>

          </div>

        </div>
      `;
    });
  });

  const progresso = total ? Math.floor((atual / total) * 100) : 0;

  document.getElementById("barra").style.width = progresso + "%";

  document.getElementById("contador").innerText =
    `Faltam ${falta} upgrades | 💰 ${custoTotal.toLocaleString()} | ⏱ ${tempoTotal}h | ${progresso}%`;
}

carregar();
render();
