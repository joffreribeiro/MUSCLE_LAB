const r=require('../.test-build/data/recommendations.js'),a=require('assert');
const today=new Date(2026,9,14,12); // quarta
const base={today,deloadRirs:null,reminder:null,finishedProgramWeeks:null,missedPlanned:0,idleGroups:[],loadUps:[]};
a.deepStrictEqual(r.buildRecommendations(base),[]);
const rem={needsWeight:true,needsMeasures:false,daysSince:20,neverRecorded:false};
const all=r.buildRecommendations({...base,deloadRirs:[0.3,0.5,0.2],reminder:rem,finishedProgramWeeks:8,missedPlanned:3,idleGroups:['Pernas','Ombros'],loadUps:[{name:'Supino reto',from:47.5,to:50}]});
// ordem de importância e limite de 4
a.deepStrictEqual(all.map(x=>x.id),['descarga','lembrete','programa-concluido','perdidos']);
a.strictEqual(all[0].tone,'alerta');a.strictEqual(all[0].action.kind,'deload');a.ok(all[0].text.includes('0,3, 0,5, 0,2'));a.ok(all[0].text.includes('10%'));
a.strictEqual(all[1].title,'Hora de registrar seu peso');a.strictEqual(all[1].action.kind,'medidas');
a.strictEqual(all[2].action.kind,'programas');a.ok(all[2].text.includes('8 semanas'));
a.strictEqual(all[3].title,'3 treinos planejados perdidos');
// itens menores quando não há os maiores
const small=r.buildRecommendations({...base,idleGroups:['Pernas'],loadUps:[{name:'A',from:10,to:11},{name:'B',from:20,to:22.5},{name:'C',from:30,to:32.5},{name:'D',from:40,to:42.5}]});
a.deepStrictEqual(small.map(x=>x.id),['musculo-parado','subir-carga']);
a.strictEqual(small[0].title,'Um músculo ficou de fora');a.ok(small[0].text.endsWith('Pernas.'));
a.ok(small[1].text.includes('A (10 → 11 kg)')&&small[1].text.includes('C (30 → 32,5 kg)')&&!small[1].text.includes('D ('));
a.strictEqual(r.buildRecommendations({...base,idleGroups:['A','B']})[0].title,'Músculos ficaram de fora');
// perdidos: só a partir de 2
a.deepStrictEqual(r.buildRecommendations({...base,missedPlanned:1}),[]);a.strictEqual(r.buildRecommendations({...base,missedPlanned:2}).length,1);
// dispensadas
const until=r.snoozeRecommendation(today);a.strictEqual(new Date(until).getDate(),17);
a.deepStrictEqual(r.buildRecommendations({...base,idleGroups:['Pernas'],snoozed:{'musculo-parado':until}}),[]);
a.strictEqual(r.buildRecommendations({...base,idleGroups:['Pernas'],snoozed:{'musculo-parado':until},today:new Date(2026,9,17,8)}).length,1);
a.strictEqual(r.buildRecommendations({...base,idleGroups:['Pernas'],snoozed:{perdidos:until}}).length,1); // outro id não afeta
// quando um grande é dispensado, o próximo da fila entra no limite
const q=r.buildRecommendations({...base,deloadRirs:[0.1,0.2,0.3],reminder:rem,finishedProgramWeeks:6,missedPlanned:2,idleGroups:['X'],snoozed:{'lembrete':until}});
a.deepStrictEqual(q.map(x=>x.id),['descarga','programa-concluido','perdidos','musculo-parado']);
// treinos perdidos
const ses=(n)=>({id:'s'+n,workoutId:'w',workoutName:'',finishedAtISO:new Date(2026,9,14-n,10).toISOString(),durationSec:1,sets:[]});
const plan=[1,3,5]; // seg, qua, sex
// hoje qua 14: últimos 7 dias = 13(ter) 12(seg) 11(dom) 10(sáb) 9(sex) 8(qui) 7(qua)
a.strictEqual(r.missedPlannedDays([],today,plan,new Date(2026,9,1)),3); // seg 12, sex 9, qua 7
a.strictEqual(r.missedPlannedDays([ses(2)],today,plan,new Date(2026,9,1)),2); // treinou seg 12
a.strictEqual(r.missedPlannedDays([ses(2),ses(5),ses(7)],today,plan,new Date(2026,9,1)),0);
a.strictEqual(r.missedPlannedDays([],today,plan,new Date(2026,9,10)),1);      // plano começou sáb 10: só seg 12
a.strictEqual(r.missedPlannedDays([],today,plan,null),0);
a.strictEqual(r.missedPlannedDays([],today,[],new Date(2026,9,1)),0);
a.strictEqual(r.missedPlannedDays([],today,plan,new Date(2026,9,14)),0);       // plano começa hoje

// findLoadUps: sugestões de carga que ainda não estão no treino
const ex=(id,w,type='strength')=>({exerciseId:id,name:id.toUpperCase(),groupLabel:'',groupKey:'peito',type,sets:3,reps:10,weight:w});
const wk=(id,exs)=>({id,name:id,exercises:exs});
const sess=(n,id,w,rir)=>({id:'s'+n,workoutId:'w',workoutName:'',finishedAtISO:new Date(2026,9,14-n,10).toISOString(),durationSec:1,sets:Array.from({length:3},()=>({exerciseId:id,weight:w,reps:10,label:'',loggedAt:'',loggedAtISO:new Date(2026,9,14-n,10).toISOString(),rir}))});
let ups=r.findLoadUps([wk('a',[ex('supino',40)])],[sess(1,'supino',40,4)]);
a.deepStrictEqual(ups,[{exerciseId:'supino',name:'SUPINO',from:40,to:42.5}]);
a.deepStrictEqual(r.findLoadUps([wk('a',[ex('supino',42.5)])],[sess(1,'supino',40,4)]),[]);   // já aplicado
a.deepStrictEqual(r.findLoadUps([wk('a',[ex('supino',50)])],[sess(1,'supino',40,4)]),[]);     // prescrito acima
a.deepStrictEqual(r.findLoadUps([wk('a',[ex('supino',40)])],[sess(1,'supino',40,1)]),[]);     // RIR baixo: manter
a.deepStrictEqual(r.findLoadUps([wk('a',[ex('supino',40)])],[]),[]);                          // sem histórico
a.deepStrictEqual(r.findLoadUps([wk('a',[ex('bike',0,'cardio')])],[sess(1,'bike',0,4)]),[]);  // cardio fora
ups=r.findLoadUps([wk('a',[ex('supino',40)]),wk('b',[ex('supino',40),ex('remada',30)])],[sess(1,'supino',40,4),sess(2,'remada',30,3)]);
a.deepStrictEqual(ups.map(x=>x.exerciseId),['supino','remada']);                              // sem repetir exercício
a.strictEqual(r.buildRecommendations({...base,loadUps:ups})[0].action.kind,'cargas');
console.log('ok');
