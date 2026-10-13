const m=require('../.test-build/data/muscleLoad.js'),a=require('assert');
const today=new Date(2026,9,14,12);
const at=(d,id,extra={})=>({exerciseId:id,weight:50,reps:8,label:'',loggedAt:'',loggedAtISO:new Date(2026,9,d,10).toISOString(),...extra});
const sets=[at(14,'supino-reto'),at(14,'supino-reto'),at(13,'supino-reto'),at(12,'remada-baixa'),at(1,'agachamento'),at(14,'bike',{weight:0,reps:0,minutes:10}),at(14,'exercicio-inexistente')];
const r7=m.muscleLoad(sets,today,7);
console.log(Object.entries(r7.load).map(([k,v])=>k+'='+v).join(' '),'max',r7.max);
a.strictEqual(r7.load.peitoral,3);                    // 3 séries de supino (primário)
a.ok(r7.load.triceps>0&&r7.load.triceps<3);           // secundário vale 0,5 por série
a.strictEqual(r7.load.triceps,1.5);
a.ok(r7.load.dorsal>0);                               // remada
a.strictEqual(r7.load.quadriceps,undefined);          // agachamento fora de 7 dias
const all=m.muscleLoad(sets,today,null);a.ok(all.load.quadriceps>0);
const r30=m.muscleLoad(sets,today,30);a.ok(r30.load.quadriceps>0);
a.strictEqual(r7.max,Math.max(...Object.values(r7.load)));
// cardio e exercício desconhecido ignorados; sem séries = vazio
a.deepStrictEqual(m.muscleLoad([at(14,'bike',{weight:0,reps:0,minutes:10})],today,7),{load:{},max:0});
a.deepStrictEqual(m.muscleLoad([],today,null),{load:{},max:0});
// percentuais e faixas
a.strictEqual(m.loadPercent(3,3),100);a.strictEqual(m.loadPercent(1.5,3),50);a.strictEqual(m.loadPercent(0.01,100),1);a.strictEqual(m.loadPercent(0,3),0);a.strictEqual(m.loadPercent(1,0),0);
a.strictEqual(m.bandIndex(0),-1);a.strictEqual(m.bandIndex(1),0);a.strictEqual(m.bandIndex(19),0);a.strictEqual(m.bandIndex(20),1);a.strictEqual(m.bandIndex(49),1);a.strictEqual(m.bandIndex(50),2);a.strictEqual(m.bandIndex(79),2);a.strictEqual(m.bandIndex(80),3);a.strictEqual(m.bandIndex(100),3);
console.log('ok');
