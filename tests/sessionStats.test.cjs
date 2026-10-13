const t=require('../.test-build/data/sessionStats.js'),a=require('assert');
const today=new Date(2026,9,14,12);
const ago=(n,h=10)=>new Date(2026,9,14-n,h).toISOString();
const sess=(id,n,dur,ids=['supino-reto'])=>({id,workoutId:'w',workoutName:'W',finishedAtISO:ago(n),durationSec:dur,sets:ids.map(e=>({exerciseId:e,weight:50,reps:8,label:'',loggedAt:'',loggedAtISO:ago(n)}))});
// período
const S=[sess('d',1,3000),sess('a',40,2400),sess('c',5,3600),sess('b',20,3000)];
a.deepStrictEqual(t.sessionsInPeriod(S,today,7).map(s=>s.id),['c','d']);
a.deepStrictEqual(t.sessionsInPeriod(S,today,30).map(s=>s.id),['b','c','d']);
a.deepStrictEqual(t.sessionsInPeriod(S,today,null).map(s=>s.id),['a','b','c','d']);
const many=Array.from({length:20},(_,i)=>sess('s'+i,20-i,1800));
const lim=t.sessionsInPeriod(many,today,null);a.strictEqual(lim.length,12);a.strictEqual(lim[11].id,'s19');a.strictEqual(lim[0].id,'s8'); // os 12 mais recentes, em ordem
a.deepStrictEqual(t.sessionsInPeriod([],today,7),[]);
// duração e calorias
a.strictEqual(t.durationMinutes({durationSec:3000}),50);a.strictEqual(t.durationMinutes({durationSec:29}),0);a.strictEqual(t.durationMinutes({durationSec:-5}),0);
a.strictEqual(t.estimateKcal(3600,80),480);a.strictEqual(t.estimateKcal(1800,70),210);a.strictEqual(t.estimateKcal(0,80),0);a.strictEqual(t.estimateKcal(-10,80),0);
a.strictEqual(t.average([10,20,31]),20);a.strictEqual(t.average([]),0);
// peso na data
const W=[{dateISO:ago(30),kg:85},{dateISO:ago(10),kg:83},{dateISO:ago(2),kg:82}];
a.strictEqual(t.weightOn(W,ago(40),70),70);          // antes de qualquer pesagem: reserva
a.strictEqual(t.weightOn(W,ago(25),70),85);
a.strictEqual(t.weightOn(W,ago(10,18),70),83);        // mesmo dia, depois do horário da pesagem: conta
a.strictEqual(t.weightOn(W,ago(5),70),83);
a.strictEqual(t.weightOn(W,ago(0),70),82);
a.strictEqual(t.weightOn([],ago(1),75),75);
a.strictEqual(t.sessionKcal(sess('x',5,3600),W,70),Math.round(6*83));
// tipos
const isCardio=id=>['bike','esteira'].includes(id);
a.strictEqual(t.exerciseKind('bike',true),'aquecimento');a.strictEqual(t.exerciseKind('esteira',true),'cardio');a.strictEqual(t.exerciseKind('supino-reto',false),'forca');
const ks=t.kindShare([sess('1',1,1,['bike','supino-reto','supino-reto','remada','esteira']),sess('2',2,1,['bike','agachamento'])],isCardio);
// treino 1: bike(aq), supino(1 exercício, 2 séries), remada, esteira; treino 2: bike, agachamento
a.strictEqual(ks.total,6);const m=Object.fromEntries(ks.items.map(i=>[i.key,i.count]));a.deepStrictEqual(m,{forca:3,aquecimento:2,cardio:1});
a.strictEqual(ks.items.reduce((x,i)=>x+i.pct,0),100);a.strictEqual(ks.items[0].key,'forca');
a.deepStrictEqual(t.kindShare([],isCardio),{total:0,items:[]});
console.log('ok');
