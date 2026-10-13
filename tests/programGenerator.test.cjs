const assert = require('node:assert/strict');
const path = require('node:path');
const build = path.join(__dirname, '..', '.test-build');
const gen = require(path.join(build, 'data/programGenerator.js'));
const { findExerciseById, allExercises } = require(path.join(build, 'data/catalog.js'));

const goals = ['ganhar-massa', 'perder-gordura', 'manter-forma'];
const levels = ['iniciante', 'intermediario', 'avancado'];
const freqs = [2, 3, 4, 5, 6];
const MAJOR = ['peito', 'costas', 'pernas', 'ombros', 'biceps', 'triceps'];
const onGrid = (w) => w === 0 || Math.abs(w * 2 - Math.round(w * 2)) < 1e-9; // múltiplos de 0,5

// roundLoad
assert.equal(gen.roundLoad(0), 0);
assert.equal(gen.roundLoad(-3), 0);
assert.equal(gen.roundLoad(4.9), 5);
assert.equal(gen.roundLoad(0.4), 1); // nunca arredonda para 0 uma carga positiva
assert.equal(gen.roundLoad(33), 32.5);
assert.equal(gen.roundLoad(61), 60);
assert.equal(gen.roundLoad(63), 65);

// carga inicial: cresce com nível e peso, e limita peso corporal absurdo
assert.ok(gen.startingLoad('supino-reto', 70, 'avancado') > gen.startingLoad('supino-reto', 70, 'iniciante'));
assert.ok(gen.startingLoad('supino-reto', 90, 'iniciante') > gen.startingLoad('supino-reto', 60, 'iniciante'));
assert.equal(gen.startingLoad('barra-fixa', 70, 'avancado'), 0); // peso corporal
assert.equal(gen.startingLoad('exercicio-inexistente', 70, 'iniciante'), 0);
assert.equal(gen.startingLoad('supino-reto', 1000, 'iniciante'), gen.startingLoad('supino-reto', 150, 'iniciante'));
assert.equal(gen.startingLoad('supino-reto', 1, 'iniciante'), gen.startingLoad('supino-reto', 40, 'iniciante'));

// todo exercício que o gerador pode escolher existe no catálogo e tem estimativa de carga
for (const id of gen.GENERATOR_EXERCISE_IDS) {
  assert.ok(findExerciseById(id), 'não existe no catálogo: ' + id);
  assert.ok(Number.isFinite(gen.startingLoad(id, 70, 'iniciante')), 'sem estimativa: ' + id);
}
// nenhum é cardio (cardio entra só como aquecimento/finalização)
for (const id of gen.GENERATOR_EXERCISE_IDS) assert.notEqual(findExerciseById(id).muscleGroup, 'cardio', id);

let programs = 0;
for (const goal of goals) for (const level of levels) for (const frequencyPerWeek of freqs) {
  const p = gen.generateProgram({ goal, level, weightKg: 75, frequencyPerWeek }, 'p');
  programs++;
  const tag = `${goal}/${level}/${frequencyPerWeek}x`;

  assert.equal(p.workouts.length, frequencyPerWeek, tag + ': um treino por dia da semana');
  assert.equal(p.restSeconds, gen.REST_BY_GOAL[goal]);
  assert.equal(p.restSeconds % 15, 0);
  assert.equal(p.title, gen.GOAL_TITLE[goal]);
  assert.ok(p.split && p.note);

  // ids únicos e nomes com a letra certa
  assert.equal(new Set(p.workouts.map((w) => w.id)).size, p.workouts.length, tag + ': ids de treino repetidos');
  p.workouts.forEach((w, i) => assert.ok(w.name.startsWith(`Treino ${String.fromCharCode(65 + i)} · `), w.name));

  const groups = new Set();
  for (const w of p.workouts) {
    const ids = w.exercises.map((e) => e.exerciseId);
    assert.equal(new Set(ids).size, ids.length, `${tag} ${w.name}: exercício repetido`);
    assert.equal(w.exercises[0].exerciseId, 'bike', tag + ': começa com aquecimento');
    assert.equal(w.exercises[0].type, 'cardio');
    const strengthCount = w.exercises.filter((e) => e.type === 'strength').length;
    assert.ok(strengthCount >= 5 && strengthCount <= 7, `${tag} ${w.name}: ${strengthCount} exercícios de força`);

    for (const e of w.exercises) {
      const ex = findExerciseById(e.exerciseId);
      assert.ok(ex, 'catálogo: ' + e.exerciseId);
      assert.equal(e.groupKey, ex.muscleGroup);
      assert.equal(e.name, ex.name);
      assert.ok(Number.isInteger(e.sets) && e.sets >= 2 && e.sets <= 15, `${tag} sets ${e.exerciseId}=${e.sets}`);
      if (e.type === 'strength') {
        assert.ok(e.sets >= 2 && e.sets <= 4, `${tag} séries de força ${e.exerciseId}=${e.sets}`);
        assert.ok(Number.isInteger(e.reps) && e.reps >= 6 && e.reps <= 16, `${tag} reps ${e.exerciseId}=${e.reps}`);
        assert.ok(Number.isFinite(e.weight) && e.weight >= 0 && onGrid(e.weight), `${tag} carga ${e.exerciseId}=${e.weight}`);
        // exercício de peso corporal nunca recebe carga
        if (ex.equipment === 'peso-corporal') assert.equal(e.weight, 0, `${tag} ${e.exerciseId} deveria ter carga 0`);
        groups.add(e.groupKey);
      } else {
        assert.ok(e.minutes > 0 && e.bpmRange, 'cardio incompleto');
        assert.equal(e.sets, e.minutes, 'cardio: um conjunto por minuto');
      }
    }

    const finisher = w.exercises.at(-1);
    if (goal === 'ganhar-massa') assert.equal(w.exercises.filter((e) => e.type === 'cardio').length, 1, tag + ': sem cardio extra para ganhar massa');
    else { assert.equal(finisher.exerciseId, 'esteira', tag + ': finalização no cardio'); assert.equal(w.exercises.filter((e) => e.type === 'cardio').length, 2); }
    if (goal === 'perder-gordura') assert.equal(finisher.minutes, 15);
    if (goal === 'manter-forma') assert.equal(finisher.minutes, 8);
  }

  // semana cobre todos os grandes grupos
  for (const g of MAJOR) assert.ok(groups.has(g), `${tag}: ${g} não é trabalhado na semana`);

  // repetições: perder gordura > manter > ganhar massa nos compostos (mesmo nível e dia)
}

// repetições por objetivo, no mesmo dia/nível
const rep = (goal) => gen.generateProgram({ goal, level: 'intermediario', weightKg: 75, frequencyPerWeek: 3 }, 'p').workouts[0].exercises.find((e) => e.exerciseId === 'supino-reto').reps;
assert.ok(rep('perder-gordura') > rep('manter-forma') && rep('manter-forma') > rep('ganhar-massa'));

// iniciante: 2 repetições a mais nos compostos e menos séries; carga menor
const ini = gen.generateProgram({ goal: 'ganhar-massa', level: 'intermediario', weightKg: 75, frequencyPerWeek: 4 }, 'p').workouts[0];
const adv = gen.generateProgram({ goal: 'ganhar-massa', level: 'avancado', weightKg: 75, frequencyPerWeek: 4 }, 'p').workouts[0];
assert.ok(adv.exercises.find((e) => e.exerciseId === 'supino-reto').weight > gen.startingLoad('supino-reto', 75, 'iniciante'));
const inic = gen.generateProgram({ goal: 'ganhar-massa', level: 'iniciante', weightKg: 75, frequencyPerWeek: 4 }, 'p').workouts[0];
assert.ok(inic.exercises.find((e) => e.groupKey === 'peito').reps === 10); // 8 + 2
assert.ok(inic.exercises.find((e) => e.groupKey === 'peito').sets === 3);
assert.ok(ini.exercises.find((e) => e.groupKey === 'peito').sets === 4);

// iniciante usa exercícios guiados (máquina) nos grandes compostos; avançado, barra livre
const first = (level) => gen.generateProgram({ goal: 'ganhar-massa', level, weightKg: 75, frequencyPerWeek: 3 }, 'p').workouts[0].exercises.map((e) => e.exerciseId);
assert.ok(first('iniciante').includes('leg-press') && !first('iniciante').includes('agachamento'));
assert.ok(first('avancado').includes('agachamento') || gen.generateProgram({ goal: 'ganhar-massa', level: 'avancado', weightKg: 75, frequencyPerWeek: 3 }, 'p').workouts.some((w) => w.exercises.some((e) => e.exerciseId === 'agachamento')));

// frequência fora da faixa é limitada a 2..6
assert.equal(gen.generateProgram({ goal: 'manter-forma', level: 'iniciante', weightKg: 70, frequencyPerWeek: 1 }, 'p').workouts.length, 2);
assert.equal(gen.generateProgram({ goal: 'manter-forma', level: 'iniciante', weightKg: 70, frequencyPerWeek: 9 }, 'p').workouts.length, 6);
assert.equal(gen.generateProgram({ goal: 'manter-forma', level: 'iniciante', weightKg: 70, frequencyPerWeek: 3.4 }, 'p').workouts.length, 3);

// divisão por frequência
const names = (f, level = 'intermediario') => gen.generateProgram({ goal: 'ganhar-massa', level, weightKg: 70, frequencyPerWeek: f }, 'p').workouts.map((w) => w.name.split(' · ')[1]);
assert.deepEqual(names(3), ['Empurrar', 'Puxar', 'Pernas']);
assert.deepEqual(names(3, 'iniciante'), ['Corpo inteiro 1', 'Corpo inteiro 2', 'Corpo inteiro 3']);
assert.deepEqual(names(4), ['Superior', 'Inferior', 'Superior 2', 'Inferior 2']);
assert.deepEqual(names(5), ['Empurrar', 'Puxar', 'Pernas', 'Superior', 'Inferior']);
assert.deepEqual(names(6), ['Empurrar', 'Puxar', 'Pernas', 'Empurrar 2', 'Puxar 2', 'Pernas 2']);

// variação B usa exercícios diferentes da A
const six = gen.generateProgram({ goal: 'ganhar-massa', level: 'intermediario', weightKg: 70, frequencyPerWeek: 6 }, 'p').workouts;
const idsOf = (w) => new Set(w.exercises.filter((e) => e.type === 'strength').map((e) => e.exerciseId));
const sharedPush = [...idsOf(six[0])].filter((x) => idsOf(six[3]).has(x));
assert.ok(sharedPush.length < idsOf(six[0]).size, 'Empurrar B deveria variar em relação ao A');

// workoutGroups lista grupos sem cardio e sem repetir
const grp = gen.workoutGroups(six[0]);
assert.ok(grp.length >= 2 && new Set(grp).size === grp.length && !grp.includes('Cardio'));

// ids com prefixo padrão são únicos entre gerações diferentes (evita ligar histórico antigo ao treino novo)
const a = gen.generateProgram({ goal: 'manter-forma', level: 'iniciante', weightKg: 70, frequencyPerWeek: 3 }, 'x1').workouts[0].id;
const b = gen.generateProgram({ goal: 'manter-forma', level: 'iniciante', weightKg: 70, frequencyPerWeek: 3 }, 'x2').workouts[0].id;
assert.notEqual(a, b);

console.log(`generator: ${programs} programas verificados, todos os testes passaram (${allExercises.length} exercícios no catálogo)`);
