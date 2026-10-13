const t=require('../.test-build/data/trainingDays.js'),s=require('../.test-build/data/stats.js'),a=require('assert');
// padrão
a.deepStrictEqual(t.defaultTrainingDays(2),[1,4]);a.deepStrictEqual(t.defaultTrainingDays(3),[1,3,5]);a.deepStrictEqual(t.defaultTrainingDays(6),[1,2,3,4,5,6]);a.deepStrictEqual(t.defaultTrainingDays(1),[1,4]);a.deepStrictEqual(t.defaultTrainingDays(9),[1,2,3,4,5,6]);
for(let f=2;f<=6;f++)a.strictEqual(t.defaultTrainingDays(f).length,f);
// resolve
a.deepStrictEqual(t.resolveTrainingDays(undefined,3),[1,3,5]);a.deepStrictEqual(t.resolveTrainingDays([],3),[1,3,5]);a.deepStrictEqual(t.resolveTrainingDays([9],3),[1,3,5]);a.deepStrictEqual(t.resolveTrainingDays([1.5],4),[1,2,4,5]);
a.deepStrictEqual(t.resolveTrainingDays([0,6,2,2],3),[2,6,0]); // ordem seg..dom, sem repetir
// toggle
a.deepStrictEqual(t.toggleTrainingDay([1,3,5],0),[1,3,5,0]);a.deepStrictEqual(t.toggleTrainingDay([1,3,5],3),[1,5]);a.deepStrictEqual(t.toggleTrainingDay([2],2),[2]);a.deepStrictEqual(t.toggleTrainingDay([5],1),[1,5]);
// próximo dia
const wed=new Date(2026,9,14); // quarta
let n=t.nextTrainingDate([1,3,5],wed);a.strictEqual(n.getDate(),16);a.strictEqual(n.getDay(),5);
n=t.nextTrainingDate([3],wed);a.strictEqual(n.getDate(),21); // a mesma quarta só na semana seguinte
a.strictEqual(t.nextTrainingDate([],wed),null);
n=t.nextTrainingDate([1],new Date(2026,9,31));a.strictEqual(n.getMonth(),10);a.strictEqual(n.getDate(),2); // vira o mês
a.strictEqual(t.weekdayLong(1),'segunda-feira');a.strictEqual(t.weekdayShort(0),'Dom');
// calendário: outubro/2026 — 1/10 é quinta; hoje = quarta 14
const sess=(d)=>({id:String(d),workoutId:'w',workoutName:'',finishedAtISO:new Date(2026,9,d,10).toISOString(),durationSec:1,sets:[]});
const plan=[1,3,5];const since=new Date(2026,9,5);
const cal=s.monthCalendar([sess(5),sess(9)],wed,plan,since);
const c=d=>cal.cells[d-1];
a.ok(c(5).planned&&c(5).done&&!c(5).missed);       // seg 5: treinou
a.ok(c(7).planned&&c(7).missed);                    // qua 7: planejado e perdido
a.ok(c(9).planned&&c(9).done);                      // sex 9: treinou
a.ok(!c(6).planned&&!c(6).missed);                  // ter 6: descanso
a.ok(c(12).planned&&c(12).missed);                  // seg 12 perdido
a.ok(c(14).planned&&c(14).today&&!c(14).missed);    // hoje (quarta): planejado, não perdido ainda
a.ok(c(16).planned&&!c(16).missed);                 // futuro: planejado
a.strictEqual(cal.daysMissed,2);a.strictEqual(cal.daysTrained,2);
// antes do início do plano nada é perdido (1 e 2 de outubro: quinta e sexta)
a.ok(c(2).planned&&!c(2).missed); // sexta 2/10: planejada, mas antes do início do plano
// sem plano: nada marcado
const flat=s.monthCalendar([sess(5)],wed);a.ok(flat.cells.every(x=>!x.planned&&!x.missed));a.strictEqual(flat.daysMissed,0);
// com plano mas sem data de início: nunca "perdido"
const nosince=s.monthCalendar([],wed,plan,null);a.strictEqual(nosince.daysMissed,0);a.ok(nosince.cells.some(x=>x.planned));
console.log('ok');

// mudança de frequência
{
  const t = require('../.test-build/data/trainingDays.js');
  const a = require('node:assert');
  a.deepStrictEqual(t.daysAfterFrequencyChange([1, 3, 5], 3, 4), [1, 2, 4, 5]);       // acompanhava a frequência: vira o padrão novo
  a.deepStrictEqual(t.daysAfterFrequencyChange(undefined, 3, 5), [1, 2, 3, 4, 5]);    // sem escolha salva: padrão
  a.strictEqual(t.daysAfterFrequencyChange([2, 6], 3, 4), undefined);                 // plano próprio (2 dias para 3x): mantém
  a.strictEqual(t.daysAfterFrequencyChange([1, 3, 5], 3, 3), undefined);              // mesma frequência
  a.deepStrictEqual(t.daysAfterFrequencyChange([0, 2, 4], 3, 6), [1, 2, 3, 4, 5, 6]); // dias diferentes do padrão, mas 3 para 3x: segue
  console.log('trainingDays/frequência: ok');
}
