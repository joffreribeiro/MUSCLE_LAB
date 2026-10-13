const path=require('path'),assert=require('assert');const b=path.join(__dirname,'..','.test-build');
const cat=require(path.join(b,'data/programCatalog.js')),pp=require(path.join(b,'data/programProgress.js')),gen=require(path.join(b,'data/programGenerator.js'));
const {findExerciseById}=require(path.join(b,'data/catalog.js'));
for(const spec of cat.PROGRAM_CATALOG){
  assert.ok(spec.weeks>=4,spec.id);
  const prog=cat.buildCatalogProgram(spec,75);
  assert.strictEqual(prog.workouts.length,spec.frequency,spec.id);
  for(const w of prog.workouts){const ids=w.exercises.map(e=>e.exerciseId);assert.strictEqual(new Set(ids).size,ids.length,spec.id+' dup '+w.name);ids.forEach(i=>assert.ok(findExerciseById(i),i));
    assert.ok(w.exercises.filter(e=>e.type==='strength').length<=9,spec.id+' muito longo');}
}
// foco acrescenta exercícios e do grupo certo
const gl=cat.buildCatalogProgram(cat.findProgramSpec('gluteos-em-foco'),75), base=gen.generateProgram({goal:'ganhar-massa',level:'intermediario',weightKg:75,frequencyPerWeek:4});
const n=p=>p.workouts.map(w=>w.exercises.length);
console.log('gluteos',n(gl),'base',n(base));
assert.ok(n(gl).some((x,i)=>x>n(base)[i]));
const br=cat.buildCatalogProgram(cat.findProgramSpec('bracos-fortes'),75);console.log('bracos',n(br));
const co=cat.buildCatalogProgram(cat.findProgramSpec('costas-largas'),75);console.log('costas',n(co));
const ab=cat.buildCatalogProgram(cat.findProgramSpec('abdomen-definido'),75);console.log('abdomen',n(ab));
// current
const act={specId:'base-solida',startedISO:new Date().toISOString(),weeks:8};
assert.ok(cat.isCurrentProgram(cat.findProgramSpec('base-solida'),null,act));assert.ok(!cat.isCurrentProgram(cat.findProgramSpec('queima-leve'),null,act));
assert.ok(!cat.isCurrentProgram(cat.findProgramSpec('abdomen-definido'),{goal:'perder-gordura',level:'iniciante',frequencyPerWeek:3},null));
// progress
const d=(y,m,dd)=>new Date(y,m,dd,10);const st=d(2026,9,1).toISOString();
let p=pp.programProgress(st,8,d(2026,9,1));assert.strictEqual(p.week,1);assert.strictEqual(p.phase.name,'Adaptação');assert.strictEqual(p.pct,0);assert.ok(!p.finished);
p=pp.programProgress(st,8,d(2026,9,13));assert.strictEqual(p.week,2);
p=pp.programProgress(st,8,d(2026,9,15));assert.strictEqual(p.week,3);assert.strictEqual(p.phase.name,'Progressão');
p=pp.programProgress(st,8,d(2026,10,12));assert.strictEqual(p.week,7);assert.strictEqual(p.phase.name,'Intensificação');
p=pp.programProgress(st,8,d(2026,10,19));assert.strictEqual(p.week,8);assert.strictEqual(p.phase.name,'Descarga');
p=pp.programProgress(st,8,d(2026,10,26));assert.ok(p.finished);assert.strictEqual(p.week,8);assert.strictEqual(p.pct,1);
for(const w of [4,6,8,12]){const ph=pp.programPhases(w);assert.strictEqual(ph[0].from,1);assert.strictEqual(ph[3].to,w);for(let i=1;i<4;i++)assert.strictEqual(ph[i].from,ph[i-1].to+1,w+' fases contíguas');}
console.log('ok');
