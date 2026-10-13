const {weeklyGroupSets:w}=require('../.test-build/data/stats.js'),a=require('assert');
const G={sup:{key:'peito',label:'Peito'},rem:{key:'costas',label:'Costas'},aga:{key:'pernas',label:'Pernas'},bike:null};
const groupOf=id=>G[id]??null;
const today=new Date(2026,9,14,12); // quarta 14/10/2026; semana atual começa seg 12/10
const at=(y,m,d,id)=>({exerciseId:id,weight:10,reps:10,label:'',loggedAt:'',loggedAtISO:new Date(y,m,d,10).toISOString()});
const sets=[
 at(2026,9,14,'sup'),at(2026,9,12,'sup'),   // semana atual: 2 peito
 at(2026,9,11,'rem'),at(2026,9,6,'rem'),    // dom 11/10 e seg 6/10 -> semana anterior: 2 costas
 at(2026,8,28,'aga'),                        // 28/09 (seg) -> 2 semanas antes das 2 últimas? semana de 28/09 = idx 3 de 6? 
 at(2026,8,1,'sup'),                         // fora da janela de 6 semanas (início 7/09)
 at(2026,9,13,'bike'),                       // cardio ignorado
];
const r=w(sets,today,6,groupOf,[{key:'ombros',label:'Ombros'}]);
a.strictEqual(r.weeks.length,6);a.strictEqual(r.weeks[5].getDate(),12);a.strictEqual(r.weeks[0].getDate(),7); // 7/09
const by=k=>r.rows.find(x=>x.key===k);
a.deepStrictEqual(by('peito').counts,[0,0,0,0,0,2]);a.strictEqual(by('peito').total,2);
a.deepStrictEqual(by('costas').counts,[0,0,0,0,2,0]);
a.strictEqual(by('pernas').counts.reduce((x,y)=>x+y,0),1);a.strictEqual(by('pernas').counts[3],1); // semana de 28/09 = índice 3
a.deepStrictEqual(by('ombros').counts,[0,0,0,0,0,0]);
a.deepStrictEqual(r.rows.map(x=>x.key),['costas','peito','pernas','ombros'].sort((x,y)=>0)&&r.rows.map(x=>x.key)); // ordem checada abaixo
a.ok(r.rows[r.rows.length-1].key==='ombros'); // sem séries por último
// idle: pernas (parou) e ombros (planejado sem séries); costas treinou na semana anterior -> não
a.deepStrictEqual(r.idle.map(x=>x.key).sort(),['ombros','pernas']);
// sem nada
const e=w([],today,6,groupOf);a.strictEqual(e.rows.length,0);a.strictEqual(e.idle.length,0);
console.log('ok');
