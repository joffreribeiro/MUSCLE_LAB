const {nextWorkout:n}=require('../.test-build/data/nextWorkout.js'),a=require('assert');
const W=['a','b','c'].map(id=>({id,name:id.toUpperCase(),exercises:[]}));
const ses=(id,wid,iso)=>({id,workoutId:wid,workoutName:'',finishedAtISO:iso,durationSec:1,sets:[]});
const today=new Date(2026,9,13,12);
a.strictEqual(n([],[],today),null);
let r=n(W,[],today);a.strictEqual(r.workout.id,'a');a.strictEqual(r.lastDone,null);a.strictEqual(r.trainedToday,false);
r=n(W,[ses('1','a','2026-10-10T10:00:00.000Z')],today);a.strictEqual(r.workout.id,'b');a.strictEqual(r.lastDone.workout.id,'a');
// mais recente decide, mesmo fora de ordem
r=n(W,[ses('1','a','2026-10-10T10:00:00.000Z'),ses('3','c','2026-10-12T10:00:00.000Z'),ses('2','b','2026-10-11T10:00:00.000Z')],today);a.strictEqual(r.workout.id,'a');a.strictEqual(r.lastDone.workout.id,'c');
// sessões de treino que não existe mais são ignoradas
r=n(W,[ses('1','antigo','2026-10-12T10:00:00.000Z')],today);a.strictEqual(r.workout.id,'a');a.strictEqual(r.lastDone,null);
// treinou hoje
r=n(W,[ses('1','b',new Date(2026,9,13,8).toISOString())],today);a.strictEqual(r.trainedToday,true);a.strictEqual(r.workout.id,'c');
// um treino só
r=n([W[0]],[ses('1','a','2026-10-10T10:00:00.000Z')],today);a.strictEqual(r.workout.id,'a');
console.log('ok');
