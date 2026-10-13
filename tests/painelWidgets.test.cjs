const w=require('../.test-build/data/painelWidgets.js'),a=require('assert');
const ids=p=>p.map(x=>x.id);
const def=w.defaultWidgetPrefs();a.deepStrictEqual(ids(def),['calendario','corpo','grupos','pesoLevantado','duracao','calorias','tipos','medidas','seriesSemana','peso']);a.ok(def.every(x=>x.visible));
// sem preferência salva: padrão; legado false esconde análises mas mantém o calendário
a.deepStrictEqual(w.resolveWidgets(undefined,undefined),def);a.deepStrictEqual(w.resolveWidgets(undefined,true),def);
const legacy=w.resolveWidgets(undefined,false);a.deepStrictEqual(legacy.filter(x=>x.visible).map(x=>x.id),['calendario']);a.strictEqual(legacy.length,10);
// preferência salva vence o legado
a.ok(w.resolveWidgets(def,false).every(x=>x.visible));
// ferramentas novas entram no fim; desconhecidas e repetidas saem; visible inválido vira true
const r=w.resolveWidgets([{id:'peso',visible:false},{id:'xxx',visible:true},{id:'peso',visible:true},{id:'calendario',visible:true}],true);
a.deepStrictEqual(ids(r),['peso','calendario','corpo','grupos','pesoLevantado','duracao','calorias','tipos','medidas','seriesSemana']);a.strictEqual(r[0].visible,false);a.ok(r.slice(1).every(x=>x.visible));
// mover
let m=w.moveWidget(def,'corpo',-1);a.deepStrictEqual(ids(m).slice(0,2),['corpo','calendario']);
a.strictEqual(w.moveWidget(def,'calendario',-1),def);a.strictEqual(w.moveWidget(def,'peso',1),def);
m=w.moveWidget(def,'calendario',1);a.deepStrictEqual(ids(m).slice(0,2),['corpo','calendario']);a.strictEqual(def[0].id,'calendario'); // imutável
// visibilidade
const v=w.setWidgetVisible(def,'medidas',false);a.strictEqual(v.find(x=>x.id==='medidas').visible,false);a.strictEqual(def.find(x=>x.id==='medidas').visible,true);
// seletor de período: antes da primeira ferramenta visível que o usa
a.strictEqual(w.firstPeriodWidget(def),'corpo');
let q=w.setWidgetVisible(w.setWidgetVisible(def,'corpo',false),'grupos',false);a.strictEqual(w.firstPeriodWidget(q),'pesoLevantado');
a.strictEqual(w.firstPeriodWidget(w.setWidgetVisible(q,'pesoLevantado',false)),'duracao');
for(const id of ['pesoLevantado','duracao','calorias','tipos','peso'])q=w.setWidgetVisible(q,id,false);a.strictEqual(w.firstPeriodWidget(q),null);
q=w.moveWidget(def,'peso',-1);
a.strictEqual(w.firstPeriodWidget(q),'corpo');
console.log('ok');
