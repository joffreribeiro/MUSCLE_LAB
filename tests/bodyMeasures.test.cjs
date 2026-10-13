const m=require('../.test-build/data/bodyMeasures.js'),b=require('../.test-build/data/backup.js'),e=require('../.test-build/data/entryDate.js'),a=require('assert');
a.strictEqual(m.parseMeasure('82,5'),82.5);a.strictEqual(m.parseMeasure('5'),null);a.strictEqual(m.parseMeasure('300'),null);a.strictEqual(m.parseMeasure('x'),null);a.strictEqual(m.parseMeasure(''),null);
// definições
a.strictEqual(m.MEASURES.length,17);a.strictEqual(new Set(m.MEASURES.map(x=>x.key)).size,17);
a.deepStrictEqual(m.MEASURE_GROUPS.flatMap(g=>g.keys).sort(),m.MEASURES.map(x=>x.key).sort()); // todo campo do formulário tem definição e vice-versa
a.ok(m.MEASURE_GROUPS.every(g=>g.keys.length===1||g.keys.length===2));
a.strictEqual(m.measureLabel('bracoEsq'),'Braço esquerdo');a.strictEqual(m.measureShort('panturrilhaDir'),'Panturrilha dir.');
const iso=(d,h=10)=>new Date(2026,9,d,h).toISOString();
// migração
a.deepStrictEqual(m.migrateValues({braco:35,cintura:80,coxa:58,panturrilha:38}),{cintura:80,bracoEsq:35,bracoDir:35,coxaEsq:58,coxaDir:58,panturrilhaEsq:38,panturrilhaDir:38});
a.deepStrictEqual(m.migrateValues({braco:35,bracoDir:36}),{bracoDir:36,bracoEsq:35}); // lado informado vence
a.deepStrictEqual(m.migrateValues({xxx:1,cintura:'80',peito:NaN,ombros:100}),{ombros:100}); // desconhecidas e inválidas saem
a.deepStrictEqual(m.migrateValues({cintura:80}),{cintura:80});                          // idempotente
const mig=m.migrateEntries([{dateISO:iso(1),values:{braco:34}},{dateISO:iso(2),values:{xxx:1}},{dateISO:iso(3),values:{cintura:80}}]);
a.strictEqual(mig.length,2);a.deepStrictEqual(mig[0].values,{bracoEsq:34,bracoDir:34});
a.deepStrictEqual(m.migrateEntries(mig),mig);
// registro
let en=m.upsertMeasures([],iso(1),{cintura:84});
en=m.upsertMeasures(en,iso(8),{cintura:83,bracoEsq:35});
en=m.upsertMeasures(en,iso(8,18),{bracoEsq:35.5,coxaDir:58});
a.strictEqual(en.length,2);a.deepStrictEqual(en[1].values,{cintura:83,bracoEsq:35.5,coxaDir:58});
en=m.upsertMeasures(en,iso(15),{cintura:82});
// registro com data passada entra na ordem certa
en=m.upsertMeasures(en,iso(4),{cintura:83.5});a.deepStrictEqual(m.measureSeries(en,'cintura').map(p=>p.cm),[84,83.5,83,82]);
a.deepStrictEqual(m.latestMeasures(en).map(x=>x.key),['cintura','bracoEsq','coxaDir']);
a.strictEqual(m.latestMeasures(en)[0].delta,-1);
let r=m.removeMeasure(en,iso(8),'coxaDir');a.deepStrictEqual(r.find(x=>x.dateISO===iso(8)).values,{cintura:83,bracoEsq:35.5});
a.deepStrictEqual(m.removeMeasure(m.upsertMeasures([],iso(2),{pulsoEsq:17}),iso(2),'pulsoEsq'),[]);
a.strictEqual(m.formatCm(82),'82');a.strictEqual(m.formatDelta(-1.5),'−1,5');a.strictEqual(m.formatDelta(2),'+2');a.strictEqual(m.formatDelta(0),'0');
// data do registro
const now=new Date(2026,9,14,15,30);
a.strictEqual(e.entryDateISO(0,now),now.toISOString());
const d3=new Date(e.entryDateISO(3,now));a.strictEqual(d3.getDate(),11);a.strictEqual(d3.getHours(),12);
a.strictEqual(new Date(e.entryDateISO(14,now)).getMonth(),8); // setembro
a.strictEqual(new Date(e.entryDateISO(14,now)).getDate(),30);
a.strictEqual(e.describeEntryDay(0,now),'Hoje');a.strictEqual(e.describeEntryDay(1,now),'Ontem');a.strictEqual(e.describeEntryDay(3,now),'Dom., 11.10.2026');
a.strictEqual(e.clampDaysAgo(-2),0);a.strictEqual(e.clampDaysAgo(9999),365);a.strictEqual(e.clampDaysAgo(2.4),2);
// backup: medidas antigas são migradas ao restaurar; novas passam
const mk=ms=>JSON.stringify({app:'muscle-lab',version:1,data:{workouts:[{id:'w',name:'W',exercises:[]}],activeWorkoutId:'w',sessions:[],settings:{},profile:null,measures:ms}});
let p=b.parseBackup(mk([{dateISO:iso(1),values:{braco:34,cintura:80}}]));a.ok(p.ok);a.deepStrictEqual(p.backup.data.measures[0].values,{cintura:80,bracoEsq:34,bracoDir:34});
p=b.parseBackup(mk([{dateISO:iso(1),values:{bracoEsq:34.5,ombros:110}}]));a.ok(p.ok);a.deepStrictEqual(p.backup.data.measures[0].values,{bracoEsq:34.5,ombros:110});
a.ok(!b.parseBackup(mk([{dateISO:iso(1),values:{cintura:'80'}}])).ok);
console.log('ok');
