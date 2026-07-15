// Desativa avisos do p5.js causados pelo MediaPipe
p5.disableFriendlyErrors = true;

let capturaVideo;
let modeloPose;
let dadosLandmarks = null;
let cameraUtils = null;
let modoCamera = "user"; // "user" = câmera frontal, "environment" = câmera traseira

// Máquina de Estado da Interface
let estadoApp = "TURMAS"; // TURMAS, GRUPOS, EXERCICIOS, PRATICA
let turmaSelecionada = "";
let grupoSelecionado = "";
let exercicioAtual = "";

// Variáveis lógicas de controle da Ginástica
let contadorRepeticoes = 0;
let movimentoDescendo = false;
let tempoExercicio = 0;

function setup() {
  // 1. RESPONSIVIDADE: O canvas agora preenche toda a tela do dispositivo
  createCanvas(windowWidth, windowHeight);
  
  capturaVideo = createCapture(VIDEO);
  capturaVideo.size(640, 480); // Resolução interna da câmera mantida por estabilidade
  capturaVideo.hide();

  modeloPose = new Pose({
	locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });

  modeloPose.setOptions({
	modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5
  });
  modeloPose.onResults(onPoseResults);

  iniciarCamera();
}

function iniciarCamera() {
  if (cameraUtils) cameraUtils.stop();
  cameraUtils = new Camera(capturaVideo.elt, {
	onFrame: async () => { await modeloPose.send({ image: capturaVideo.elt }); },
	width: 640, height: 480,
	facingMode: modoCamera
  });
  cameraUtils.start();
}

function trocarCamera() {
  dadosLandmarks = null;
  modoCamera = (modoCamera === "user") ? "environment" : "user";
  iniciarCamera();
}

// 2. RESPONSIVIDADE: Recalcula tudo se o usuário girar a tela do celular
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function onPoseResults(results) { dadosLandmarks = results.poseLandmarks ? results.poseLandmarks : null; }

// --- CONTROLE DE MENUS RESPONSIVO ---
function mousePressed() {
  // Cálculos dinâmicos para os botões caberem em qualquer tela
  let bw = min(320, width * 0.9); // Largura do botão principal (máx 320px)
  let cx = width / 2 - bw / 2;    // Centraliza o botão no eixo X
  let yInic = height * 0.15;      // Posição inicial (altura)
  let gap = min(55, height * 0.1); // Distância entre os botões
  
  if (estadoApp === "TURMAS") {
	if (clicou(cx, yInic, bw, 45)) { turmaSelecionada = "211"; estadoApp = "GRUPOS"; }
	if (clicou(cx, yInic + gap*1.2, bw, 45)) { turmaSelecionada = "212"; estadoApp = "GRUPOS"; }
	if (clicou(cx, yInic + gap*2.4, bw, 45)) { turmaSelecionada = "213"; estadoApp = "GRUPOS"; }
  } 
  else if (estadoApp === "GRUPOS") {
	if (turmaSelecionada === "213") {
	  // Layout em 2 colunas proporcionais para a Turma 213 caber no celular
	  let bw2 = width * 0.45; 
	  let col1 = width * 0.025; 
	  let col2 = width * 0.525;
	  
	  // Coluna 1
	  if (clicou(col1, yInic, bw2, 40)) { grupoSelecionado = "G1"; estadoApp = "EXERCICIOS"; }
	  if (clicou(col1, yInic + gap, bw2, 40)) { grupoSelecionado = "G2"; estadoApp = "EXERCICIOS"; }
	  if (clicou(col1, yInic + gap*2, bw2, 40)) { grupoSelecionado = "G3"; estadoApp = "EXERCICIOS"; }
	  if (clicou(col1, yInic + gap*3, bw2, 40)) { grupoSelecionado = "G4"; estadoApp = "EXERCICIOS"; }
	  if (clicou(col1, yInic + gap*4, bw2, 40)) { grupoSelecionado = "G5"; estadoApp = "EXERCICIOS"; }
	  // Coluna 2
	  if (clicou(col2, yInic, bw2, 40)) { grupoSelecionado = "G6"; estadoApp = "EXERCICIOS"; }
	  if (clicou(col2, yInic + gap, bw2, 40)) { grupoSelecionado = "G7"; estadoApp = "EXERCICIOS"; }
	  if (clicou(col2, yInic + gap*2, bw2, 40)) { grupoSelecionado = "G8"; estadoApp = "EXERCICIOS"; }
	  if (clicou(col2, yInic + gap*3, bw2, 40)) { grupoSelecionado = "G9"; estadoApp = "EXERCICIOS"; }
	  
	  // Botão voltar fica fixo no rodapé
	  if (clicou(cx, height - 70, bw, 40)) estadoApp = "TURMAS"; 
	} else {
	  // Layout de 1 coluna para Turmas 211 e 212
	  for (let i = 0; i < 6; i++) {
		if (clicou(cx, yInic + (i*gap), bw, 40)) { grupoSelecionado = "G"+(i+1); estadoApp = "EXERCICIOS"; }
	  }
	  if (clicou(cx, height - 70, bw, 40)) estadoApp = "TURMAS";
	}
  }
  else if (estadoApp === "EXERCICIOS") {
	if (clicou(cx, height * 0.3, bw, 50)) iniciarPratica(turmaSelecionada + "_" + grupoSelecionado + "_1");
	if (clicou(cx, height * 0.3 + 70, bw, 50)) iniciarPratica(turmaSelecionada + "_" + grupoSelecionado + "_2");
	if (clicou(cx, height - 70, bw, 40)) estadoApp = "GRUPOS";
  }
  else if (estadoApp === "PRATICA") {
	// Área de clique para voltar (canto superior esquerdo)
	if (clicou(0, 0, 120, 55)) estadoApp = "EXERCICIOS";
	// Área de clique para trocar câmera (canto superior direito)
	if (clicou(width - 140, 0, 140, 55)) trocarCamera();
  }
}

function clicou(x, y, w, h) { return (mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h); }

function iniciarPratica(cod) { exercicioAtual = cod; contadorRepeticoes = 0; movimentoDescendo = false; tempoExercicio = 0; estadoApp = "PRATICA"; }

function draw() {
  background(30);
  if (estadoApp === "TURMAS") desenharMenuTurmas();
  else if (estadoApp === "GRUPOS") desenharMenuGrupos();
  else if (estadoApp === "EXERCICIOS") desenharMenuExercicios();
  else if (estadoApp === "PRATICA") executarPratica();
}

// --- DESIGN DOS MENUS RESPONSIVOS ---
function desenharBotao(texto, x, y, w, h, cor = "#2196F3") {
  fill(cor); stroke(255); strokeWeight(2); rectMode(CORNER); rect(x, y, w, h, 10);
  fill(255); noStroke(); 
  textSize(w > 180 ? 17 : 12); // Diminui o texto se o botão for da coluna pequena
  textAlign(CENTER, CENTER); text(texto, x + w/2, y + h/2);
}

function desenharMenuTurmas() {
  let bw = min(320, width * 0.9); let cx = width / 2 - bw / 2;
  let yInic = height * 0.15; let gap = min(55, height * 0.1);

  fill(255); textSize(28); textAlign(CENTER); text("Selecione a Turma", width/2, height * 0.10);
  desenharBotao("Turma 211", cx, yInic, bw, 45); 
  desenharBotao("Turma 212", cx, yInic + gap*1.2, bw, 45, "#9C27B0"); 
  desenharBotao("Turma 213", cx, yInic + gap*2.4, bw, 45, "#FF9800");
}

function desenharMenuGrupos() {
  fill(255); textSize(22); textAlign(CENTER); text(`Turma ${turmaSelecionada} - Grupos`, width/2, height * 0.08);
  let bw = min(320, width * 0.9); let cx = width / 2 - bw / 2;
  let yInic = height * 0.15; let gap = min(55, height * 0.1);

  if (turmaSelecionada === "211" || turmaSelecionada === "212") {
	let g = [
	  ["Tiago, Paulo...", "Dylan, Gustavo...", "Julia, Pedro...", "Clara, Ester...", "Maria V., Emylin...", "Mariah, Maicon..."],
	  ["Eduarda, Isabelly", "Eloá, Rodrigo", "Yasmin, Athos...", "Julia, Iasmin...", "Davi, Luana...", "Gabriel, Pedro..."]
	];
	let tIdx = turmaSelecionada === "211" ? 0 : 1;
	for(let i=0; i<6; i++) desenharBotao(`G${i+1}: ${g[tIdx][i]}`, cx, yInic + (i*gap), bw, 40);
  } 
  else if (turmaSelecionada === "213") {
	let g213 = ["Nathalia, Jul...", "Sophia, Hisa...", "Nathaly, Sth...", "Nicolly, Kau...", "Yasmin, Kass...", "Mariana, Jul...", "Estevão, Vic...", "Mariah, Esth...", "Luiz, Isaac..."];
	let bw2 = width * 0.45; let col1 = width * 0.025; let col2 = width * 0.525;
	for(let i=0; i<5; i++) desenharBotao(`G${i+1}: ${g213[i]}`, col1, yInic + (i*gap), bw2, 40);
	for(let i=5; i<9; i++) desenharBotao(`G${i+1}: ${g213[i]}`, col2, yInic + ((i-5)*gap), bw2, 40);
  }
  desenharBotao("Voltar", cx, height - 70, bw, 40, "#f44336");
}

function desenharMenuExercicios() {
  let bw = min(320, width * 0.9); let cx = width / 2 - bw / 2;
  fill(255); textSize(24); textAlign(CENTER); text("Exercícios do Grupo", width/2, height * 0.15);
  let ex1 = "Exercício 1", ex2 = "Exercício 2";
  
  if (turmaSelecionada === "211") {
	if (grupoSelecionado === "G1") { ex1 = "Flexão de Braço"; ex2 = "Agachamento Lateral"; }
	else if (grupoSelecionado === "G2") { ex1 = "Afundo"; ex2 = "Agachamento na Parede"; }
	else if (grupoSelecionado === "G3") { ex1 = "Abdominal"; ex2 = "Flexão de Bíceps"; }
	else if (grupoSelecionado === "G4") { ex1 = "Flexão de Bíceps"; ex2 = "Prancha Isométrica"; }
	else if (grupoSelecionado === "G5") { ex1 = "Flexão de Bíceps"; ex2 = "Elevação de Joelho"; }
	else if (grupoSelecionado === "G6") { ex1 = "Flexão de Braço"; ex2 = "Abdominal"; }
  } else if (turmaSelecionada === "212") {
	if (grupoSelecionado === "G1") { ex1 = "Polichinelo"; ex2 = "Abdominal"; }
	else if (grupoSelecionado === "G2") { ex1 = "Afundo"; ex2 = "Abdominal"; }
	else if (grupoSelecionado === "G3") { ex1 = "Barra Fixa Supinada"; ex2 = "Rosca Direta (Halter)"; }
	else if (grupoSelecionado === "G4") { ex1 = "Flexão de Bíceps"; ex2 = "Abdominal"; }
	else if (grupoSelecionado === "G5") { ex1 = "Flexão de Bíceps"; ex2 = "Abdominal"; }
	else if (grupoSelecionado === "G6") { ex1 = "Flexão de Braço"; ex2 = "Abdominal"; }
  } else if (turmaSelecionada === "213") {
	if (grupoSelecionado === "G1") { ex1 = "Flexão de Bíceps (Alinhada)"; ex2 = "Abdominal (30º)"; }
	else if (grupoSelecionado === "G2") { ex1 = "Elevação Lateral (90º)"; ex2 = "Bíceps Curto (130º)"; }
	else if (grupoSelecionado === "G3") { ex1 = "Afundo"; ex2 = "Polichinelo (Distância)"; }
	else if (grupoSelecionado === "G4") { ex1 = "Braços acima da Cabeça"; ex2 = "Ponte de Glúteos"; }
	else if (grupoSelecionado === "G5") { ex1 = "Polichinelo Completo"; ex2 = "Equilíbrio 1 Pé (Tempo)"; }
	else if (grupoSelecionado === "G6") { ex1 = "Yoga: Upward Dog"; ex2 = "Rosca Scott"; }
	else if (grupoSelecionado === "G7") { ex1 = "Flexão de Braço"; ex2 = "Abdominal Completo"; }
	else if (grupoSelecionado === "G8") { ex1 = "Polichinelo (Padrão IA)"; ex2 = "Corrida Parada"; }
	else if (grupoSelecionado === "G9") { ex1 = "Flexão (Regra > 60º)"; ex2 = "Polichinelo (Bater Palma)"; }
  }

  desenharBotao(ex1, cx, height * 0.3, bw, 50, "#4CAF50"); 
  desenharBotao(ex2, cx, height * 0.3 + 70, bw, 50, "#4CAF50"); 
  desenharBotao("Voltar", cx, height - 70, bw, 40, "#f44336");
}

// --- TELA DA CÂMERA ---
function executarPratica() {
  // A imagem se ajusta para o tamanho total da tela do celular/computador
  if (modoCamera === "user") {
    translate(width, 0); scale(-1, 1);
    image(capturaVideo, 0, 0, width, height);
    translate(width, 0); scale(-1, 1);
  } else {
    image(capturaVideo, 0, 0, width, height);
  }

  if (dadosLandmarks) {
	desenharEsqueleto(dadosLandmarks);
	roteadorTurma211(dadosLandmarks);
	roteadorTurma212(dadosLandmarks);
	roteadorTurma213(dadosLandmarks);
  } else { exibirFeedback("Aguardando aluno na câmera...", "#FFFFFF"); }

  // Painel estático Superior (Responsivo)
  fill(0, 0, 0, 180); rectMode(CORNER); noStroke(); rect(0, 0, width, 55);
  let tsBar = constrain(min(width, height) * 0.055, 16, 22);
  fill(255); textAlign(LEFT, CENTER); textSize(tsBar); text("⬅ Voltar", 15, 27);
  textAlign(CENTER, CENTER); text(`Placar: ${contadorRepeticoes + tempoExercicio}`, width / 2, 27);
  textAlign(RIGHT, CENTER); text(modoCamera === "user" ? "📷 Traseira" : "📷 Frontal", width - 10, 27);
}

// =========================================================================
// ROTEADORES
// =========================================================================
function roteadorTurma211(lm) {
  if(exercicioAtual==="211_G1_1") regraTiagoFlexao(lm); if(exercicioAtual==="211_G1_2") regraTiagoAgachamentoLat(lm);
  if(exercicioAtual==="211_G2_1") regraDylanAfundo(lm); if(exercicioAtual==="211_G2_2") regraDylanParede(lm);
  if(exercicioAtual==="211_G3_1") regraJuliaAbdominal(lm); if(exercicioAtual==="211_G3_2") regraJuliaBiceps(lm);
  if(exercicioAtual==="211_G4_1") regraClaraBiceps(lm); if(exercicioAtual==="211_G4_2") regraClaraPrancha(lm);
  if(exercicioAtual==="211_G5_1") regraVitoriaBiceps(lm); if(exercicioAtual==="211_G5_2") regraVitoriaElevacao(lm);
  if(exercicioAtual==="211_G6_1") regraMariahFlexao(lm); if(exercicioAtual==="211_G6_2") regraMariahAbdominal(lm);
}
function roteadorTurma212(lm) {
  if(exercicioAtual==="212_G1_1") regraT212_EduardaPoli(lm); if(exercicioAtual==="212_G1_2") regraT212_EduardaAbd(lm);
  if(exercicioAtual==="212_G2_1") regraT212_EloaAfundo(lm); if(exercicioAtual==="212_G2_2") regraT212_EloaAbd(lm);
  if(exercicioAtual==="212_G3_1") regraT212_YasminBarra(lm); if(exercicioAtual==="212_G3_2") regraT212_YasminRosca(lm);
  if(exercicioAtual==="212_G4_1") regraT212_JuliaBiceps(lm); if(exercicioAtual==="212_G4_2") regraT212_JuliaAbd(lm);
  if(exercicioAtual==="212_G5_1") regraT212_DaviBiceps(lm); if(exercicioAtual==="212_G5_2") regraT212_DaviAbd(lm);
  if(exercicioAtual==="212_G6_1") regraT212_GabrielFlexao(lm); if(exercicioAtual==="212_G6_2") regraT212_GabrielAbd(lm);
}
function roteadorTurma213(lm) {
  if(exercicioAtual==="213_G1_1") regraT213_G1_Biceps(lm); if(exercicioAtual==="213_G1_2") regraT213_G1_Abd(lm);
  if(exercicioAtual==="213_G2_1") regraT213_G2_Lat(lm); if(exercicioAtual==="213_G2_2") regraT213_G2_Biceps(lm);
  if(exercicioAtual==="213_G3_1") regraT213_G3_Afundo(lm); if(exercicioAtual==="213_G3_2") regraT213_G3_Poli(lm);
  if(exercicioAtual==="213_G4_1") regraT213_G4_Braco(lm); if(exercicioAtual==="213_G4_2") regraT213_G4_Ponte(lm);
  if(exercicioAtual==="213_G5_1") regraT213_G5_Poli(lm); if(exercicioAtual==="213_G5_2") regraT213_G5_Equil(lm);
  if(exercicioAtual==="213_G6_1") regraT213_G6_Yoga(lm); if(exercicioAtual==="213_G6_2") regraT213_G6_Scott(lm);
  if(exercicioAtual==="213_G7_1") regraT213_G7_Flex(lm); if(exercicioAtual==="213_G7_2") regraT213_G7_Abd(lm);
  if(exercicioAtual==="213_G8_1") regraT213_G8_Poli(lm); if(exercicioAtual==="213_G8_2") regraT213_G8_Corrida(lm);
  if(exercicioAtual==="213_G9_1") regraT213_G9_Flexao(lm); if(exercicioAtual==="213_G9_2") regraT213_G9_Poli(lm);
}

// =========================================================================
// NOVAS LÓGICAS (G8 e G9 da Turma 213)
// =========================================================================

// G8: Mariah, Esthefany e Raffaela
function regraT213_G8_Poli(lm) {
  let bracoAlto = lm[15].y < lm[11].y; 
  let pernaAfastada = Math.abs(lm[27].x - lm[28].x) > 0.20; 
  desenharMetrica("Distância Pés: " + Math.abs(lm[27].x - lm[28].x).toFixed(2), lm[27]);

  if (bracoAlto && pernaAfastada) { 
	exibirFeedback("Afastou! Feche para contar.", "#00FF00"); 
	movimentoDescendo = true; 
  } else if (!bracoAlto && !pernaAfastada && movimentoDescendo) { 
	contadorRepeticoes++; 
	movimentoDescendo = false; 
  } else {
	exibirFeedback("Faça o Polichinelo", "#FFFFFF");
  }
}

function regraT213_G8_Corrida(lm) {
  let esqSubiu = lm[25].y < lm[23].y + 0.10;
  let dirSubiu = lm[26].y < lm[24].y + 0.10;
  desenharMetrica("Joelho Esq Y: " + lm[25].y.toFixed(2), lm[25]);
  desenharMetrica("Joelho Dir Y: " + lm[26].y.toFixed(2), lm[26]);

  if (esqSubiu && !movimentoDescendo) {
	contadorRepeticoes++; 
	movimentoDescendo = true; 
	exibirFeedback("Joelho Esquerdo! Suba o Direito.", "#00FF00");
  } else if (dirSubiu && movimentoDescendo) {
	contadorRepeticoes++; 
	movimentoDescendo = false; 
	exibirFeedback("Joelho Direito! Suba o Esquerdo.", "#00FF00");
  } else {
	exibirFeedback("Corrida no lugar: eleve os joelhos", "#FFFFFF");
  }
}

// G9: Luiz, Isaac, Jorge, Juliano Costa e Erick
function regraT213_G9_Flexao(lm) {
  let angCotovelo = calcularAngulo(lm[11], lm[13], lm[15]);
  desenharMetrica(Math.round(angCotovelo)+"°", lm[13]);
  
  if (angCotovelo < 60) {
	exibirFeedback("ERRO: Desceu demais! (<60º)", "#FF0000");
	movimentoDescendo = false; 
  } 
  else if (angCotovelo <= 90 && angCotovelo >= 60) {
	exibirFeedback("Boa descida! Empurre.", "#00FF00");
	movimentoDescendo = true;
  } 
  else if (angCotovelo > 160 && movimentoDescendo) {
	contadorRepeticoes++;
	movimentoDescendo = false;
  } else {
	exibirFeedback("Faça a Flexão (Mínimo 60º)", "#FFFFFF");
  }
}

function regraT213_G9_Poli(lm) {
  let bracoAlto = lm[15].y < lm[11].y; 
  let pernasAfastadas = Math.abs(lm[27].x - lm[28].x) > 0.20;
  let maosBateram = Math.abs(lm[15].x - lm[16].x) < 0.15; 
  
  desenharMetrica("Distância Mãos: " + Math.abs(lm[15].x - lm[16].x).toFixed(2), lm[15]);

  if (bracoAlto && pernasAfastadas && maosBateram) {
	exibirFeedback("Bateu palma! Feche as pernas.", "#00FF00");
	movimentoDescendo = true;
  } 
  else if (bracoAlto && pernasAfastadas && !maosBateram) {
	exibirFeedback("ERRO: Bata a palma lá em cima!", "#FF0000");
  } 
  else if (!pernasAfastadas && movimentoDescendo) {
	contadorRepeticoes++;
	movimentoDescendo = false;
  } else {
	exibirFeedback("Polichinelo (Com Palma)", "#FFFFFF");
  }
}

// =========================================================================
// DEMAIS LÓGICAS DA TURMA 213
// =========================================================================
function regraT213_G1_Biceps(lm) { let ang = calcularAngulo(lm[12], lm[14], lm[16]); let dist = Math.abs(lm[14].x - lm[12].x); desenharMetrica("Afastou: " + dist.toFixed(2), lm[14], dist > 0.15 ? "#FF0000" : "#00FF00"); desenharMetrica(Math.round(ang)+"°", lm[16]); if (dist > 0.15) { exibirFeedback("ERRO: Feche os cotovelos!", "#FF0000"); } else if (ang < 60) { exibirFeedback("Boa, desça a carga.", "#00FF00"); movimentoDescendo = true; } else if (ang > 150 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; } else { exibirFeedback("Flexão de Bíceps Alinhada", "#FFFFFF"); } }
function regraT213_G1_Abd(lm) { let ang = calcularAngulo(lm[12], lm[24], lm[26]); desenharMetrica(Math.round(ang)+"°", lm[24]); if (ang < 150) { exibirFeedback("Ombros elevados (30º)! Volte.", "#00FF00"); movimentoDescendo = true; } else if (ang > 170 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; } }
function regraT213_G2_Lat(lm) { let ang = calcularAngulo(lm[24], lm[12], lm[14]); desenharMetrica(Math.round(ang)+"°", lm[12]); if (ang >= 80 && ang <= 110) { exibirFeedback("Braços em 90º! Desça.", "#00FF00"); movimentoDescendo = true; } else if (ang < 30 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; } }
function regraT213_G2_Biceps(lm) { let ang = calcularAngulo(lm[12], lm[14], lm[16]); desenharMetrica(Math.round(ang)+"°", lm[14]); if (ang > 130 && ang < 145) { exibirFeedback("Atingiu 130-145º (Regra G2)!", "#00FF00"); movimentoDescendo = true; } else if (ang > 160 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; } }
function regraT213_G3_Afundo(lm) { let ang = calcularAngulo(lm[24], lm[26], lm[28]); desenharMetrica(Math.round(ang)+"°", lm[26]); if (ang < 100) { exibirFeedback("Desceu! (<100)", "#00FF00"); movimentoDescendo = true; } else if (ang > 160 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; } }
function regraT213_G3_Poli(lm) { let dist = Math.abs(lm[27].x - lm[28].x); desenharMetrica("Distância: " + dist.toFixed(2), lm[27]); if (dist > 0.3) { exibirFeedback("Abertura Correta!", "#00FF00"); movimentoDescendo = true; } else if (dist < 0.1 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; } }
function regraT213_G4_Braco(lm) { let ang = calcularAngulo(lm[12], lm[14], lm[16]); desenharMetrica(Math.round(ang)+"°", lm[14]); if (ang < 170) { exibirFeedback("ERRO: Cotovelo dobrado!", "#FF0000"); } else { exibirFeedback("Braço esticado! OK.", "#00FF00"); } }
function regraT213_G4_Ponte(lm) { let diff = lm[12].y - lm[24].y; desenharMetrica("Elevação: " + diff.toFixed(2), lm[24]); if (diff > 0.10) { exibirFeedback("Ponte sustentada! Ótimo.", "#00FF00"); if(frameCount%30===0) tempoExercicio++; } else { exibirFeedback("Levante o Quadril! > 0.10", "#FF0000"); } }
function regraT213_G5_Poli(lm) { let b = lm[15].y < lm[11].y; let p = Math.abs(lm[27].x - lm[28].x) > 0.20; let distPes = Math.abs(lm[27].x - lm[28].x); desenharMetrica("Dist Pés: " + distPes.toFixed(2), lm[27]); if (b && p) { exibirFeedback("Polichinelo Completo!", "#00FF00"); movimentoDescendo = true; } else if (!b && !p && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; } else { exibirFeedback("Faça o Polichinelo", "#FFFFFF"); } }
function regraT213_G5_Equil(lm) { let dist = Math.abs(lm[27].y - lm[28].y); let ang = calcularAngulo(lm[12], lm[24], lm[26]); desenharMetrica("Pés Dif Y: " + dist.toFixed(2), lm[27]); if (dist > 0.10 && ang > 160) { exibirFeedback("Equilíbrio Mantido!", "#00FF00"); if(frameCount%30===0) tempoExercicio++; } else { exibirFeedback("Levante um pé e fique reto!", "#FFFFFF"); } }
function regraT213_G6_Yoga(lm) { let aB = calcularAngulo(lm[12], lm[14], lm[16]); let aP = calcularAngulo(lm[24], lm[26], lm[28]); let alt = lm[12].y < lm[24].y - 0.20; desenharMetrica(Math.round(aB)+"°", lm[14]); desenharMetrica(Math.round(aP)+"°", lm[26]); if (aB > 160 && aP > 160 && alt) { exibirFeedback("Upward Dog Perfeito!", "#00FF00"); if(frameCount%30===0) tempoExercicio++; } else { exibirFeedback("Estique braços/pernas e erga o peito", "#FFFFFF"); } }
function regraT213_G6_Scott(lm) { let ang = calcularAngulo(lm[12], lm[14], lm[16]); desenharMetrica(Math.round(ang)+"°", lm[14]); if (ang > 80 && ang < 100) { exibirFeedback("Chegou nos 90º! Estique.", "#00FF00"); movimentoDescendo = true; } else if (ang > 160 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; } }
function regraT213_G7_Flex(lm) { let ang = calcularAngulo(lm[12], lm[14], lm[16]); desenharMetrica(Math.round(ang)+"°", lm[14]); if (ang < 90) { exibirFeedback("Atingiu 90º. Suba!", "#00FF00"); movimentoDescendo = true; } else if (ang > 160 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; } }
function regraT213_G7_Abd(lm) { let dist = Math.abs(lm[12].y - lm[26].y); desenharMetrica("Dist Omb-Joelho: " + dist.toFixed(2), lm[12]); if (dist < 0.25) { exibirFeedback("Subiu tudo! Volte.", "#00FF00"); movimentoDescendo = true; } else if (dist > 0.50 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; } }

// =========================================================================
// REGRAS BASE 211 & 212
// =========================================================================
function regraTiagoFlexao(lm) {
  let angCotovelo = calcularAngulo(lm[11], lm[13], lm[15]);
  let difQuadril = Math.abs(lm[23].y - lm[11].y);
  desenharMetrica(Math.round(angCotovelo)+"°", lm[13]);
  if (angCotovelo < 90 && difQuadril < 0.10) { exibirFeedback("Ótima descida! Empurre de volta.", "#00FF00"); movimentoDescendo = true; }
  else if (angCotovelo > 160 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
  else if (difQuadril >= 0.10) { exibirFeedback("ERRO: Alinhe o quadril com o ombro!", "#FF0000"); }
}
function regraTiagoAgachamentoLat(lm) {
  let angEsq = calcularAngulo(lm[23], lm[25], lm[27]);
  let angDir = calcularAngulo(lm[24], lm[26], lm[28]);
  desenharMetrica(Math.round(angEsq)+"°", lm[25]);
  desenharMetrica(Math.round(angDir)+"°", lm[26]);
  if ((angEsq < 120 && angDir > 160) || (angDir < 120 && angEsq > 160)) { exibirFeedback("Agachamento lateral correto! Suba.", "#00FF00"); movimentoDescendo = true; }
  else if (angEsq > 160 && angDir > 160 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraDylanAfundo(lm) {
  let erroJoelho = lm[26].x > lm[28].x + 0.03;
  let desceuBem = Math.abs(lm[25].y - lm[28].y) < 0.10;
  desenharMetrica("Avanço X: " + (lm[26].x - lm[28].x).toFixed(2), lm[28]);
  if (erroJoelho) { exibirFeedback("ERRO: Joelho passando a ponta do pé!", "#FF0000"); }
  else if (desceuBem) { exibirFeedback("Boa descida! Retorne reto.", "#00FF00"); movimentoDescendo = true; }
  else if (movimentoDescendo && calcularAngulo(lm[24], lm[26], lm[28]) > 170) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraDylanParede(lm) {
  let angJoelho = calcularAngulo(lm[24], lm[26], lm[28]);
  desenharMetrica(Math.round(angJoelho)+"°", lm[26]);
  if (angJoelho >= 85 && angJoelho <= 95) { exibirFeedback("Postura Correta! Segure.", "#00FF00"); if (frameCount % 30 === 0) tempoExercicio++; }
  else { exibirFeedback("Erro: Mantenha entre 85º e 95º", "#FF0000"); }
}
function regraJuliaAbdominal(lm) {
  let angQuadril = calcularAngulo(lm[12], lm[24], lm[26]);
  desenharMetrica(Math.round(angQuadril)+"°", lm[24]);
  if (angQuadril < 80) { exibirFeedback("Subiu bem! Deite para contar.", "#00FF00"); movimentoDescendo = true; }
  else if (angQuadril > 140 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraJuliaBiceps(lm) {
  let angCotovelo = calcularAngulo(lm[12], lm[14], lm[16]);
  desenharMetrica(Math.round(angCotovelo)+"°", lm[14]);
  if (angCotovelo < 60) { exibirFeedback("Contração Correta!", "#00FF00"); movimentoDescendo = true; }
  else if (angCotovelo > 150 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraClaraBiceps(lm) {
  let angCotovelo = calcularAngulo(lm[12], lm[14], lm[16]);
  desenharMetrica(Math.round(angCotovelo)+"°", lm[14]);
  if (angCotovelo < 50) { exibirFeedback("Ótima flexão!", "#00FF00"); movimentoDescendo = true; }
  else if (angCotovelo > 160 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraClaraPrancha(lm) {
  let diff = Math.abs(lm[24].y - lm[12].y);
  desenharMetrica("Dif Alt: " + diff.toFixed(2), lm[24]);
  if (diff < 0.10) { exibirFeedback("Prancha perfeita!", "#00FF00"); if (frameCount % 30 === 0) tempoExercicio++; }
  else { exibirFeedback("Abaixe/Levante o Quadril!", "#FF0000"); }
}
function regraVitoriaBiceps(lm) {
  let angCotovelo = calcularAngulo(lm[12], lm[14], lm[16]);
  desenharMetrica(Math.round(angCotovelo)+"°", lm[14]);
  if (angCotovelo < 60) { exibirFeedback("Flexão validada! Estique o braço.", "#00FF00"); movimentoDescendo = true; }
  else if (angCotovelo > 170 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraVitoriaElevacao(lm) {
  let altJoelho = Math.min(lm[25].y, lm[26].y);
  let altQuad = Math.min(lm[23].y, lm[24].y);
  if (altJoelho < altQuad + 0.10) { exibirFeedback("Joelho alto! Abaixe a perna.", "#00FF00"); movimentoDescendo = true; }
  else if (movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraMariahFlexao(lm) {
  let angCotovelo = calcularAngulo(lm[11], lm[13], lm[15]);
  let diffQuadril = Math.abs(lm[23].y - lm[11].y);
  desenharMetrica(Math.round(angCotovelo)+"°", lm[13]);
  if (angCotovelo < 95 && diffQuadril < 0.15) { exibirFeedback("Boa descida! Agora suba.", "#00FF00"); movimentoDescendo = true; }
  else if (angCotovelo > 160 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraMariahAbdominal(lm) {
  let angQuadril = calcularAngulo(lm[12], lm[24], lm[26]);
  desenharMetrica(Math.round(angQuadril)+"°", lm[24]);
  if (angQuadril < 150) { exibirFeedback("Subiu 30º! Volte para o chão.", "#00FF00"); movimentoDescendo = true; }
  else if (angQuadril > 170 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}

function regraT212_EduardaPoli(lm) {
  let bracoAlto = lm[15].y < lm[11].y && lm[16].y < lm[12].y;
  let distanciaPes = Math.abs(lm[27].x - lm[28].x);
  desenharMetrica("Dist Pés: " + distanciaPes.toFixed(2), lm[27]);
  if (bracoAlto && distanciaPes > 0.20) { exibirFeedback("Afastou! Feche para contar.", "#00FF00"); movimentoDescendo = true; }
  else if (!bracoAlto && distanciaPes < 0.15 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
  else { exibirFeedback("Faça o Polichinelo", "#FFFFFF"); }
}
function regraT212_EduardaAbd(lm) {
  let distOmbroJoelho = Math.abs(lm[11].y - lm[25].y);
  desenharMetrica("Distância: " + distOmbroJoelho.toFixed(2), lm[11]);
  if (distOmbroJoelho < 0.30) { exibirFeedback("Contraiu bem! Desça.", "#00FF00"); movimentoDescendo = true; }
  else if (distOmbroJoelho > 0.50 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraT212_EloaAfundo(lm) {
  let angJoelho = calcularAngulo(lm[24], lm[26], lm[28]);
  desenharMetrica(Math.round(angJoelho)+"°", lm[26]);
  if (angJoelho < 100) { exibirFeedback("Boa descida (Afundo)!", "#00FF00"); movimentoDescendo = true; }
  else if (angJoelho > 160 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraT212_EloaAbd(lm) {
  let angTronco = calcularAngulo(lm[12], lm[24], lm[26]);
  desenharMetrica(Math.round(angTronco)+"°", lm[24]);
  if (angTronco < 90) { exibirFeedback("Abdominal aos 80º! Retorne.", "#00FF00"); movimentoDescendo = true; }
  else if (angTronco > 160 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraT212_YasminBarra(lm) {
  let queixoPassou = lm[0].y < lm[15].y && lm[0].y < lm[16].y;
  let inclinacaoTronco = calcularInclinacaoTronco(lm[12], lm[24]);
  desenharMetrica("Balanço: " + Math.round(inclinacaoTronco)+"°", lm[24], inclinacaoTronco > 20 ? "#FF0000" : "#FFFF00");
  if (inclinacaoTronco > 20) { exibirFeedback("ERRO: Não balance o corpo (>20º)!", "#FF0000"); }
  else if (queixoPassou) { exibirFeedback("Queixo passou! Desça.", "#00FF00"); movimentoDescendo = true; }
  else if (!queixoPassou && movimentoDescendo && calcularAngulo(lm[12], lm[14], lm[16]) > 150) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraT212_YasminRosca(lm) {
  let angCotovelo = calcularAngulo(lm[12], lm[14], lm[16]);
  let inclinacaoTronco = calcularInclinacaoTronco(lm[12], lm[24]);
  desenharMetrica("Inclin: " + Math.round(inclinacaoTronco)+"°", lm[24], inclinacaoTronco > 20 ? "#FF0000" : "#FFFF00");
  desenharMetrica(Math.round(angCotovelo)+"°", lm[14]);
  if (inclinacaoTronco > 20) { exibirFeedback("ERRO: Costas inclinadas para trás!", "#FF0000"); }
  else if (angCotovelo < 60) { exibirFeedback("Boa contração. Desça o peso.", "#00FF00"); movimentoDescendo = true; }
  else if (angCotovelo > 160 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraT212_JuliaBiceps(lm) {
  let angCotovelo = calcularAngulo(lm[12], lm[14], lm[16]);
  desenharMetrica(Math.round(angCotovelo)+"°", lm[14]);
  if (angCotovelo < 60) { exibirFeedback("Flexão de 60º! Desça.", "#00FF00"); movimentoDescendo = true; }
  else if (angCotovelo > 160 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraT212_JuliaAbd(lm) {
  let difY = lm[24].y - lm[12].y;
  desenharMetrica("Altura Y: " + difY.toFixed(2), lm[12]);
  if (difY < 0.20) { exibirFeedback("Ombros elevados! Deite-se.", "#00FF00"); movimentoDescendo = true; }
  else if (difY > 0.40 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraT212_DaviBiceps(lm) {
  let angCotovelo = calcularAngulo(lm[12], lm[14], lm[16]);
  desenharMetrica(Math.round(angCotovelo)+"°", lm[14]);
  if (angCotovelo < 90) { exibirFeedback("Chegou a 90º! Estique >160º", "#00FF00"); movimentoDescendo = true; }
  else if (angCotovelo > 160 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraT212_DaviAbd(lm) {
  let angTronco = calcularAngulo(lm[12], lm[24], lm[26]);
  desenharMetrica(Math.round(angTronco)+"°", lm[24]);
  if (angTronco < 60) { exibirFeedback("Subida (<60º)! Retorne.", "#00FF00"); movimentoDescendo = true; }
  else if (angTronco > 140 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraT212_GabrielFlexao(lm) {
  let angCotovelo = calcularAngulo(lm[12], lm[14], lm[16]);
  desenharMetrica(Math.round(angCotovelo)+"°", lm[14]);
  if (angCotovelo < 90) { exibirFeedback("Descida feita! Agora empurre.", "#00FF00"); movimentoDescendo = true; }
  else if (angCotovelo > 160 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}
function regraT212_GabrielAbd(lm) {
  let angTronco = calcularAngulo(lm[12], lm[24], lm[26]);
  desenharMetrica(Math.round(angTronco)+"°", lm[24]);
  if (angTronco < 135) { exibirFeedback("Subiu 45 graus!", "#00FF00"); movimentoDescendo = true; }
  else if (angTronco > 160 && movimentoDescendo) { contadorRepeticoes++; movimentoDescendo = false; }
}

// ================= FUNÇÕES BASE MATEMÁTICAS E VISUAIS =================
function calcularAngulo(A, B, C) {
  let rad = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let angulo = Math.abs((rad * 180.0) / Math.PI); return (angulo > 180.0) ? 360.0 - angulo : angulo;
}
function calcularInclinacaoTronco(ombro, quadril) {
  let angulo = Math.atan2(quadril.y - ombro.y, quadril.x - ombro.x) * (180 / Math.PI);
  return Math.abs(angulo - 90);
}
function desenharMetrica(texto, landmark, corHex = "#FFFF00") {
  let cx = modoCamera === "user" ? (1 - landmark.x) * width : landmark.x * width;
  let cy = landmark.y * height;
  let ts = constrain(min(width, height) * 0.07, 20, 30);
  fill(corHex); noStroke(); textSize(ts); textAlign(LEFT, CENTER); text(texto, cx + 15, cy);
}
function exibirFeedback(mensagem, corHex) {
  let x = width / 2; let y = height - 80;
  let ts = constrain(min(width, height) * 0.075, 22, 34);
  textSize(ts); let larguraTexto = textWidth(mensagem);
  rectMode(CENTER); fill(0, 0, 0, 180); noStroke(); rect(x, y, larguraTexto + 30, ts + 14, 8);
  fill(corHex); textAlign(CENTER, CENTER); text(mensagem, x, y);
}
function desenharEsqueleto(landmarks) {
  let teste = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  let ts = constrain(min(width, height) * 0.04, 12, 16);
  for (let i of teste) {
	let cx = modoCamera === "user" ? (1 - landmarks[i].x) * width : landmarks[i].x * width;
	let cy = landmarks[i].y * height;
	// Círculo do ponto
	fill(0, 191, 255); stroke(255); strokeWeight(2); circle(cx, cy, 14);
	// Número oficial MediaPipe
	textSize(ts);
	let tw = textWidth(String(i));
	rectMode(CENTER); fill(0, 0, 0, 200); noStroke(); rect(cx, cy + 13, tw + 6, ts + 4, 3);
	fill(255, 255, 0); textAlign(CENTER, CENTER); text(i, cx, cy + 13);
	rectMode(CORNER);
  }
}