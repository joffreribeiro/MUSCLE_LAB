import { Equipment, Exercise, GroupKey, MuscleGroupCatalog } from '../types';
import { extraItems } from './catalogExtra';

const media = { kind: 'placeholder' as const };

const raw: Record<GroupKey, { name: string; items: Omit<Exercise, 'muscleGroup' | 'media'>[] }> = {
  peito: {
    name: 'Peito',
    items: [
      {
        id: 'supino-reto',
        name: 'Supino reto com barra',
        equipment: 'barra',
        description:
          'Empurra a barra a partir do meio do peito com as escápulas retraídas e os pés firmes no chão.',
        steps: [
          'Deita no banco com os olhos sob a barra e junta as escápulas.',
          'Desce a barra até tocar o meio do peito, cotovelos a 45°.',
          'Empurra até estender os braços sem travar os cotovelos.',
        ],
        warning:
          'Evita com lesão de ombro ou punho. Acima de 80% da carga máxima, treina sempre com um parceiro.',
      },
      {
        id: 'crucifixo',
        name: 'Crucifixo com halteres',
        equipment: 'halteres',
        description:
          'Abertura em arco que alonga o peitoral na fase excêntrica, com o cotovelo levemente flexionado.',
        steps: [
          'Deita com um halter em cada mão acima do peito.',
          'Abre os braços em arco até sentir o alongamento do peitoral.',
          'Fecha o movimento sem bater os halteres.',
        ],
        warning: 'Não desce abaixo da linha do ombro — sobrecarrega a cápsula articular.',
      },
      {
        id: 'flexao',
        name: 'Flexão de braços',
        equipment: 'peso-corporal',
        description: 'Exercício de peso corporal para peitoral, tríceps e estabilizadores do tronco.',
        steps: [
          'Mãos na largura dos ombros, corpo em linha reta.',
          'Desce até o peito ficar a um punho do chão.',
          'Sobe contraindo o peitoral, sem deixar cair o quadril.',
        ],
        warning: 'Com dor no punho, apoia sobre os punhos fechados ou em barras paralelas.',
      },
    ],
  },
  costas: {
    name: 'Costas',
    items: [
      {
        id: 'pulldown',
        name: 'Puxada frontal pegada fechada',
        equipment: 'polia',
        description: 'Puxada vertical com pegada fechada, ênfase na parte inferior do grande dorsal.',
        steps: [
          'Senta com as coxas presas pelo apoio e pega a barra em V.',
          'Puxa até a barra tocar a parte alta do peito, peito aberto.',
          'Sobe controlado por 2 segundos até estender os braços.',
        ],
        warning: 'Nunca puxa a barra atrás da cabeça — risco para a coluna cervical.',
      },
      {
        id: 'remada-barra',
        name: 'Remada curvada com barra',
        equipment: 'barra',
        description:
          'Puxada horizontal para dorsais, romboides e trapézio médio, com tronco inclinado.',
        steps: [
          'Tronco a 45°, joelhos semiflexionados, coluna neutra.',
          'Puxa a barra em direção ao umbigo, cotovelos rentes ao corpo.',
          'Desce sem arredondar as lombares.',
        ],
        warning:
          'Contraindicado com hérnia de disco ou dor lombar aguda — usa a remada apoiada no banco.',
      },
      {
        id: 'remada-halter',
        name: 'Remada unilateral com halter',
        equipment: 'halteres',
        description: 'Trabalho unilateral das costas com apoio no banco, corrige assimetrias.',
        steps: [
          'Um joelho e uma mão apoiados no banco, costas retas.',
          'Puxa o halter até a lateral do abdômen.',
          'Desce em 2 segundos, sem girar o tronco.',
        ],
        warning: 'Evita rodar o quadril para ganhar amplitude — sobrecarrega a lombar.',
      },
    ],
  },
  pernas: {
    name: 'Pernas',
    items: [
      {
        id: 'agachamento',
        name: 'Agachamento livre',
        equipment: 'barra',
        description: 'Exercício composto para quadríceps, glúteos e cadeia posterior.',
        steps: [
          'Barra apoiada no trapézio, pés na largura dos ombros.',
          'Desce empurrando o quadril para trás até as coxas passarem da paralela.',
          'Sobe empurrando o chão, joelhos alinhados com os pés.',
        ],
        warning: 'Nunca deixa o joelho colapsar para dentro. Com dor lombar, prefere o leg press.',
      },
      {
        id: 'leg-press',
        name: 'Leg press 45°',
        equipment: 'maquina',
        description:
          'Empurrada de pernas guiada pela máquina, permite carga alta com pouca exigência de coluna.',
        steps: [
          'Pés na plataforma na largura dos ombros.',
          'Desce até 90° de flexão do joelho.',
          'Empurra sem travar os joelhos no final.',
        ],
        warning: 'Não desce até a lombar sair do apoio.',
      },
      {
        id: 'extensora',
        name: 'Cadeira extensora',
        equipment: 'maquina',
        description:
          'Isolamento do quadríceps, útil no aquecimento e na finalização do treino de pernas.',
        steps: [
          'Ajusta o encosto para o joelho ficar no eixo da máquina.',
          'Estende as pernas e mantém a contração por 1 segundo.',
          'Desce controlado até 90°.',
        ],
        warning: 'Com condromalácia ou dor patelar, reduz a amplitude final.',
      },
    ],
  },
  ombros: {
    name: 'Ombros',
    items: [
      {
        id: 'desenvolvimento',
        name: 'Desenvolvimento militar sentado',
        equipment: 'halteres',
        description: 'Empurrada vertical para o deltoide anterior e medial.',
        steps: [
          'Senta com o encosto vertical e a lombar apoiada.',
          'Empurra a barra ou os halteres acima da cabeça.',
          'Desce até a altura do queixo, cotovelos ligeiramente à frente.',
        ],
        warning: 'Não hiperextende a lombar para empurrar mais carga.',
      },
      {
        id: 'elevacao-lateral',
        name: 'Elevação lateral com halteres',
        equipment: 'halteres',
        description: 'Isolamento do deltoide medial, responsável pela largura dos ombros.',
        steps: [
          'Braços ao lado do corpo, cotovelos levemente flexionados.',
          'Eleva até a linha dos ombros liderando pelo cotovelo.',
          'Desce em 3 segundos.',
        ],
        warning: 'Cargas altas aqui geram impacto no ombro — prioriza a técnica.',
      },
      {
        id: 'encolhimento',
        name: 'Encolhimento de ombros com barra',
        equipment: 'barra',
        description: 'Elevação dos ombros para o trapézio superior.',
        steps: [
          'Barra à frente do corpo, braços estendidos.',
          'Eleva os ombros em direção às orelhas.',
          'Desce sem rolar os ombros para trás.',
        ],
        warning: 'Não gira os ombros em círculos — comprime a articulação.',
      },
    ],
  },
  biceps: {
    name: 'Bíceps',
    items: [
      {
        id: 'rosca-direta',
        name: 'Rosca direta com barra',
        equipment: 'barra',
        description: 'Flexão de cotovelo com barra reta ou W, base do treino de bíceps.',
        steps: [
          'Pega na largura dos ombros, cotovelos junto ao tronco.',
          'Sobe até a contração máxima sem mover o ombro.',
          'Desce completo em 2 segundos.',
        ],
        warning: 'Com dor no punho usa a barra W. Não balança o tronco.',
      },
      {
        id: 'rosca-alternada',
        name: 'Rosca alternada com halteres',
        equipment: 'halteres',
        description: 'Rosca com supinação alternada, recruta bíceps e braquiorradial.',
        steps: [
          'Em pé, halteres ao lado do corpo com pegada neutra.',
          'Sobe girando o punho para fora no meio do movimento.',
          'Desce voltando à pegada neutra.',
        ],
        warning: 'Evita jogar o quadril à frente para iniciar o movimento.',
      },
      {
        id: 'rosca-scott',
        name: 'Rosca Scott',
        equipment: 'barra',
        description: 'Rosca no banco inclinado que elimina o impulso do tronco.',
        steps: [
          'Axilas apoiadas no topo do banco, braços estendidos.',
          'Sobe até 90° mantendo a tensão.',
          'Desce até a extensão quase completa.',
        ],
        warning:
          'A extensão total com carga alta tensiona o tendão distal — evita se sentir dor no cotovelo.',
      },
    ],
  },
  triceps: {
    name: 'Tríceps',
    items: [
      {
        id: 'triceps-polia',
        name: 'Tríceps na polia alta',
        equipment: 'polia',
        description: 'Extensão de cotovelo na polia, tensão constante em toda a amplitude.',
        steps: [
          'Cotovelos fixos junto ao tronco, tronco levemente inclinado.',
          'Estende até a contração total.',
          'Volta controlado até 90°.',
        ],
        warning: 'Não usa o peso do corpo para empurrar a barra.',
      },
      {
        id: 'triceps-testa',
        name: 'Tríceps testa',
        equipment: 'barra',
        description: 'Extensão deitada que enfatiza a cabeça longa do tríceps.',
        steps: [
          'Deitado, barra W acima da linha dos olhos.',
          'Flexiona os cotovelos levando a barra até a testa.',
          'Estende sem mover os braços da posição.',
        ],
        warning: 'Com dor no cotovelo, troca pela versão na polia.',
      },
      {
        id: 'mergulho',
        name: 'Mergulho no banco',
        equipment: 'peso-corporal',
        description: 'Exercício de peso corporal para tríceps com apoio das mãos no banco.',
        steps: [
          'Mãos na borda do banco, pernas estendidas à frente.',
          'Desce até 90° de flexão do cotovelo.',
          'Sobe sem projetar os ombros à frente.',
        ],
        warning: 'Amplitude excessiva comprime a articulação do ombro.',
      },
    ],
  },
  abdomen: {
    name: 'Abdômen',
    items: [
      {
        id: 'prancha',
        name: 'Prancha frontal',
        equipment: 'peso-corporal',
        description: 'Isometria de estabilização do core, sem flexão da coluna.',
        steps: [
          'Antebraços e pontas dos pés no chão, corpo em linha.',
          'Contrai glúteos e abdômen, respiração contínua.',
          'Mantém 30 a 60 segundos.',
        ],
        warning: 'Se a lombar afundar, encerra a série — o exercício deixa de proteger a coluna.',
      },
      {
        id: 'crunch',
        name: 'Abdominal crunch',
        equipment: 'peso-corporal',
        description: 'Flexão curta do tronco com foco no reto abdominal.',
        steps: [
          'Deitado, joelhos flexionados, mãos junto às orelhas.',
          'Enrola o tronco levando as costelas ao quadril.',
          'Desce sem apoiar completamente a cabeça.',
        ],
        warning: 'Não puxa a cabeça com as mãos.',
      },
      {
        id: 'elevacao-pernas',
        name: 'Elevação de pernas suspenso',
        equipment: 'peso-corporal',
        description: 'Elevação na barra fixa para a porção inferior do abdômen.',
        steps: [
          'Suspenso na barra, ombros ativos.',
          'Eleva as pernas até 90° sem balançar.',
          'Desce em 3 segundos.',
        ],
        warning: 'Balanço no movimento transfere a carga para a lombar.',
      },
    ],
  },
  cardio: {
    name: 'Cardio',
    items: [
      {
        id: 'bike',
        name: 'Bicicleta ergométrica',
        equipment: 'maquina',
        description: 'Cardio de baixo impacto, ideal para aquecimento de 5 a 10 minutos.',
        steps: [
          'Ajusta o selim na altura do quadril.',
          'Mantém 60 a 80 rotações por minuto.',
          'Fica na faixa de 110 a 140 bpm no aquecimento.',
        ],
        warning: 'Selim baixo sobrecarrega o joelho.',
      },
      {
        id: 'esteira',
        name: 'Esteira — corrida leve',
        equipment: 'maquina',
        description: 'Corrida contínua em ritmo conversacional para condicionamento aeróbico.',
        steps: [
          'Começa com 3 minutos de caminhada.',
          'Aumenta até um ritmo em que consigas conversar.',
          'Termina com 2 minutos de desaceleração.',
        ],
        warning: 'Não te seguras no painel durante a corrida.',
      },
      {
        id: 'corda',
        name: 'Corda de saltar',
        equipment: 'peso-corporal',
        description: 'Cardio de alta intensidade e coordenação, em blocos curtos.',
        steps: [
          'Saltos baixos, apoio na ponta dos pés.',
          'Cotovelos junto ao corpo, giro pelos punhos.',
          'Blocos de 40 segundos com 20 de pausa.',
        ],
        warning: 'Evita com lesão de tornozelo, joelho ou canelite.',
      },
    ],
  },
};

export const groupOrder: GroupKey[] = [
  'peito',
  'costas',
  'pernas',
  'ombros',
  'biceps',
  'triceps',
  'abdomen',
  'cardio',
];

export const equipmentOrder: Equipment[] = ['barra', 'halteres', 'maquina', 'polia', 'peso-corporal'];

export const catalog: Record<GroupKey, MuscleGroupCatalog> = groupOrder.reduce((acc, key) => {
  acc[key] = {
    key,
    name: raw[key].name,
    items: [...raw[key].items, ...(extraItems[key] ?? [])].map((item) => ({ ...item, muscleGroup: key, media })),
  };
  return acc;
}, {} as Record<GroupKey, MuscleGroupCatalog>);

export const allExercises: Exercise[] = groupOrder.flatMap((key) => catalog[key].items);

export function findExerciseById(id: string | null | undefined): Exercise | undefined {
  if (!id) return undefined;
  return allExercises.find((e) => e.id === id);
}
