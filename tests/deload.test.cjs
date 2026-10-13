const d=require('../.test-build/data/deload.js'),a=require('assert');
const today=new Date(2026,9,14,12);
const day=n=>new Date(2026,9,14-n,10).toISOString();
const set=(rir,w=40)=>({exerciseId:'x',weight:w,reps:8,label:'',loggedAt:'',loggedAtISO:day(0),rir});
const ses=(id,n,rirs)=>({id,workoutId:'w',workoutName:'W',finishedAtISO:day(n),durationSec:1,sets:rirs.map(r=>set(r))});
// 3 treinos com RIR médio < 1 -> sinal
let r=d.deloadSignal([ses('c',1,[0,1]),ses('b',3,[0,0]),ses('a',5,[1,0])],today);
a.ok(r);a.strictEqual(r.latestSessionId,'c');a.deepStrictEqual(r.rirs,[0.5,0,0.5]);
// menos de 3 treinos
a.strictEqual(d.deloadSignal([ses('b',3,[0]),ses('a',5,[0])],today),null);
// um treino com RIR bom quebra a sequência
a.strictEqual(d.deloadSignal([ses('c',1,[0,1]),ses('b',3,[2,3]),ses('a',5,[0,0])],today),null);
// RIR exatamente 1 não conta como abaixo
a.strictEqual(d.deloadSignal([ses('c',1,[1,1]),ses('b',3,[0]),ses('a',5,[0])],today),null);
// treinos sem RIR são ignorados (não quebram nem contam)
const noRir={id:'n',workoutId:'w',workoutName:'',finishedAtISO:day(2),durationSec:1,sets:[{exerciseId:'x',weight:40,reps:8,label:'',loggedAt:'',loggedAtISO:day(2)}]};
r=d.deloadSignal([ses('c',1,[0]),noRir,ses('b',3,[0]),ses('a',5,[0])],today);a.ok(r);a.strictEqual(r.latestSessionId,'c');
// treino mais recente muito antigo
a.strictEqual(d.deloadSignal([ses('c',20,[0]),ses('b',22,[0]),ses('a',24,[0])],today),null);
// só olha os 3 mais recentes (antigos ruins não importam)
a.ok(d.deloadSignal([ses('d',1,[0]),ses('c',2,[0]),ses('b',3,[0]),ses('a',9,[3])],today));
// séries sem carga (peso corporal) não entram na média
const bw=ses('bw',1,[]);bw.sets=[{exerciseId:'x',weight:0,reps:10,label:'',loggedAt:'',loggedAtISO:day(1),rir:0}];
a.strictEqual(d.deloadSignal([bw,ses('b',3,[0]),ses('a',5,[0])],today),null);
// cargas
const ex=(w,type='strength')=>({exerciseId:'x',name:'x',groupLabel:'',groupKey:'peito',type,sets:3,reps:8,weight:w});
const out=d.deloadWorkouts([{id:'w',name:'W',exercises:[ex(50),ex(47.5),ex(100),ex(8),ex(1),ex(0),ex(undefined),ex(60,'cardio')]}]).exercises||d.deloadWorkouts([{id:'w',name:'W',exercises:[ex(50),ex(47.5),ex(100),ex(8),ex(1),ex(0),ex(undefined),ex(60,'cardio')]}])[0].exercises;
console.log(out.map(e=>e.weight));
a.strictEqual(out[0].weight,45);a.strictEqual(out[1].weight,42.5);a.strictEqual(out[2].weight,90);
a.ok(out[3].weight<8&&out[3].weight>=0);a.strictEqual(out[4].weight,1);
a.strictEqual(out[5].weight,0);a.strictEqual(out[6].weight,undefined);a.strictEqual(out[7].weight,60);
console.log('ok');
