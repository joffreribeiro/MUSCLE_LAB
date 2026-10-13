// Glossário técnico. Termos selecionados a partir do "Glossário técnico simplificado"
// (Base Visual da Musculação), com definições escritas para o app, mais os termos
// usados nas telas (RIR, falha, 1RM, cadência, volume).

export interface GlossaryTerm {
  term: string;
  definition: string;
  categoria: 'Anatomia' | 'Movimento' | 'Contração' | 'Treino';
}

export const GLOSSARIO: GlossaryTerm[] = [
  // Anatomia e papéis dos músculos
  { term: 'Agonista', categoria: 'Anatomia', definition: 'Músculo principal que gera o movimento. No supino, o peitoral.' },
  { term: 'Antagonista', categoria: 'Anatomia', definition: 'Músculo que faz o movimento oposto ao agonista e controla a sua velocidade. Na rosca direta, o tríceps.' },
  { term: 'Sinergista', categoria: 'Anatomia', definition: 'Músculo que ajuda o agonista. No app aparece como "secundário".' },
  { term: 'Estabilizador', categoria: 'Anatomia', definition: 'Músculo que segura a postura e o alinhamento enquanto outros fazem o movimento.' },
  { term: 'Core', categoria: 'Anatomia', definition: 'Conjunto de músculos do tronco (abdômen, oblíquos, lombar, assoalho pélvico) que estabiliza a coluna.' },

  // Movimentos e planos
  { term: 'Flexão', categoria: 'Movimento', definition: 'Movimento que diminui o ângulo entre dois segmentos, como dobrar o cotovelo.' },
  { term: 'Extensão', categoria: 'Movimento', definition: 'Movimento que aumenta o ângulo entre dois segmentos, como esticar o joelho.' },
  { term: 'Abdução', categoria: 'Movimento', definition: 'Afastar um segmento da linha média do corpo, como abrir o braço para o lado.' },
  { term: 'Adução', categoria: 'Movimento', definition: 'Aproximar um segmento da linha média do corpo, como fechar os braços no crucifixo.' },
  { term: 'Rotação', categoria: 'Movimento', definition: 'Giro de um segmento em torno do próprio eixo.' },
  { term: 'Dorsiflexão', categoria: 'Movimento', definition: 'Levar a ponta do pé em direção à canela.' },
  { term: 'Flexão plantar', categoria: 'Movimento', definition: 'Empurrar a ponta do pé para baixo, como ao subir na ponta dos pés.' },
  { term: 'Amplitude de movimento', categoria: 'Movimento', definition: 'O percurso completo que a articulação faz no exercício.' },
  { term: 'Plano sagital', categoria: 'Movimento', definition: 'Divide o corpo em lado direito e esquerdo. Movimentos para frente e para trás, como a rosca e o agachamento.' },
  { term: 'Plano frontal', categoria: 'Movimento', definition: 'Divide o corpo em frente e costas. Movimentos para os lados, como a elevação lateral.' },
  { term: 'Plano transversal', categoria: 'Movimento', definition: 'Divide o corpo em parte de cima e de baixo. Movimentos de rotação e horizontais, como o crucifixo.' },
  { term: 'Eixo de movimento', categoria: 'Movimento', definition: 'Linha imaginária em torno da qual a articulação gira.' },
  { term: 'Torque', categoria: 'Movimento', definition: 'Tendência de uma força de fazer a articulação girar. Quanto mais longe a carga do eixo, maior o torque.' },
  { term: 'Vetor de força', categoria: 'Movimento', definition: 'Direção em que a força é aplicada. Define em que ponto do movimento o exercício fica mais difícil.' },

  // Contração
  { term: 'Contração concêntrica', categoria: 'Contração', definition: 'Fase em que o músculo encurta vencendo a carga, como subir na rosca.' },
  { term: 'Contração excêntrica', categoria: 'Contração', definition: 'Fase em que o músculo alonga controlando a carga, como descer na rosca.' },
  { term: 'Isometria', categoria: 'Contração', definition: 'Contração sem movimento visível da articulação, como na prancha.' },
  { term: 'Cadência', categoria: 'Contração', definition: 'Velocidade de cada fase da repetição, em segundos. Ex.: 3-1-1 = 3 s descendo, 1 s parado, 1 s subindo.' },

  // Treino
  { term: 'Repetição', categoria: 'Treino', definition: 'Execução completa de um movimento, da posição inicial de volta a ela.' },
  { term: 'Série', categoria: 'Treino', definition: 'Conjunto de repetições feitas em sequência, sem pausa.' },
  { term: 'Volume de treino', categoria: 'Treino', definition: 'Quantidade de trabalho: séries x repetições x carga, ou séries por músculo na semana.' },
  { term: 'Sobrecarga progressiva', categoria: 'Treino', definition: 'Aumentar aos poucos a exigência (carga, repetições ou séries) para o corpo continuar se adaptando.' },
  { term: '1RM', categoria: 'Treino', definition: 'Uma repetição máxima: a maior carga que você consegue levantar uma vez com boa técnica.' },
  { term: 'RIR', categoria: 'Treino', definition: 'Repetições em reserva: quantas repetições ainda daria para fazer ao terminar a série. RIR 0 é a falha.' },
  { term: 'Falha', categoria: 'Treino', definition: 'Ponto em que não dá para completar mais uma repetição com técnica correta.' },
];

export const GLOSSARIO_CATEGORIAS = ['Anatomia', 'Movimento', 'Contração', 'Treino'] as const;
