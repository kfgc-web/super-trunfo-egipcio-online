/* ============================================================
   SUPER TRUNFO EGÍPCIO — Lógica do jogo
   Single-player: humano vs CPU
   ============================================================ */

// ====== Estado global ======
let maoJogador = [];
let maoCpu = [];
let pilhaDisputa = [];
let quemEscolhe = "jogador";   // 'jogador' ou 'cpu'
let rodadaResolvida = false;   // trava cliques duplicados

const ATRIBUTOS = ["poder", "inteligencia", "forca", "agressividade"];

const LABELS = {
  poder:         "Poder",
  inteligencia:  "Inteligência",
  forca:         "Força",
  agressividade: "Agressividade"
};

// ====== Utilidades ======
function embaralhar(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function mostrarTela(idTela) {
  document.querySelectorAll(".tela").forEach(t => t.classList.remove("ativa"));
  document.getElementById(idTela).classList.add("ativa");
}

// Compara o rank de duas cartas (regra de desempate final)
// Letras: A > B > C > D | Números: 1 > 2 > ... > 8
// Retorna a carta de rank mais alto
function rankMaisAlto(c1, c2) {
  const naipe1 = c1.id.slice(-1);
  const naipe2 = c2.id.slice(-1);
  if (naipe1 !== naipe2) {
    return naipe1 < naipe2 ? c1 : c2; // 'A' < 'B' alfabeticamente, então A vence
  }
  const num1 = parseInt(c1.id.slice(0, -1), 10);
  const num2 = parseInt(c2.id.slice(0, -1), 10);
  return num1 < num2 ? c1 : c2;
}

// ====== Inicialização da partida ======
function iniciarJogo() {
  const baralho = embaralhar(window.CARTAS);
  maoJogador = baralho.slice(0, 16);
  maoCpu = baralho.slice(16, 32);
  pilhaDisputa = [];
  quemEscolhe = "jogador";
  rodadaResolvida = false;
  mostrarTela("tela-jogo");
  renderizarRodada();
}

// ====== Renderização da rodada ======
function renderizarRodada() {
  rodadaResolvida = false;
  atualizarPlacar();

  // Mostra a carta atual do jogador
  const cartaJ = maoJogador[0];
  document.getElementById("carta-jogador").innerHTML = htmlCartaCompleta(cartaJ);

  // Esconde a carta da CPU
  document.getElementById("carta-cpu").innerHTML = `<div class="carta-verso">?</div>`;

  // Atualiza os valores nos botões de atributo
  document.querySelectorAll(".valor-attr").forEach(span => {
    const attr = span.dataset.valor;
    span.textContent = cartaJ[attr];
  });

  // Limpa classes de status na mensagem
  const msg = document.getElementById("mensagem");
  msg.className = "";

  document.getElementById("btn-proxima").style.display = "none";

  if (quemEscolhe === "jogador") {
    msg.textContent = "Sua vez — escolha um atributo";
    habilitarBotoes(true);
  } else {
    msg.textContent = "A CPU está escolhendo...";
    habilitarBotoes(false);
    setTimeout(escolherAtributoCpu, 1400);
  }
}

function htmlCartaCompleta(carta) {
  return `
    <img src="${carta.imagem}" alt="${carta.nome}" />
    <div class="carta-nome">
      ${carta.nome}
      ${carta.superTrunfo ? '<span class="super-trunfo-tag">★ SUPER TRUNFO ★</span>' : ""}
    </div>
  `;
}

function atualizarPlacar() {
  document.getElementById("cartas-jogador").textContent = maoJogador.length;
  document.getElementById("cartas-cpu").textContent = maoCpu.length;
  document.getElementById("cartas-pilha").textContent = pilhaDisputa.length;
}

function habilitarBotoes(habilitar) {
  document.querySelectorAll(".btn-attr").forEach(b => b.disabled = !habilitar);
}

// ====== IA da CPU (V1: escolhe o maior atributo da própria carta) ======
function escolherAtributoCpu() {
  const carta = maoCpu[0];
  let melhor = ATRIBUTOS[0];
  for (const attr of ATRIBUTOS) {
    if (carta[attr] > carta[melhor]) melhor = attr;
  }
  resolverRodada(melhor);
}

// ====== Resolução da rodada ======
function resolverRodada(atributo) {
  if (rodadaResolvida) return;
  rodadaResolvida = true;
  habilitarBotoes(false);

  const cartaJ = maoJogador[0];
  const cartaC = maoCpu[0];
  const valorJ = cartaJ[atributo];
  const valorC = cartaC[atributo];

  // Revela a carta da CPU
  document.getElementById("carta-cpu").innerHTML = htmlCartaCompleta(cartaC);

  // Remove as cartas do topo das mãos
  maoJogador.shift();
  maoCpu.shift();

  const msg = document.getElementById("mensagem");
  let texto = `${LABELS[atributo]} — Você: <strong>${valorJ}</strong> | CPU: <strong>${valorC}</strong>. `;

  if (valorJ > valorC) {
    maoJogador.push(cartaJ, cartaC, ...pilhaDisputa);
    const ganhou = 2 + pilhaDisputa.length;
    pilhaDisputa = [];
    quemEscolhe = "jogador";
    texto += `✓ Você venceu (+${ganhou} cartas).`;
    msg.className = "vitoria";

  } else if (valorC > valorJ) {
    maoCpu.push(cartaC, cartaJ, ...pilhaDisputa);
    const perdeu = 2 + pilhaDisputa.length;
    pilhaDisputa = [];
    quemEscolhe = "cpu";
    texto += `✗ CPU venceu (–${perdeu} cartas).`;
    msg.className = "derrota";

  } else {
    // EMPATE
    if (maoJogador.length === 0 && maoCpu.length === 0) {
      // Caso especial: empate na última carta de ambos. Desempate por rank.
      const todas = [cartaJ, cartaC, ...pilhaDisputa];
      pilhaDisputa = [];
      const vencedora = rankMaisAlto(cartaJ, cartaC);
      if (vencedora === cartaJ) {
        maoJogador.push(...todas);
        texto += `Empate, mas no rank ${cartaJ.id} vence ${cartaC.id}. Você leva tudo!`;
        msg.className = "vitoria";
      } else {
        maoCpu.push(...todas);
        texto += `Empate, mas no rank ${cartaC.id} vence ${cartaJ.id}. A CPU leva tudo.`;
        msg.className = "derrota";
      }
    } else {
      // Empate normal: cartas vão para a pilha de disputa
      pilhaDisputa.push(cartaJ, cartaC);
      texto += `Empate! Cartas vão para a pilha de disputa (${pilhaDisputa.length} acumuladas).`;
      msg.className = "empate";
      // Quem escolheu continua escolhendo
    }
  }

  msg.innerHTML = texto;
  atualizarPlacar();

  // Verifica fim de jogo
  if (maoJogador.length === 0 || maoCpu.length === 0) {
    setTimeout(fimDeJogo, 2200);
  } else {
    document.getElementById("btn-proxima").style.display = "inline-block";
  }
}

// ====== Fim de jogo ======
function fimDeJogo() {
  let resultado, resumo;
  if (maoJogador.length > 0 && maoCpu.length === 0) {
    resultado = "🏆 Vitória!";
    resumo = `Você dominou os 32 cartas. A CPU caiu diante dos deuses.`;
  } else if (maoCpu.length > 0 && maoJogador.length === 0) {
    resultado = "💀 Derrota";
    resumo = `A CPU ficou com todas as cartas. Tente novamente.`;
  } else {
    resultado = "Empate técnico";
    resumo = `Situação rara: nenhum jogador conseguiu vencer.`;
  }
  document.getElementById("resultado-final").textContent = resultado;
  document.getElementById("resumo-final").textContent = resumo;
  mostrarTela("tela-fim");
}

// ====== Listeners ======
document.getElementById("btn-iniciar").addEventListener("click", iniciarJogo);
document.getElementById("btn-recomecar").addEventListener("click", iniciarJogo);
document.getElementById("btn-proxima").addEventListener("click", renderizarRodada);

document.querySelectorAll(".btn-attr").forEach(btn => {
  btn.addEventListener("click", () => {
    if (quemEscolhe === "jogador") {
      resolverRodada(btn.dataset.attr);
    }
  });
});

// ====== Música de fundo (começa DESLIGADA) ======
// O jogo abre em silêncio. O navegador bloqueia áudio que toca sozinho, mas
// o clique do jogador NESTE botão já é o "gesto" que libera o som — por isso
// a música só começa quando ele toca aqui pela primeira vez. Depois, cada
// clique alterna entre ligar e desligar (pausa, sem perder a posição).
const musicaFundo = document.getElementById("musica-fundo");
const btnSom = document.getElementById("btn-som");

btnSom.addEventListener("click", () => {
  if (musicaFundo.paused) {
    musicaFundo.play().catch(() => {}); // liga (ou retoma) em loop
    btnSom.textContent = "🔊";
    btnSom.setAttribute("aria-label", "Desligar a música");
    btnSom.setAttribute("title", "Música: ligada");
  } else {
    musicaFundo.pause();                 // desliga, mantendo a posição
    btnSom.textContent = "🔇";
    btnSom.setAttribute("aria-label", "Ligar a música");
    btnSom.setAttribute("title", "Música: desligada");
  }
});
