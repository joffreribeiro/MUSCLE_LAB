const r=require('../.test-build/data/records.js'),a=require('assert');
a.strictEqual(r.estimate1RM(100,1),100);a.strictEqual(r.estimate1RM(100,10),133.5);a.strictEqual(r.estimate1RM(100,13),null);a.strictEqual(r.estimate1RM(0,10),null);
const set=(id,w,rep,x={})=>({exerciseId:id,weight:w,reps:rep,label:'',loggedAt:'',loggedAtISO:'2026-10-01T10:00:00Z',...x});
const ses=(id,day,sets)=>({id,workoutId:'w',workoutName:'W',finishedAtISO:`2026-10-${day}T10:00:00Z`,durationSec:1,sets});
const s1=ses('a','01',[set('sup',60,10),set('sup',60,8),set('rem',40,10)]);
const s2=ses('b','05',[set('sup',62.5,8),set('sup',60,10)]);
const s3=ses('c','09',[set('sup',60,12),set('bar',0,8)]);
const ev=r.exerciseEvolution('sup',[s3,s1,s2]);
a.strictEqual(ev.points.length,3);a.strictEqual(ev.points[0].dateISO,s1.finishedAtISO);
a.strictEqual(ev.records.maxWeight.kg,62.5);a.strictEqual(ev.records.best1RM.kg,r.estimate1RM(60,12)>r.estimate1RM(62.5,8)?r.estimate1RM(60,12):r.estimate1RM(62.5,8));
console.log(ev.records.best1RM, ev.points.map(p=>p.e1rm));
// primeiro treino: sem recordes
a.deepStrictEqual(r.newRecords(s1,[]),[]);
// s2: carga 62.5 > 60 ; 1RM 62.5x8=79,2 -> 79,0 vs 60x10=80
const n2=r.newRecords(s2,[s1]);console.log(n2);
a.ok(n2.some(x=>x.kind==='carga'&&x.value===62.5&&x.previous===60));
// s3: 60x12 = 84 > 80: 1RM sem carga
const n3=r.newRecords(s3,[s1,s2]);console.log(n3);
a.ok(n3.some(x=>x.exerciseId==='sup'&&x.kind==='1rm'));a.ok(!n3.some(x=>x.kind==='carga'));
// peso corporal
const b1=ses('d','10',[set('bar',0,8)]),b2=ses('e','12',[set('bar',0,10)]);
a.deepStrictEqual(r.newRecords(b2,[b1]),[{exerciseId:'bar',kind:'reps',value:10,previous:8}]);
a.strictEqual(r.exerciseEvolution('bar',[b1,b2]).bodyweight,true);
// cardio ignorado
const c=ses('f','13',[set('esteira',0,0,{minutes:15})]);a.strictEqual(r.exerciseEvolution('esteira',[c]).points.length,0);
console.log('ok');
