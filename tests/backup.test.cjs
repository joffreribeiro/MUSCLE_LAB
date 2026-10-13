const b=require('../.test-build/data/backup.js'),a=require('assert');
const data={workouts:[{id:'w1',name:'A',exercises:[{exerciseId:'supino-reto',name:'x'}]},{id:'w2',name:'B',exercises:[]}],activeWorkoutId:'w2',
 sessions:[{id:'s1',workoutId:'w1',workoutName:'A',finishedAtISO:'2026-10-05T10:00:00.000Z',durationSec:10,sets:[{exerciseId:'supino-reto',weight:50,reps:8,label:'',loggedAt:'',loggedAtISO:'2026-10-05T10:00:00.000Z'}]},
  {id:'s2',workoutId:'w1',workoutName:'A',finishedAtISO:'2026-10-09T10:00:00.000Z',durationSec:10,sets:[]}],
 comments:{a:'x'},settings:{descansoSegundos:90,pesoCorporalKg:78,mostrarAnalytics:true},profile:{goal:'ganhar-massa',level:'iniciante',weightKg:70,heightCm:170,age:30,sex:'masculino',frequencyPerWeek:3},
 onboardingComplete:true,weights:[{dateISO:'2026-10-01T10:00:00.000Z',kg:80}],measures:[],activeProgram:{specId:'base-solida',startedISO:'2026-10-01T10:00:00.000Z',weeks:8}};
const now=new Date(2026,9,13,9);
const bk=b.buildBackup(data,now);const text=JSON.stringify(bk,null,2);
a.strictEqual(b.backupFileName(now),'muscle-lab-backup-2026-10-13.json');
let r=b.parseBackup(text);a.ok(r.ok);a.deepStrictEqual(r.backup.data,data);
// espaços em volta
a.ok(b.parseBackup('\n  '+text+'\n').ok);
const sm=b.summarizeBackup(data);a.deepStrictEqual(sm,{workouts:2,sessions:2,weights:1,measures:0,lastSessionISO:'2026-10-09T10:00:00.000Z'});
a.strictEqual(b.summarizeBackup({...data,sessions:[]}).lastSessionISO,null);
const bad=(mut,frag)=>{const c=JSON.parse(text);mut(c);const x=b.parseBackup(JSON.stringify(c));a.ok(!x.ok,frag);return x.error};
a.ok(!b.parseBackup('não é json').ok);a.ok(!b.parseBackup('{}').ok);a.ok(!b.parseBackup('[1,2]').ok);a.ok(!b.parseBackup('').ok);
bad(c=>{c.app='outro'});bad(c=>{c.version=99});bad(c=>{delete c.data.workouts});bad(c=>{c.data.workouts[0].exercises=[{x:1}]});
bad(c=>{c.data.sessions[0].sets[0].weight='50'});bad(c=>{c.data.sessions[0].finishedAtISO='ontem'});bad(c=>{c.data.weights=[{dateISO:'x',kg:1}]});bad(c=>{c.data.settings=null});bad(c=>{c.data.profile='x'});
// tolerâncias: ausentes viram padrão
let c=JSON.parse(text);delete c.data.weights;delete c.data.comments;delete c.data.activeProgram;c.data.activeWorkoutId='inexistente';c.data.profile=null;
r=b.parseBackup(JSON.stringify(c));a.ok(r.ok);a.deepStrictEqual(r.backup.data.weights,[]);a.deepStrictEqual(r.backup.data.comments,{});a.strictEqual(r.backup.data.activeProgram,null);a.strictEqual(r.backup.data.activeWorkoutId,'w1');a.strictEqual(r.backup.data.profile,null);
console.log('ok');
