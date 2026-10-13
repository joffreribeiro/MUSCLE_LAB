// Métodos de treino. Baseado no material "Métodos de Treinamento: Força e Hipertrofia"
// (pasta Base), com textos resumidos e escritos para o app.

export type MetodoNivel = 'Iniciante' | 'Intermediário' | 'Avançado';

export interface Metodo {
  id: string;
  nome: string;
  resumo: string;
  nivel: MetodoNivel;
  objetivo: string;
  passos: string[];
  exemplo: string;
  descanso: string;
  dica: string;
}

export const findMetodo = (id: string | undefined): Metodo | undefined => METODOS.find((m) => m.id === id);

export const METODOS: Metodo[] = [
  {
    id: 'piramide-crescente',
    nome: 'Pirâmide crescente',
    resumo: 'Aumenta a carga a cada série enquanto as repetições diminuem.',
    nivel: 'Iniciante',
    objetivo: 'Força e hipertrofia, com aquecimento embutido nas primeiras séries.',
    passos: [
      'Comece com carga leve a moderada e mais repetições (12).',
      'A cada série, aumente a carga entre 5% e 15%.',
      'Reduza as repetições conforme a carga sobe (12, 10, 8, 6).',
      'A última série deve ser difícil, mas sem perder a técnica.',
    ],
    exemplo: 'Supino reto: 12 x 60 kg, 10 x 65 kg, 8 x 70 kg, 6 x 75 kg.',
    descanso: '90 a 180 s entre as séries.',
    dica: 'Registre as cargas: a progressão de uma semana para a outra é o que dá resultado.',
  },
  {
    id: 'piramide-decrescente',
    nome: 'Pirâmide decrescente',
    resumo: 'Começa com a série mais pesada e reduz a carga a cada série, aumentando as repetições.',
    nivel: 'Intermediário',
    objetivo: 'Usar a carga mais alta com o músculo descansado e depois acumular volume.',
    passos: [
      'Aqueça bem antes: a primeira série já é a mais pesada.',
      'Faça a série pesada com poucas repetições (5 a 6).',
      'Reduza a carga entre 10% e 20% a cada série.',
      'Aumente as repetições conforme a carga cai (8, 10, 12).',
    ],
    exemplo: 'Agachamento: 6 x 85 kg, 8 x 70 kg, 10 x 55 kg, 12 x 40 kg.',
    descanso: '60 a 120 s entre as séries.',
    dica: 'Iniciantes podem fazer só 3 séries; avançados podem terminar com um drop-set.',
  },
  {
    id: 'bi-set',
    nome: 'Bi-set',
    resumo: 'Dois exercícios seguidos, sem descanso entre eles, formando uma série.',
    nivel: 'Intermediário',
    objetivo: 'Mais intensidade e volume em menos tempo.',
    passos: [
      'Escolha dois exercícios para o mesmo músculo ou para músculos opostos.',
      'Faça o exercício A até perto da falha.',
      'Sem descanso, faça o exercício B. A + B contam como 1 série.',
      'Descanse e repita o número de séries planejado.',
    ],
    exemplo: 'Rosca direta (10–12) + rosca alternada (10–12).',
    descanso: '60 a 90 s depois de cada par.',
    dica: 'Combine exercícios que se completem: um que alonga e outro que contrai bem o músculo.',
  },
  {
    id: 'tri-set',
    nome: 'Tri-set',
    resumo: 'Três exercícios seguidos para o mesmo músculo, sem descanso entre eles.',
    nivel: 'Avançado',
    objetivo: 'Alto estresse metabólico e volume concentrado.',
    passos: [
      'Escolha três exercícios para o mesmo grupo, com estímulos diferentes.',
      'Faça os três em sequência, sem pausa.',
      'Descanse só depois do terceiro.',
      'Repita o bloco conforme o número de séries.',
    ],
    exemplo: 'Supino reto (8–12) → supino inclinado com halteres (8–12) → crucifixo (10–15).',
    descanso: '60 a 120 s após cada bloco.',
    dica: 'A execução controlada vale mais que a carga: o cansaço acumula rápido.',
  },
  {
    id: 'drop-set',
    nome: 'Drop-set',
    resumo: 'Ao chegar perto da falha, reduz a carga e continua a série sem descanso.',
    nivel: 'Intermediário',
    objetivo: 'Prolongar o tempo sob tensão e romper platôs.',
    passos: [
      'Faça 8 a 12 repetições até perto da falha.',
      'Reduza a carga entre 20% e 30% rapidamente.',
      'Continue sem descanso até perto da falha de novo.',
      'Repita de 1 a 3 quedas de carga.',
    ],
    exemplo: 'Rosca com halteres: 12 x 14 kg → 8 x 10 kg → 6 x 8 kg.',
    descanso: 'Sem descanso entre as quedas.',
    dica: 'Use no último exercício ou na última série, de preferência em máquinas ou exercícios isolados.',
  },
  {
    id: 'rest-pause',
    nome: 'Rest-pause',
    resumo: 'Pausas curtas dentro da série para conseguir mais repetições com a mesma carga.',
    nivel: 'Avançado',
    objetivo: 'Mais repetições com carga alta, aumentando a intensidade.',
    passos: [
      'Faça repetições até perto da falha.',
      'Descanse 10 a 20 s sem soltar o exercício por completo.',
      'Faça mais algumas repetições até perto da falha.',
      'Repita 2 ou 3 mini-blocos.',
    ],
    exemplo: 'Desenvolvimento: 8 reps + 15 s + 3 reps + 15 s + 2 reps.',
    descanso: '10 a 20 s entre os mini-blocos; 2 a 3 min ao final.',
    dica: 'Evite em exercícios em que a falha é perigosa sem parceiro, como agachamento livre.',
  },
  {
    id: 'pre-exaustao',
    nome: 'Pré-exaustão',
    resumo: 'Um exercício isolado antes do composto para o mesmo músculo.',
    nivel: 'Intermediário',
    objetivo: 'Cansar o músculo-alvo primeiro, para ele ser o limitante no composto.',
    passos: [
      'Faça um exercício isolado para o músculo-alvo.',
      'Com pouco ou nenhum descanso, vá para o exercício composto.',
      'Use carga menor no composto do que usaria normalmente.',
    ],
    exemplo: 'Crucifixo (12–15) → supino reto (6–10).',
    descanso: 'Até 10 s entre os dois; 60 a 120 s depois do par.',
    dica: 'Útil quando outro músculo (ex.: tríceps no supino) cansa antes do alvo.',
  },
  {
    id: 'pos-exaustao',
    nome: 'Pós-exaustão',
    resumo: 'O composto primeiro e, em seguida, um isolado para o mesmo músculo.',
    nivel: 'Intermediário',
    objetivo: 'Aproveitar a carga alta do composto e terminar o estímulo no músculo-alvo.',
    passos: [
      'Faça o exercício composto com a carga planejada.',
      'Sem descanso, faça o isolado do mesmo músculo.',
      'Descanse e repita.',
    ],
    exemplo: 'Supino reto (6–8) → crucifixo (10–15).',
    descanso: '60 a 90 s depois do par.',
    dica: 'É mais seguro que a pré-exaustão, porque o composto é feito descansado.',
  },
  {
    id: 'agonista-antagonista',
    nome: 'Superset agonista-antagonista',
    resumo: 'Dois exercícios seguidos para músculos opostos, como bíceps e tríceps.',
    nivel: 'Iniciante',
    objetivo: 'Economizar tempo sem perder desempenho, já que um músculo descansa enquanto o outro trabalha.',
    passos: [
      'Escolha dois exercícios para músculos opostos.',
      'Faça o primeiro e vá direto para o segundo.',
      'Descanse depois do par.',
    ],
    exemplo: 'Rosca direta → tríceps corda.',
    descanso: '60 a 90 s depois do par.',
    dica: 'Pares clássicos: peito e costas, bíceps e tríceps, quadríceps e posteriores.',
  },
  {
    id: 'cadencia-controlada',
    nome: 'Cadência controlada (super slow)',
    resumo: 'Repetições lentas e controladas, principalmente na descida.',
    nivel: 'Iniciante',
    objetivo: 'Aumentar o tempo sob tensão e a consciência do movimento.',
    passos: [
      'Desça em 4 segundos.',
      'Pare 1 segundo na posição alongada.',
      'Suba em 1 a 2 segundos, sem impulso.',
      'Use carga menor que a habitual.',
    ],
    exemplo: 'Cadeira extensora, cadência 4-1-1, 8 a 12 repetições.',
    descanso: '60 a 90 s.',
    dica: 'Ótimo para aprender a técnica e para quem treina em casa com pouca carga.',
  },
  {
    id: 'repeticoes-parciais',
    nome: 'Repetições parciais',
    resumo: 'Depois da falha na amplitude completa, mais algumas repetições em amplitude reduzida.',
    nivel: 'Avançado',
    objetivo: 'Prolongar a série e enfatizar uma parte específica do movimento.',
    passos: [
      'Faça as repetições completas até perto da falha.',
      'Continue com 3 a 5 repetições curtas, na parte mais forte do movimento.',
    ],
    exemplo: 'Rosca direta: 10 completas + 4 parciais na metade de baixo.',
    descanso: '90 s.',
    dica: 'Não use as parciais para "roubar" carga desde o início: elas vêm depois das completas.',
  },
  {
    id: 'isometria',
    nome: 'Isometria',
    resumo: 'Segurar a posição sem movimento por um tempo determinado.',
    nivel: 'Iniciante',
    objetivo: 'Força em um ponto específico, estabilidade e controle.',
    passos: [
      'Escolha a posição (ex.: agachamento a 90°).',
      'Segure com o músculo contraído pelo tempo planejado.',
      'Respire normalmente, sem prender o ar.',
    ],
    exemplo: 'Cadeira na parede: 3 x 30 a 45 s.',
    descanso: '45 a 60 s.',
    dica: 'Pode ser usada no fim de uma série dinâmica para intensificar.',
  },
  {
    id: 'ate-a-falha',
    nome: 'Treino até a falha',
    resumo: 'Levar a série até não conseguir mais uma repetição com boa técnica.',
    nivel: 'Intermediário',
    objetivo: 'Garantir esforço máximo na série.',
    passos: [
      'Escolha um exercício seguro para ir à falha (máquinas e isolados).',
      'Faça as repetições com técnica até não conseguir completar mais uma.',
      'Use na última série do exercício, não em todas.',
    ],
    exemplo: 'Leg press: 3 séries com RIR 2 e a última até a falha.',
    descanso: '2 a 3 min depois da série na falha.',
    dica: 'No app, registre RIR 0 nessas séries para acompanhar quantas vezes você chega à falha.',
  },
  {
    id: 'cluster-set',
    nome: 'Cluster set',
    resumo: 'Divide uma série pesada em blocos curtos com micro-pausas.',
    nivel: 'Avançado',
    objetivo: 'Manter carga alta e qualidade em todas as repetições.',
    passos: [
      'Use carga alta (80% a 90% de 1RM).',
      'Faça 2 a 3 repetições.',
      'Pause 15 a 30 s e repita o bloco 3 a 4 vezes.',
    ],
    exemplo: 'Agachamento: 4 blocos de 2 reps com 20 s de pausa.',
    descanso: '2 a 4 min entre os clusters.',
    dica: 'Indicado para força; mantenha a técnica idêntica em todos os blocos.',
  },
  {
    id: 'fst-7',
    nome: 'FST-7',
    resumo: 'Sete séries no último exercício do músculo, com descanso bem curto.',
    nivel: 'Avançado',
    objetivo: 'Congestão (pump) e estresse metabólico no final do treino.',
    passos: [
      'Escolha um exercício isolado ou em máquina.',
      'Faça 7 séries de 8 a 12 repetições.',
      'Descanse só 30 a 45 s entre elas.',
    ],
    exemplo: 'Crossover no final do treino de peito: 7 x 10 com 30 s de pausa.',
    descanso: '30 a 45 s.',
    dica: 'Use carga moderada: a sétima série precisa ser tão bem feita quanto a primeira.',
  },
  {
    id: 'circuito',
    nome: 'Treino em circuito',
    resumo: 'Sequência de exercícios para grupos diferentes, um após o outro.',
    nivel: 'Iniciante',
    objetivo: 'Condicionamento, gasto calórico e eficiência de tempo.',
    passos: [
      'Monte 4 a 8 estações para o corpo todo.',
      'Faça cada estação por repetições ou tempo (30 a 45 s).',
      'Passe direto para a próxima e descanse ao fim da volta.',
      'Faça 3 a 5 voltas.',
    ],
    exemplo: 'Agachamento → flexão → remada → prancha → corda.',
    descanso: '1 a 2 min ao fim de cada volta.',
    dica: 'Alterne membros superiores e inferiores para um grupo descansar enquanto o outro trabalha.',
  },
];
