const u=require('../.test-build/data/updateReminder.js'),a=require('assert');
const today=new Date(2026,9,14,12);
const ago=(n,h=10)=>new Date(2026,9,14-n,h).toISOString();
const w=n=>({dateISO:ago(n),kg:80}), m=n=>({dateISO:ago(n),values:{cintura:80}});
// sem nenhum dado de uso: nada
a.strictEqual(u.updateReminder([],[],null,today),null);
// usuário novo (começou há 3 dias): nada
a.strictEqual(u.updateReminder([],[],ago(3),today),null);
// começou há 20 dias sem pesar: só peso
let r=u.updateReminder([],[],ago(20),today);a.ok(r);a.ok(r.needsWeight&&!r.needsMeasures);a.ok(r.neverRecorded);a.strictEqual(r.daysSince,20);
// começou há 40 dias: peso e medidas
r=u.updateReminder([],[],ago(40),today);a.ok(r.needsWeight&&r.needsMeasures);
// pesou há 5 dias, medidas há 40: só medidas
r=u.updateReminder([w(5)],[m(40)],ago(60),today);a.ok(!r.needsWeight&&r.needsMeasures);a.strictEqual(r.daysSince,5);a.ok(!r.neverRecorded);
// tudo em dia
a.strictEqual(u.updateReminder([w(5)],[m(10)],ago(60),today),null);
// limites: 13 dias sem pesar não, 14 sim; 29 medidas não, 30 sim
a.strictEqual(u.updateReminder([w(13)],[m(1)],ago(60),today),null);
a.ok(u.updateReminder([w(14)],[m(1)],ago(60),today).needsWeight);
a.strictEqual(u.updateReminder([w(1)],[m(29)],ago(60),today),null);
a.ok(u.updateReminder([w(1)],[m(30)],ago(60),today).needsMeasures);
// usa o registro mais recente, em qualquer ordem
a.strictEqual(u.updateReminder([w(40),w(2),w(20)],[m(1)],ago(60),today),null);
// sem data de início mas com registros: usa o mais antigo como início
r=u.updateReminder([w(20)],[],null,today);a.ok(r&&r.needsWeight&&!r.needsMeasures);
// adiar: escondido até a data, volta no dia
const until=u.snoozeUntil(today);a.strictEqual(new Date(until).getDate(),17);
a.strictEqual(u.updateReminder([],[],ago(40),today,until),null);
a.strictEqual(u.updateReminder([],[],ago(40),new Date(2026,9,16,23),until),null);
a.ok(u.updateReminder([],[],ago(40),new Date(2026,9,17,8),until));
// textos
const both={needsWeight:true,needsMeasures:true,daysSince:20,neverRecorded:false};
a.strictEqual(u.reminderTitle(both),'Hora de atualizar peso e medidas');
a.strictEqual(u.reminderTitle({...both,needsMeasures:false}),'Hora de registrar seu peso');
a.strictEqual(u.reminderTitle({...both,needsWeight:false}),'Hora de atualizar suas medidas');
a.ok(u.reminderText(both).startsWith('Seu último registro foi há 20 dias.'));a.ok(u.reminderText({...both,daysSince:1}).startsWith('Seu último registro foi há 1 dia.'));a.ok(u.reminderText({...both,daysSince:0}).startsWith('Seu último registro foi hoje.'));a.ok(u.reminderText({...both,neverRecorded:true}).startsWith('Você ainda não registrou'));
console.log('ok');
