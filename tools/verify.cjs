// Run with Node + Playwright installed (NODE_PATH may point to a shared installation).
// Uses a disposable browser profile: never touches the user's workout data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'pf_workout_tracker.html'), 'utf8');
for (const [i, m] of [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].entries()) {
  new vm.Script(m[1], { filename: `inline-${i}.js` });
}

let server, browser;
(async () => {
  const output=path.join(root,'.verification');fs.mkdirSync(output,{recursive:true});
  if(!process.env.APP_URL){
    server=spawn(process.execPath,[path.join(__dirname,'serve.js'),'18753'],{windowsHide:true});
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error(`Server exited: ${code}`)));});
  }
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}), ...(process.env.CHROMIUM_PATH ? {} : process.env.BROWSER_CHANNEL ? {channel:process.env.BROWSER_CHANNEL} : process.platform==='win32'?{channel:'msedge'}:{}) });
  const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // Network services are optional; tests must be deterministic and offline-capable.
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto(process.env.APP_URL || 'http://localhost:18753/pf_workout_tracker.html');
  await page.waitForFunction(() => typeof FOCUS_META !== 'undefined' && document.readyState === 'complete');
  await page.waitForTimeout(2300);
  const results = await page.evaluate(() => {
    const results = [];
    const test = (name, fn) => { try { fn(); results.push({ name, pass: true }); } catch (e) { results.push({ name, pass: false, error: e.message }); } };
    const check = (ok, msg) => { if (!ok) throw new Error(msg); };
    const reset = () => {
      S = initS(); migrateState(); S.prefs.autoRotateSplits = false; S.prefs.autoTimer = false; S.prefs.timerSound=false; S.prefs.haptics=false;
      S.prefs.autoSuperset = false; _advSuggestEnabled = false;
      vDate = new Date('2026-10-01T12:00:00'); cMode = 'gym';
      S.dayConfig[dKey(vDate)] = { type: 'gym', split: 'upper' };
      document.querySelectorAll('.mo').forEach(m => m.classList.remove('show'));
    };
    const set = (weight, reps, type = 'wk', done = true) => ({ weight: String(weight), reps: String(reps), type, done });
    const history = (date, sets, name = 'Bench Press (Barbell)') => ({ id: Date.parse(date), date, type: 'gym', exercises: [{ name, sets }] });
    test('single-rep max is the actual load', () => { reset(); check(est1RM(100, 1) === 100, '100 x 1 must not become 105'); });
    test('last session excludes warmups/drops and uses calendar order', () => {
      reset(); S.weekFocus = 'muscle';
      S.history = [history('2026-09-29', [set(100,12),set(100,12),set(100,12),set(40,20,'ds'),set(45,5,'wu',false)]), history('2026-09-01',[set(60,8)])];
      const last = getLastExSession('Bench Press (Barbell)');
      check(last.weight === 100 && last.ceilingHit && last.sets === 3, JSON.stringify(last));
    });
    test('future and current sessions do not prescribe their own progression', () => {
      reset(); S.history=[history('2026-09-29',[set(100,8)]),history('2026-10-01',[set(200,12)]),history('2026-10-05',[set(300,12)])];
      check(getLastExSession('Bench Press (Barbell)').weight===100, 'must use previous calendar date');
    });
    test('muscle progress preserves earned reps instead of resetting to floor', () => {
      reset(); S.weekFocus='muscle'; S.history=[history('2026-09-29',[set(100,10),set(100,10),set(100,10)])];
      const p=getProgression('Bench Press (Barbell)',9,3,0.95);
      check(p.weight===100 && p.reps>=10,JSON.stringify(p));
    });
    test('exhausted sets do not trigger automatic load increases', () => {
      reset(); S.weekFocus='muscle'; S.history=[history('2026-09-29',Array.from({length:3},()=>({...set(100,12),rpe:10})))];
      check(getProgression('Bench Press (Barbell)',9,3,0.95).weight===100,'RPE 10 should hold load');
    });
    test('plate snapping down is inclusive of an already-loadable weight', () => { reset(); check(snapToLoadable('Bench Press (Barbell)',100,'down')===100,'100 must stay 100'); });
    test('empty equipment does not unlock barbells', () => { reset(); check(!isExerciseAvailable('Bench Press (Barbell)',[]),'empty gym allows bench press'); });
    test('unavailable substitutions fail closed', () => {
      reset(); const ex=getEquipmentSafeExercise({n:'Lat Pull-Down Machine',sets:3,reps:10},{equipment:[]},[]);
      check(!ex || isExerciseAvailable(ex.n,[]),'unavailable fallback: '+(ex&&ex.n));
    });
    test('saving a correction recomputes records', () => {
      reset(); buildTodayWorkout(); const k=dKey(vDate),g=S.sessions[k].gym;
      Object.values(g.exercises).forEach(e=>e.sets.forEach(s=>s.done=false));
      g.exercises[0].sets[0]=set(300,10); doSaveWorkout(3,'test');
      g.exercises[0].sets[0]=set(100,10); doSaveWorkout(3,'correction');
      check(S.history.length===1,'duplicate history');
      check(!Object.values(S.pbs).some(p=>Number(p.weight)>100),'stale 300 lb record');
    });
    test('warmups and rest-pause clusters cannot establish strength records', () => {
      reset(); S.history=[history('2026-09-29',[set(100,8),set(300,10,'wu'),set(200,30,'rp')])]; recomputePBs();
      check(!Object.values(S.pbs).some(p=>Number(p.weight)>100),'non-comparable record');
    });
    test('changing intensity preserves exercise identity of completed sets', () => {
      reset(); S.weekFocus='power'; S.dayConfig[dKey(vDate)].split='arms'; buildTodayWorkout();
      const k=dKey(vDate),g=S.sessions[k].gym, old=g.exList.map(e=>e.n);
      const index=old.length-1; g.exercises[index].sets[0]=set(37,9);
      setIntensity('full'); const next=S.sessions[k].gym;
      const owners=next.exList.filter((e,i)=>next.exercises[i]?.sets.some(s=>s.done&&s.weight==='37')).map(e=>e.n);
      check(owners.length===1&&owners[0]===old[index],JSON.stringify({old:old[index],owners}));
    });
    test('all 144 generated configurations render valid, unique exercises', () => {
      for(const focus of Object.keys(FOCUS_META)) for(const split of Object.keys(WTPL).filter(s=>!WTPL[s].home)) for(const intensity of ['quick','standard','full']) {
        reset(); S.weekFocus=focus; const k=dKey(vDate); S.dayConfig[k].split=split;
        S.sessions[k]={gym:{intensity,exercises:{},cardio:{}}}; buildTodayWorkout();
        const g=S.sessions[k].gym,names=g.exList.map(e=>e.n);
        check(names.length===new Set(names).size,`${focus}/${split}/${intensity}: duplicate`);
        for(const [i,e] of g.exList.entries()) {
          check(isExerciseAvailable(e.n,getActiveGym().equipment),`unavailable: ${e.n}`);
          check(e.sets>=3,`set floor: ${e.n}`);
          for(const s of g.exercises[i].sets) if(Number(s.weight)>0) check(isLoadableWeight(e.n,Number(s.weight)),`unloadable: ${e.n} ${s.weight}`);
        }
      }
    });
    test('all 144 configurations also work without equipment or with only dumbbells', () => {
      for(const equipment of [[], ['Dumbbells (5-75 lbs)']])
      for(const focus of Object.keys(FOCUS_META)) for(const split of Object.keys(WTPL).filter(s=>!WTPL[s].home)) for(const intensity of ['quick','standard','full']) {
        reset(); getActiveGym().equipment=equipment; S.weekFocus=focus;
        const k=dKey(vDate);S.dayConfig[k].split=split;S.sessions[k]={gym:{intensity,exercises:{},cardio:{}}};buildTodayWorkout();
        const g=S.sessions[k].gym;
        check(g.exList.every(e=>isExerciseAvailable(e.n,equipment)),`${equipment}/${focus}/${split}: unavailable`);
        check(!document.querySelector('#wContent .cardio-block'), 'unexpected cardio machine');
      }
    });
    test('barbells alone do not provide a bench or squat rack', () => {
      reset();check(!isExerciseAvailable('Bench Press (Barbell)',['Olympic Barbells']),'missing bench/rack');
      check(!isExerciseAvailable('Barbell Back Squat',['Olympic Barbells']),'missing rack');
    });
    test('one cardio machine cannot be duplicated', () => {
      reset();getActiveGym().equipment=['Treadmill'];
      check(getEquipmentSafeCardio({n:'Treadmill (Running)',dur:10},'upper',['Treadmill (Incline Walk)'])===null,'duplicate treadmill');
    });
    test('saving muscle progression matches next workout', () => {
      reset();S.weekFocus='muscle';buildTodayWorkout();const k=dKey(vDate),g=S.sessions[k].gym,name=g.exList[0].n;
      g.exercises[0].sets=g.exercises[0].sets.map(()=>set(100,10));doSaveWorkout(3,'');
      check(!window._lastSummary.progressions.some(p=>p.exercise===name),'10 reps is below ceiling 12');
      g.exercises[0].sets=g.exercises[0].sets.map(()=>set(100,12));doSaveWorkout(3,'');
      const next=window._lastSummary.progressions.find(p=>p.exercise===name);
      vDate=new Date('2026-10-02T12:00:00');check(next&&getProgression(name,9,3,0.95).weight===next.nextW,'next load disagrees');
    });
    test('quick fill and typed reps survive a render', () => {
      reset(); S.weekFocus='general';S.history=[history('2026-09-29',[set(100,12),set(100,12),set(100,12)])];
      buildTodayWorkout();quickFillExercise(0);check(S.sessions[dKey(vDate)].gym.exercises[0].sets[0].weight==='100','quick fill overwritten');
      updateSet(0,0,'reps','11');buildTodayWorkout();check(S.sessions[dKey(vDate)].gym.exercises[0].sets[0].reps==='11','typed reps overwritten');
    });
    test('logged lift cannot be erased by a swap', () => {
      reset();buildTodayWorkout();const k=dKey(vDate),g=S.sessions[k].gym,name=g.exList[0].n;g.exercises[0].sets[0]=set(100,8);
      doSwap(0,'Push-Ups','Chest');check(g.exList[0].n===name&&g.exercises[0].sets[0].done,'logged data erased');
      const before=g.exList[1].n;doSwap(1,'Push-Ups','Chest');check(g.exList[1].n==='Push-Ups','remaining exercise did not swap');
      undoSwap(1);check(g.exList[1].n===before,'undo did not restore');
    });
    test('goals count actual matching lifts, not machine substitutes or estimated maxima', () => {
      reset(); S.history=[history('2026-09-29',[set(400,10)],'Smith Machine Bench Press'),history('2026-09-30',[set(200,10)])];
      check(_gClubTotal()===200,'club credited unlifted weight or Smith bench');
    });
    test('recovery ignores unperformed and future exercises', () => {
      reset(); S.history=[history('2026-09-30',[set(100,10,'wk',false)]),history('2026-10-05',[set(100,10)])];
      check(Object.keys(getRecentMuscles(48)).length===0,'unperformed work counted');
    });
    test('assistance weight cannot be a record or automatically increase', () => {
      reset();const name='Assisted Machine Dip';S.history=[history('2026-09-30',[set(100,12),set(100,12),set(100,12)],name)];recomputePBs();
      check(Object.keys(S.pbs).length===0,'assistance PR');check(getProgression(name,10,3,1).weight===100,'more assistance suggested');
    });
    test('incomplete named programs do not prescribe malformed set strings', () => {
      reset();for(const id of ['sl5x5','starting','gzclp','nsuns']){S.strengthProgram={id};check(getActiveProgramFor('Barbell Back Squat')===null,id);}
      S.strengthProgram={id:'531',week:0,tms:{bench:180}};const p=getActiveProgramFor('Bench Press (Barbell)');
      check(p.setCount===3&&p.perSet.map(s=>s.r).join(',')==='5,5,5+','531 changed');
    });
    test('kg and added-plates entry preserve stored pounds', () => {
      reset();S.profile.weightUnit='kg';buildTodayWorkout();const k=dKey(vDate),name=S.sessions[k].gym.exList[0].n;
      S.weightEntry[name]='added';updateSet(0,0,'weight','20');const w=Number(S.sessions[k].gym.exercises[0].sets[0].weight);
      check(Math.abs(w-(fromDisplayWeight(20)+getBaseWeight(name)))<0.001,'unit/base double conversion');
    });
    test('hybrid has heavier main lifts and moderate-rep accessories', () => {
      reset();S.weekFocus='hybrid';
      check(prescriptionForFocus({n:'Bench Press (Barbell)'},'hybrid').reps===6,'main range');
      check(prescriptionForFocus({n:'Dumbbell Lateral Raises'},'hybrid').reps===10,'accessory range');
      check(exerciseProgressionRule('Dumbbell Lateral Raises').ceil===12,'accessory progression');
      check(prescriptionForFocus({n:'Bench Press (Barbell)'},'hybrid').rest===180,'main rest');
      S.prefs.autoRotateSplits=true;S.dayConfig={};_autoSplitCache={};
      check(['2026-09-28','2026-09-29','2026-10-01','2026-10-02','2026-10-03'].map(autoSplitFor).join(',')==='upper,lower,push,pull,lower','five-day split');
      S.setup.gymDays=[1,3,5];_autoSplitCache={};check(autoSplitFor('2026-09-30')==='fullbody','three-day split');
    });
    test('full-body quick includes knee, hinge, chest and back', () => {
      reset();S.weekFocus='hybrid';const k=dKey(vDate);S.dayConfig[k].split='fullbody';S.sessions[k]={gym:{intensity:'quick',exercises:{},cardio:{}}};buildTodayWorkout();
      const groups=S.sessions[k].gym.exList.map(e=>getMG(e.n));check(['quads','hamstrings','chest','back'].every(g=>groups.includes(g)),groups.join(','));
    });
    test('equipment limits and fractional increments are respected', () => {
      reset();check(snapToLoadable('Dumbbell Shoulder Press',90)===75,'rack max');
      getActiveGym().loading={'Cable Low Row':{min:7.5,step:7.5,max:97.5}};
      check(snapToLoadable('Cable Low Row',52,'up')===52.5,'custom increment');
      check(snapToLoadable('Cable Low Row',150)===97.5,'custom max');
    });
    test('backup validation rejects partial and malformed data before changing state', () => {
      reset();const before=JSON.stringify(S);let rejected=0;
      for(const bad of [{weights:[]},{...S,history:{}},{...S,history:[history('2026-09-30',[set(-1,8)])]},{...S,setup:{gymDays:[9],runDays:[]}}]){
        try{validateBackupState(bad);}catch(e){rejected++;}
      }
      check(rejected===4,'malformed backup accepted');check(JSON.stringify(S)===before,'validator changed active state');validateBackupState(JSON.parse(before));
    });
    test('strength analytics use actual exercise history, not reference aliases', () => {
      reset();S.history=[history('2026-09-28',[set(400,10)],'Chest Press Machine'),history('2026-09-29',[set(100,1)])];
      check(loggedLiftEstimate('bench')===100,'machine or profile contaminated bench');
      S.history=[];check(loggedLiftEstimate('bench')===0,'default profile pre-awarded progress');
    });
    test('rest timer restores from deadline and workout clock from wall time', () => {
      reset();buildTodayWorkout();startTimer(120,true);const deadline=_restEndAt;
      clearInterval(timerInt);timerInt=null;restoreRestTimer();check(_restEndAt===deadline&&timerSecs>0&&timerSecs<=120,'rest restore');
      const k=dKey(vDate);S.sessions[k].gym.wTimer={startedAt:Date.now()-90000,accumMs:0,running:true,active:true};
      syncWorkoutTimerFromState(k);check(_wTimerActive&&Date.now()-_wTimerStart>=89000,'workout restore');
      _stopWorkoutClock(k);clearInterval(timerInt);timerInt=null;localStorage.removeItem('pf_restTimer');
    });
    test('every focus uses its rep, rest, progression and cardio contract', () => {
      const specs={general:[10,75,12,25],power:[4,210,5,15],muscle:[9,150,12,20],tone:[12,75,14,45],endurance:[18,35,20,45],hybrid:[6,180,8,15]};
      for(const [focus,[reps,rest,ceiling,cap]] of Object.entries(specs)){
        reset();S.weekFocus=focus;S.prefs.autoSuperset=true;buildTodayWorkout();
        const g=S.sessions[dKey(vDate)].gym;
        const ex=g.exList.find(e=>e.n==='Bench Press (Barbell)');
        check(ex&&ex.reps===reps&&ex.rest===rest,`${focus}: rendered prescription`);
        check(g._cardioPlan.finisherMin<=cap,`${focus}: excessive cardio`);
        if(['power','hybrid'].includes(focus))check(!Object.keys(g.supersets||{}).length,`${focus}: auto superset`);
        S.history=[history('2026-09-29',[set(100,ceiling),set(100,ceiling),set(100,ceiling)])];
        check(getProgression('Bench Press (Barbell)',reps,3,1).weight>100,`${focus}: ceiling not progressed`);
        const card=buildCardioBlock('finisher',{n:'Treadmill (HIIT)',tgt:'Sprint maximally',dur:20},{},0,'upper');
        check(card.includes(getCardioGuide('finisher')),`${focus}: missing cardio guidance`);
        check(!card.includes('Sprint maximally'),`${focus}: conflicting cardio instructions`);
        if(focus!=='tone')check(!card.includes('Treadmill (HIIT)'),`${focus}: HIIT card`);
      }
    });
    test('a past, unsaved started workout keeps its focus snapshot; the next day adopts the default', () => {
      reset();S.weekFocus='tone';buildTodayWorkout();const k=dKey(vDate),g=S.sessions[k].gym;
      g.exercises[0].sets[0]=set(100,12);g.supersets={0:1};
      const before=JSON.stringify({ex:g.exList,plan:g._cardioPlan,sets:g.exercises});
      setWeeklyFocus('power');
      check(S.weekFocus==='power'&&getWorkoutFocus()==='tone','default/session focus mixed');
      check(JSON.stringify({ex:g.exList,plan:g._cardioPlan,sets:g.exercises})===before,'started prescription changed');
      check(g.supersets[0]===1,'started superset erased');
      check(document.querySelector('#todaySub').textContent.includes('Lose & Tone'),'wrong session label');
      doSaveWorkout(3,'focus switch');check(S.history[0].trainingFocus==='tone','wrong saved focus');
      vDate=new Date('2026-10-02T12:00:00');buildTodayWorkout();check(getWorkoutFocus()==='power','new day did not adopt default');
    });
    test('completed cardio totals agree between Today and saved history', () => {
      reset();buildTodayWorkout();const k=dKey(vDate),g=S.sessions[k].gym;
      g.cardioBlocks={'warmup-0':{name:'Treadmill (Incline Walk)',duration:'',defaultDur:12,done:true},'mid-0':{name:'Bike',duration:'20',done:false},'finisher-0':{name:'Bike',duration:'8',done:true,skipped:true}};
      g.cardio={0:{name:'Bike',duration:'7',done:true}};
      updateStats();check(Number(el('st-cardio').textContent)===19,'live minutes include unperformed cardio');
      doSaveWorkout(3,'cardio regression');check(S.history[0].cardioMins===19,'saved minutes differ');
      check(S.history[0].cardio.length===2&&S.history[0].cardio.every(c=>Number(c.duration)>0),'bad saved cardio records');
    });
    test('manual cardio calories and skipped lifting agree across live and saved totals', () => {
      reset();buildTodayWorkout();const k=dKey(vDate),g=S.sessions[k].gym;
      g.exercises[0].sets[0]=set(100,10);g.exercises[0].skipped=true;
      g.cardioBlocks={0:{name:'Bike',duration:'10',calories:'123',done:true}};g.cardio={};
      updateStats();check(Number(el('st-cal').textContent)===123,'manual calories ignored live');
      check(getWorkoutCalsBurned()===123,'save calorie preview disagrees');
      doSaveWorkout(3,'');check(S.history[0].calories===123&&S.history[0].sets===0,'saved skipped work counted');
    });
    test('run edits preserve manual calories and clear stale pace', () => {
      reset();const k=dKey(vDate);S.dayConfig[k]={type:'run'};cMode='run';buildTodayWorkout();
      updateRun('distance','3');updateRun('duration','30');updateRun('calories','250');
      buildTodayWorkout();updateRun('distance','4');check(Number(S.sessions[k].run.calories)===250,'manual calorie value overwritten');
      updateRun('pace','7:45');updateRun('hr','140');check(S.sessions[k].run.pace==='7:45','manual pace overwritten by heart rate');
      updateRun('distance','');check(S.sessions[k].run.pace==='','stale pace after clearing distance');
      updateRun('distance','3');doSaveWorkout(4,'run');
      check(S.history.length===1&&S.history[0].pace==='10:00'&&S.history[0].calories===250,'run save incorrect');
      updateRun('duration','33');doSaveWorkout(4,'corrected');check(S.history.length===1&&S.history[0].pace==='11:00','duplicate/stale run correction');
      selHistId=S.history[0].id;deleteHist();check(S.history.length===0,'run history deletion failed');
    });
    test('equipment cap holds earned reps instead of promising a zero-load increase', () => {
      reset();S.weekFocus='muscle';const name='Dumbbell Shoulder Press';
      S.history=[history('2026-09-29',[set(75,12),set(75,12),set(75,12)],name)];
      const p=getProgression(name,9,3,1);check(p.weight===75&&p.reps===12&&p.badge==='prev',JSON.stringify(p));
    });
    test('body weight and measurements support metric entry and same-day correction', () => {
      reset();S.profile.weightUnit='kg';buildBodyPage();const today=dKey(new Date());
      el('wInput').value='90';el('bfInput').value='20';logWeight();
      el('wInput').value='91';logWeight();check(S.weights.filter(w=>w.date===today).length===1,'duplicate daily weight');
      check(Math.abs(S.weights.find(w=>w.date===today).w-fromDisplayWeight(91))<0.01,'kg conversion');
      el('mWaist').value='90';logMeasurements();check(Math.abs(S.measurements[0].waist-90/2.54)<0.02,'cm conversion');
      deleteWeight(today);confirmYes();check(!S.weights.some(w=>w.date===today),'body-weight deletion');
    });
    test('food cart and water logging persist and remove entries', () => {
      reset();const today=dKey(new Date());_nutCart=[];
      addToCart({n:'Test meal',cal:300,pro:25,carb:35,fat:7},'lunch');commitCart();
      check(S.nutLog[today].lunch.length===1&&S.nutLog[today].lunch[0].cal===300&&!_nutCart.length,'food log');
      removeFood(today,'lunch',0);check(!S.nutLog[today].lunch.length,'food removal');
      _bevPickerMl=500;_bevPickerType='water';confirmBeverage();check(S.nutLog[today].water===500,'water log');
      removeWaterEntry(today,0);check(S.nutLog[today].water===0,'water removal');
      check(JSON.parse(localStorage.getItem(SK)).nutLog[today].water===0,'water not persisted');
    });
    test('recovery, check-in, goals and supplement toggles persist', () => {
      reset();const k=dKey(new Date());setRecovery(k,'energy',4);check(S.recovery[k].energy===4,'recovery');
      ciMood=4;ciSleep='good';el('checkinWeight').value='210';saveCheckin();check(S.checkins.length===1&&S.checkins[0].mood===4,'check-in');
      el('goalEditBench').value='245';el('goalEditGymFreq').value='4';saveGoalEdits();check(S.goals.bench===245&&S.goals.gymPerWeek===4,'goals');
      toggleSuppToday('creatine');check(isSuppTakenToday('creatine'),'supplement not marked');
      toggleSuppToday('creatine');check(!isSuppTakenToday('creatine'),'supplement not cleared');
    });
    test('rich workout template retains exercise identity and prefilled loads', () => {
      reset();buildTodayWorkout();const k=dKey(vDate),g=S.sessions[k].gym;
      g.exercises[0].sets[0]=set(100,9);const cap=_captureRichTemplate(k);
      S.workoutTemplates=[{id:1,name:'Regression',v:2,...cap}];
      vDate=new Date('2026-10-02T12:00:00');S.dayConfig[dKey(vDate)]={type:'gym',split:'upper'};
      applyWorkoutTemplate(1);const restored=S.sessions[dKey(vDate)].gym;
      check(restored.exList[0].n===cap.exercises[0].n,'template exercise changed');
      check(String(restored.exercises[0].sets[0].weight)==='100'&&!restored.exercises[0].sets[0].done,'load or completion changed');
    });
    test('failed storage write does not announce a saved workout', () => {
      reset();buildTodayWorkout();saveS();const stored=localStorage.getItem(SK),k=dKey(vDate);
      S.sessions[k].gym.exercises[0].sets[0]=set(100,8);
      const original=Storage.prototype.setItem,summary=showWorkoutSummary;let announced=0;
      try{
        Storage.prototype.setItem=function(key,value){if(key===SK)throw new DOMException('Test quota','QuotaExceededError');return original.call(this,key,value);};
        showWorkoutSummary=()=>{announced++;};doSaveWorkout(3,'quota test');
        check(announced===0,'false success summary');check(localStorage.getItem(SK)===stored,'failed write changed persisted state');
      }finally{Storage.prototype.setItem=original;showWorkoutSummary=summary;}
    });
    test('gym-specific history does not transfer another machine stack load', () => {
      reset();const name='Chest Press Machine';
      S.history=[{...history('2026-09-28',[set(80,10)],name),gymId:S.activeGymId},{...history('2026-09-30',[set(180,10)],name),gymId:'other-gym'}];
      check(getLastExSession(name).weight===80,'other gym prescribed the load');
    });
    // ── Live workouts follow the plan (today or later, not yet saved) ──────────
    const liveDay = () => { const d=new Date(); d.setDate(d.getDate()+3); d.setHours(12,0,0,0); return d; };
    const liveReset = (split='upper') => {
      reset(); vDate=liveDay(); const k=dKey(vDate); S.dayConfig={}; S.dayConfig[k]={type:'gym',split}; S.history=[]; S.sessions={};
      showToast=()=>{}; showConfirm=(m,yes)=>yes(); return k;
    };
    const names = g => (g.exList||[]).map(e=>e.n);
    test('plan-page split change re-plans a started workout and keeps logged sets', () => {
      const k=liveReset('upper'); buildTodayWorkout(); const g=S.sessions[k].gym; const first=g.exList[0].n;
      g.exercises[0].sets[0]=set(100,10); g.wTimer={startedAt:Date.now(),accumMs:0,running:true,active:true}; saveS();
      openDayModal(k); setSplit('lower'); saveDayConfig();
      const n=S.sessions[k].gym; check(getEffTpl(k)==='lower','split did not change');
      check(names(n).some(x=>/squat|leg press|lunge/i.test(x)),'no lower-body work: '+names(n));
      const i=names(n).indexOf(first); check(i>=0&&n.exercises[i].sets.some(s=>s.done&&s.weight==='100'),'logged set lost');
      check(n.exList[i].carried,'kept exercise not marked as done from the earlier plan');
    });
    test('switching the split on Today any number of times shifts the week once and can switch back', () => {
      const k=liveReset('upper'); buildTodayWorkout(); const later=[];
      for(let i=1;i<=7;i++){const d=new Date(vDate);d.setDate(d.getDate()+i);later.push(dKey(d));}
      const week=()=>later.map(dk=>getDayType(dk)==='rest'?'-':getEffTpl(dk)).join(',');
      const original=week();
      confirmSplitSwitch('lower'); const once=week();
      confirmSplitSwitch('push'); check(week()===once,'second switch shifted the week again: '+once+' → '+week());
      confirmSplitSwitch('pull'); check(week()===once,'third switch shifted the week again');
      confirmSplitSwitch('upper'); check(week()===original,'switching back did not restore the week: '+original+' vs '+week());
      check(getEffTpl(k)==='upper','today not back on the planned split');
    });
    test('a split switch mid-workout is allowed and keeps logged sets', () => {
      const k=liveReset('upper'); buildTodayWorkout(); const g=S.sessions[k].gym; const first=g.exList[0].n; g.exercises[0].sets[0]=set(95,8); saveS();
      buildTodayWorkout(); check(el('swapWorkoutBanner').style.display!=='none','switcher hidden after logging');
      confirmSplitSwitch('lower'); confirmSplitSwitch('push');
      const n=S.sessions[k].gym, i=names(n).indexOf(first);
      check(getEffTpl(k)==='push','not on push'); check(i>=0&&n.exercises[i].sets.some(s=>s.done&&s.weight==='95'),'logged set lost');
    });
    test('focus changes back and forth on a live workout match a fresh build every time', () => {
      const fresh={};
      for(const f of ['tone','power','muscle','endurance','general','hybrid']){ const k=liveReset('upper'); S.weekFocus=f; buildTodayWorkout(); fresh[f]=JSON.stringify(S.sessions[k].gym.exList); }
      const k=liveReset('upper'); S.weekFocus='tone'; buildTodayWorkout();
      for(const f of ['power','tone','muscle','power','endurance','tone','hybrid','general']){
        setWeeklyFocus(f); const g=S.sessions[k].gym;
        check(JSON.stringify(g.exList)===fresh[f],f+': list differs from a fresh '+f+' build');
        g.exList.forEach((e,i)=>{ const work=(g.exercises[i].sets||[]).filter(s=>!s.spec&&(s.type||'wk')==='wk'); check(work.length>=e.sets&&e.sets>=3,f+': '+e.n+' has '+work.length+' work sets'); });
        check(document.querySelector('#todaySub').textContent.includes(FOCUS_META[f].lb),f+': Today label not updated');
      }
    });
    test('focus change mid-workout re-plans and keeps logged work', () => {
      const k=liveReset('upper'); S.weekFocus='tone'; buildTodayWorkout(); const g=S.sessions[k].gym; const first=g.exList[0].n; g.exercises[0].sets[0]=set(155,12); saveS();
      setWeeklyFocus('power'); const n=S.sessions[k].gym, i=names(n).indexOf(first);
      check(getWorkoutFocus(k)==='power','focus not applied mid-workout');
      check(i>=0&&n.exercises[i].sets[0].done&&n.exercises[i].sets[0].weight==='155','logged set changed');
      check(n.exercises[i].sets.filter(s=>!s.done&&!s.spec).every(s=>Number(s.reps)<=5),'remaining sets not re-prescribed for strength');
      doSaveWorkout(3,'mid-workout focus'); check(S.history[0].trainingFocus==='power','saved with stale focus');
    });
    test('intensity change mid-workout re-plans instead of refusing', () => {
      const k=liveReset('upper'); buildTodayWorkout(); const g=S.sessions[k].gym; g.exercises[0].sets[0]=set(100,10); saveS();
      setIntensity('quick'); check(S.sessions[k].gym.intensity==='quick','intensity refused');
      check(S.sessions[k].gym.exercises[0].sets[0].done,'logged set lost');
    });
    test('end without saving clears the workout and records nothing', () => {
      const k=liveReset('upper'); buildTodayWorkout(); startWorkoutTimer(); S.sessions[k].gym.exercises[0].sets[0]=set(100,10); saveS();
      discardWorkout(); const g=S.sessions[k].gym;
      check(S.history.length===0,'history written'); check(!_wTimerActive,'clock still running');
      check(!Object.values(g.exercises||{}).some(e=>(e.sets||[]).some(s=>s.done)),'logged sets kept');
    });
    test('each focus gets its own specialty sets as extras; the switch is separate from supersets', () => {
      const want={power:'cl',hybrid:'cl',muscle:'ds',tone:'ds',endurance:'rp',general:'ds'};
      for(const f of Object.keys(want)){
        const k=liveReset(f==='general'?'upper':'push'); _advSuggestEnabled=true; S.weekFocus=f; buildTodayWorkout(); const g=S.sessions[k].gym;
        const specs=[]; g.exList.forEach((e,i)=>(g.exercises[i].sets||[]).forEach(s=>{ if(s.spec) specs.push({n:e.n,t:s.type,i}); }));
        check(specs.some(x=>x.t===want[f]),f+': no '+want[f]+' set ('+JSON.stringify(specs)+')');
        for(const x of specs){ const work=g.exercises[x.i].sets.filter(s=>!s.spec&&(s.type||'wk')==='wk').length; check(work>=g.exList[x.i].sets,f+': specialty replaced a work set on '+x.n); }
        if(f==='power') check(!specs.some(x=>x.t==='ds'||x.t==='fl'),'strength got drops/failure');
      }
      const k=liveReset('push'); _advSuggestEnabled=true; S.weekFocus='tone'; S.prefs.autoSuperset=true; buildTodayWorkout();
      toggleAdvSuggest(); let g=S.sessions[k].gym; check(!Object.values(g.exercises).some(e=>e.sets.some(s=>s.spec)),'specialty sets not removed when off');
      check(S.prefs.autoSuperset===true,'specialty switch changed supersets');
      toggleAdvSuggest(); g=S.sessions[k].gym; check(Object.values(g.exercises).some(e=>e.sets.some(s=>s.spec)),'specialty sets not restored');
      _advSuggestEnabled=false;
    });
    test('specialty sets never count toward records or progression', () => {
      reset(); S.history=[history('2026-09-29',[set(100,10),set(100,10),set(100,10),{...set(300,12,'cl'),spec:true},{...set(80,10,'ds'),spec:true}])]; recomputePBs();
      check(!Object.values(S.pbs).some(p=>Number(p.weight)>100),'specialty set became a record');
      const last=getLastExSession('Bench Press (Barbell)'); check(last&&last.weight===100,'specialty set drove progression');
    });
    test('profile starting loads follow the rep target for every focus', () => {
      const e1=est1RM(S.strength.bench||185,7);
      for(const f of Object.keys(FOCUS_META)){
        const k=liveReset('push'); S.weekFocus=f; buildTodayWorkout(); const g=S.sessions[k].gym, i=names(g).indexOf('Bench Press (Barbell)'); if(i<0) continue;
        const w=Number(g.exercises[i].sets[0].weight), r=Number(g.exList[i].reps);
        check(w<=e1/(1+r/30)+5,f+': '+w+' lb x '+r+' exceeds an estimated '+r+'-rep max');
      }
    });
    test('exercises are organised into calisthenics / free weights / plate-loaded / pin machines', () => {
      const cases={'Push-Ups':'calisthenics','Pull-Ups':'calisthenics','TRX Row':'calisthenics','Stability Ball Crunch':'calisthenics',
        'Bench Press (Barbell)':'freeweight','Dumbbell Bicep Curls':'freeweight','EZ Bar Curl':'freeweight','Kettlebell Swing':'freeweight','Landmine Press':'freeweight',
        'Plate-Loaded Leg Press':'plate','Smith Machine Squat':'plate','Hack Squat Machine':'plate','ISO-Lateral Chest Press':'plate',
        'Chest Press Machine':'pin','Lat Pull-Down Machine':'pin','Cable Tricep Push-Down':'pin','Assisted Chin-Up (Underhand)':'pin','Leg Extension Machine':'pin',
        'Band Chest Fly':'bands','Treadmill (Running)':'cardio'};
      for(const [n,c] of Object.entries(cases)) check(exerciseCategory(n)===c,n+' → '+exerciseCategory(n)+' (want '+c+')');
      for(const n of ['Wide Push-Up','Decline Push-Up','TRX Atomic Push-Up','Stability Ball Pike']) check(getExType(n)==='bodyweight',n+' given a weight model');
      for(const g of Object.keys(ELIB)) for(const e of ELIB[g]) check(EX_CATEGORIES.some(c=>c.id===exerciseCategory(e.n)),'unclassified '+e.n);
    });
    test('library-added exercises stay through re-plans', () => {
      const k=liveReset('upper'); buildTodayWorkout(); const pick=allLibraryExercises().find(e=>e.cat==='calisthenics'&&isExerciseAvailable(e.n,getActiveGym().equipment)&&!names(S.sessions[k].gym).includes(e.n));
      addExerciseToToday(pick.n); check(names(S.sessions[k].gym).includes(pick.n),'not added');
      setWeeklyFocus('muscle'); check(names(S.sessions[k].gym).includes(pick.n),'lost on focus change');
      confirmSplitSwitch('lower'); check(names(S.sessions[k].gym).includes(pick.n),'lost on split change');
    });
    // ── Home workout ────────────────────────────────────────────────────────────
    const homeReset = (split) => { const k=liveReset('push'); switchPage('today'); cMode='gym'; buildTodayWorkout(); if(split){S.homeConfig={};S.homeConfig[k]={split};} switchMode('home'); return k; };
    test('home workout is a separate session that never touches the gym workout', () => {
      const k=homeReset(); cMode='gym'; buildTodayWorkout(); const gymBefore=JSON.stringify(S.sessions[k].gym.exList); switchMode('home');
      const h=S.sessions[k].home; check(h&&h.exList&&h.exList.length>=4,'no home workout'); check(h!==S.sessions[k].gym,'shared session');
      h.exercises[0].sets[0]={...h.exercises[0].sets[0],reps:'10',done:true}; saveS(); doSaveWorkout(4,'home');
      check(S.history.length===1&&S.history[0].type==='home','not saved as home');
      switchMode('gym'); check(JSON.stringify(S.sessions[k].gym.exList)===gymBefore,'gym workout changed'); check(!isSessionComplete(k,'gym'),'gym marked saved');
      cMode='gym';
    });
    test('home rotation avoids the muscles trained at the gym that day', () => {
      const k=liveReset('push'); check(homeSplitFor(k)!=='hpush','home push on a gym push day');
      S.dayConfig[k].split='lower'; check(homeSplitFor(k)!=='hlegs','home legs on a gym leg day');
    });
    test('every home split x focus builds a valid workout from home equipment only', () => {
      for(const sp of HOME_SPLITS) for(const f of Object.keys(FOCUS_META)) for(const it of ['quick','standard']){
        const k=homeReset(sp); S.weekFocus=f; S.sessions[k].home={exercises:{},cardio:{},cardioBlocks:{},intensity:it}; buildTodayWorkout();
        const h=S.sessions[k].home, eq=getHomeEquipment(); check(h.exList.length>=3,sp+'/'+f+': '+h.exList.length+' exercises');
        check(new Set(names(h)).size===h.exList.length,sp+'/'+f+': duplicate');
        h.exList.forEach((e,i)=>{ check(isExerciseAvailable(e.n,eq),sp+': '+e.n+' not at home'); check(e.sets>=3,'set floor '+e.n);
          for(const s of h.exercises[i].sets) if(Number(s.weight)>0) check(isLoadableWeight(e.n,Number(s.weight)),sp+'/'+f+': unloadable '+e.n+' '+s.weight); });
        if(it==='quick'){ const est=Number(el('intEstLine').getAttribute('data-est-mid')); check(est>=28&&est<=50,sp+'/'+f+': '+est+' min'); }
      }
      cMode='gym';
    });
    test('home loads are real: GMWD bumper combos, one 20 lb kettlebell, doorframe bar limits', () => {
      homeReset('hpush'); const perArm=gmwdPerArmLoads();
      check(JSON.stringify(perArm)===JSON.stringify([10,15,25,35,40,45,50,55,60,70,75,80,85,90,95,105,115,120,130]),'per-arm loads '+perArm);
      check(!isLoadableWeight('GMWD Chest Press (Flat)',40)&&isLoadableWeight('GMWD Chest Press (Flat)',50),'two-arm totals wrong');
      check(snapToLoadable('Kettlebell Goblet Squat',45)===20,'kettlebell not fixed at 20');
      const eq=getHomeEquipment(); check(isExerciseAvailable('Pull-Ups',eq)&&isExerciseAvailable('Dead Hang',eq),'doorframe bar unusable');
      check(!isExerciseAvailable('Muscle-Up',eq),'muscle-ups allowed on a doorframe bar');
      check(isLevelExercise('Twister Chest Squeeze')&&getExType('Twister Chest Squeeze')==='bodyweight','twister given a pound load');
      cMode='gym';
    });
    test('home swaps are kept apart from the gym workout', () => {
      const k=homeReset('hpush'); doSwap(1,'Diamond Push-Up','Triceps');
      check(S.swaps['home:'+k+':1'],'home swap not stored'); check(!S.swaps[k+':1'],'home swap leaked to gym');
      cMode='gym';
    });
    reset(); saveS();
    return results;
  });
  for (const id of ['home','today','plan','equipment','marathon','body','nutrition','goals','progress','history']) {
    await page.evaluate(id=>{document.querySelectorAll('.mo').forEach(m=>m.classList.remove('show'));switchPage(id);},id);
    await page.waitForTimeout(120);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    results.push({name:`phone page ${id}`,pass:!overflow,error:overflow?'horizontal overflow':undefined});
  }
  const modalResults=await page.evaluate(()=>{
    const results=[];
    for(const m of document.querySelectorAll('.mo')){
      m.classList.add('show');const box=m.querySelector('.modal')||m.firstElementChild;
      const overflow=box&&box.scrollWidth>box.clientWidth+2;
      results.push({name:`modal ${m.id}`,pass:!overflow,error:overflow?`${box.scrollWidth} > ${box.clientWidth}`:undefined});m.classList.remove('show');
    }
    return results;
  });
  results.push(...modalResults);
  await page.evaluate(()=>{switchPage('today');document.querySelectorAll('.mo').forEach(m=>m.classList.remove('show'));});
  await page.screenshot({path:path.join(output,'phone.png'),fullPage:true});
  await page.evaluate(()=>{document.querySelector('#wContent details').open=true;document.querySelector('#wContent details').scrollIntoView();});
  await page.screenshot({path:path.join(output,'guidance.png')});
  // Persist a real save, reload, then restore via the actual JSON-file import UI.
  const savedState=await page.evaluate(()=>{
    const k=dKey(vDate);S.sessions[k].gym.exercises[0].sets[0]={weight:'100',reps:'8',type:'wk',done:true};
    doSaveWorkout(3,'backup regression');
    S.nutLog[k]={lunch:[{n:'Backup meal',cal:300,pro:25,carb:35,fat:7}],water:500};
    saveS();return JSON.stringify(S);
  });
  await page.reload();await page.waitForTimeout(2300);
  results.push({name:'reload retains selected goal',pass:await page.evaluate(()=>S.weekFocus==='tone')});
  await page.evaluate(()=>{S.history=[];S.nutLog={};saveS();});
  const chooserPromise=page.waitForEvent('filechooser');await page.evaluate(()=>importData());
  const chooser=await chooserPromise;await chooser.setFiles({name:'test-backup.json',mimeType:'application/json',buffer:Buffer.from(savedState)});
  await page.waitForSelector('#confirmModal.show');
  await page.locator('#confirmModal button').filter({hasText:/confirm|yes|restore/i}).last().click();
  await page.waitForTimeout(200);
  results.push({name:'backup restored through real file picker',pass:await page.evaluate(()=>S.weekFocus==='tone'&&S.history.length===1&&S.history[0].notes==='backup regression'&&S.history[0].exercises[0].sets[0].weight==='100'&&Object.values(S.nutLog).some(d=>d&&d.lunch&&d.lunch[0]&&d.lunch[0].n==='Backup meal'))});
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.context().setOffline(true);await page.reload();
  await page.waitForFunction(()=>typeof S!=='undefined'&&S.weekFocus==='tone');
  results.push({name:'offline service worker reload retains workout state',pass:true});
  await page.context().setOffline(false);
  if(!process.env.APP_URL){
    for(const [route,status] of [['/.git/config',404],['/ANTHROPIC_KEY_LOCAL.txt',404],['/%ZZ',400]]){
      const response=await fetch('http://localhost:18753'+route);
      results.push({name:`development server rejects ${route}`,pass:response.status===status});
    }
  }
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({results,errors},null,2));
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name}${r.error ? ': '+r.error : ''}`);
  console.log('Browser errors:', JSON.stringify(errors));
  assert.equal(results.filter(r=>!r.pass).length + errors.length, 0, 'verification failures');
})().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.kill();});
