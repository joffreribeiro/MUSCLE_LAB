const n=require('../.test-build/data/sessionNote.js'),b=require('../.test-build/data/backup.js'),a=require('assert');
a.strictEqual(n.normalizeNote('  oi  '),'oi');a.strictEqual(n.normalizeNote('   '),undefined);a.strictEqual(n.normalizeNote(''),undefined);
a.strictEqual(n.normalizeNote('x'.repeat(600)).length,500);
// toggle
a.strictEqual(n.toggleTag('','Dormi mal'),'Dormi mal');
a.strictEqual(n.toggleTag('Ombro incomodou','Dormi mal'),'Ombro incomodou. Dormi mal');
a.strictEqual(n.toggleTag('Ombro incomodou.','Dormi mal'),'Ombro incomodou. Dormi mal');
a.strictEqual(n.toggleTag('Dormi mal','Dormi mal'),'');
a.strictEqual(n.toggleTag('Ombro incomodou. Dormi mal','Dormi mal'),'Ombro incomodou');
a.strictEqual(n.toggleTag('Dormi mal. Sem energia','Dormi mal'),'Sem energia');
a.strictEqual(n.toggleTag('A. Dormi mal. B','Dormi mal'),'A. B');
a.ok(n.hasTag('hoje dormi mal ontem','Dormi mal'));a.ok(!n.hasTag('ok','Dormi mal'));
// ida e volta
let t='';for(const tag of n.NOTE_TAGS)t=n.toggleTag(t,tag);for(const tag of n.NOTE_TAGS)a.ok(n.hasTag(t,tag));for(const tag of n.NOTE_TAGS)t=n.toggleTag(t,tag);a.strictEqual(t,'');
// backup: nota opcional, mas se existir tem de ser texto
const mk=note=>JSON.stringify({app:'muscle-lab',version:1,data:{workouts:[{id:'w',name:'W',exercises:[]}],activeWorkoutId:'w',sessions:[{id:'s',workoutId:'w',workoutName:'W',finishedAtISO:'2026-10-05T10:00:00.000Z',durationSec:1,sets:[],...(note===undefined?{}:{note})}],settings:{},profile:null}});
a.ok(b.parseBackup(mk(undefined)).ok);const ok=b.parseBackup(mk('Dormi mal'));a.ok(ok.ok);a.strictEqual(ok.backup.data.sessions[0].note,'Dormi mal');a.ok(!b.parseBackup(mk(5)).ok);
console.log('ok');
