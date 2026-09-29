const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let state={video:null,brollFolder:null,analysis:null,mode:'auto',format:'9:16',hookId:null,rejectedSegments:[],logo:null};
const modeHelp={auto:'البرنامج يقرر وينفّذ، وإنت تراجع النتيجة.',assistant:'البرنامج يقترح الحذف والـHook وإنت توافق.',manual:'تعدّل من النص والأوامر بدون Timeline.'};

function toast(t){const x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2600)}
function sec(x){x=Math.max(0,Number(x||0));const m=Math.floor(x/60),s=Math.round(x%60);return `${m}:${String(s).padStart(2,'0')}`}
function setProgress(p,t){$('#progressWrap').classList.remove('hidden');$('#progressBar').style.width=`${Math.max(0,Math.min(100,p))}%`;$('#progressPercent').textContent=`${Math.round(p)}%`;$('#progressText').textContent=t||'';if(p>=100)setTimeout(()=>$('#progressWrap').classList.add('hidden'),1300)}
window.safir.onProgress(x=>setProgress(x.progress||0,x.text||''));

$$('.nav').forEach(b=>b.onclick=()=>{$$('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.view').forEach(x=>x.classList.remove('active'));$(`#${b.dataset.view}View`).classList.add('active')});
$$('#modeSelector button').forEach(b=>b.onclick=()=>{$$('#modeSelector button').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.mode=b.dataset.mode;$('#modeHelp').textContent=modeHelp[state.mode]});
$$('.format').forEach(b=>b.onclick=()=>{$$('.format').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.format=b.dataset.format});

async function chooseVideo(){const p=await window.safir.pickVideo();if(p)loadVideo(p)}
$('#pickVideo').onclick=chooseVideo;
const dz=$('#dropZone');
dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag')});
dz.addEventListener('dragleave',()=>dz.classList.remove('drag'));
dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('drag');const f=e.dataTransfer.files?.[0];if(f)loadVideo(f.path)});

function loadVideo(p){
  state.video=p;state.analysis=null;state.rejectedSegments=[];state.hookId=null;
  $('#dropZone').classList.add('hidden');$('#videoWrap').classList.remove('hidden');
  $('#preview').src=`file:///${p.replace(/\\/g,'/')}`;
  $('#videoName').textContent=p.split(/[\\/]/).pop();$('#videoMeta').textContent='جاهز للتحليل';
  $('#analyzeBtn').disabled=false;$('#exportBtn').disabled=true;$('#results').classList.add('hidden');
  toast('تم تحميل الفيديو الخام');
}

function currentSettings(){return {
  format:state.format,
  removeSilence:$('#removeSilence').checked,
  removeSemantic:$('#removeSemantic').checked,
  autoZoom:$('#autoZoom').checked,
  cleanAudio:$('#cleanAudio').checked,
  captions:$('#captions').checked,
  quality:$('#quality').value,
  moveHookToStart:$('#moveHook').checked,
  hookId:state.hookId,
  rejectedSegments:state.rejectedSegments,
  logo:state.logo,
  fontName:$('#fontName').value,
  captionSize:Number($('#captionSize').value)
}}

async function analyze(){
  if(!state.video)return;
  $('#analyzeBtn').disabled=true;
  try{
    state.analysis=await window.safir.analyzeVideo({video:state.video,brollFolder:state.brollFolder,useAI:true});
    renderAnalysis();$('#results').classList.remove('hidden');$('#exportBtn').disabled=false;$('#exportBtn2').disabled=false;
    window.dispatchEvent(new CustomEvent('safir-analysis-ready',{detail:{analysis:state.analysis,video:state.video,settings:currentSettings()}}));
    toast(state.analysis.aiAvailable?'التحليل الذكي اكتمل':'التحليل الأساسي اكتمل');
  }catch(e){toast('خطأ: '+e.message)}
  finally{$('#analyzeBtn').disabled=false}
}
$('#analyzeBtn').onclick=analyze;

function renderAnalysis(){
  const a=state.analysis;if(!a)return;
  $('#videoMeta').textContent=`${a.meta.width}×${a.meta.height} · ${sec(a.meta.duration)}`;
  $('#mOriginal').textContent=sec(a.summary.original);
  $('#mFinal').textContent=sec(a.summary.estimated);
  $('#mRemoved').textContent=sec(a.summary.removed);
  $('#mDecisions').textContent=String(a.removals.length+(a.segments?.length||0));

  const hooks=$('#hooks');hooks.innerHTML='';
  if(!a.hooks.length){hooks.className='hook-list empty-state';hooks.textContent=a.aiReason||'لا يوجد تحليل كلام متاح حاليًا';}
  else{
    hooks.className='hook-list';
    a.hooks.forEach((h,i)=>{
      if(state.hookId==null&&i===0)state.hookId=h.id;
      const d=document.createElement('div');d.className='hook-card'+(String(state.hookId)===String(h.id)?' active':'');
      d.innerHTML=`<span class="hook-rank">${i+1}</span><p>${escapeHtml(h.text)}</p><small>${Math.round((h.score||0)*100)}%</small>`;
      d.onclick=()=>{state.hookId=h.id;renderAnalysis()};hooks.appendChild(d);
    });
  }

  const dec=$('#decisions');dec.innerHTML='';
  a.removals.slice(0,30).forEach(r=>{
    const d=document.createElement('div');d.className='decision';
    d.innerHTML=`<span class="kind">${r.kind==='silence'?'سكوت':'AI'}</span><p>${escapeHtml(r.reason)}</p><small>${sec(r.start)} → ${sec(r.end)}</small>`;
    dec.appendChild(d);
  });
  if(!a.removals.length)dec.innerHTML='<div class="empty-state">مفيش حذف إجباري. الفيديو نظيف.</div>';

  const tr=$('#transcript');tr.innerHTML='';
  if(!a.segments.length){tr.innerHTML=`<div class="empty-state">${escapeHtml(a.aiReason||'تحليل الكلام غير متاح في الوضع الأساسي.')}</div>`;}
  else a.segments.forEach(s=>{
    const d=document.createElement('button');
    d.className='segment'+((s.importance||0)>=.62?' important':'')+(state.rejectedSegments.includes(s.id)?' rejected':'');
    d.textContent=s.text;d.title=`${sec(s.start)} — اضغط لحذف/استرجاع الجملة`;
    d.onclick=()=>{const ix=state.rejectedSegments.indexOf(s.id);if(ix>=0)state.rejectedSegments.splice(ix,1);else state.rejectedSegments.push(s.id);renderAnalysis()};
    tr.appendChild(d);
  });
  renderBroll();
}

function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function renderBroll(){
  const el=$('#brollList'),arr=state.analysis?.broll||[];
  if(!arr.length){el.className='broll-list empty-state';el.textContent=state.brollFolder?'لا توجد أسماء ملفات مطابقة للكلام الحالي.':'اختر مكتبة B‑roll ليقترح اللقطات.';return}
  el.className='broll-list';el.innerHTML='';
  arr.forEach(x=>{
    const d=document.createElement('div');d.className='broll-item';
    d.innerHTML=`<div><b>${escapeHtml(x.name)}</b><small>${escapeHtml(x.matched.join('، '))}</small></div><span class="pill">${x.score}</span>`;
    el.appendChild(d);
  });
}

async function exportMain(){
  if(!state.analysis)return;
  const out=await window.safir.pickExport('فيديو سفير النهائي.mp4');if(!out)return;
  $('#exportBtn').disabled=true;$('#exportBtn2').disabled=true;
  try{
    const r=await window.safir.renderVideo({analysis:state.analysis,settings:currentSettings(),output:out});
    toast('تم تصدير الفيديو النهائي');window.safir.revealFile(r.output);
  }catch(e){toast('فشل التصدير: '+e.message)}
  finally{$('#exportBtn').disabled=false;$('#exportBtn2').disabled=false}
}
$('#exportBtn').onclick=exportMain;$('#exportBtn2').onclick=exportMain;

async function setBroll(){
  const p=await window.safir.pickBroll();if(!p)return;
  state.brollFolder=p;$('#libraryPath').textContent=p;toast('تم اختيار مكتبة B‑roll');
  if(state.video)analyze();
}
$('#pickBroll').onclick=setBroll;$('#pickBroll2').onclick=setBroll;

$('#pickLogo').onclick=async()=>{
  const p=await window.safir.pickLogo();
  if(p){state.logo=p;$('#logoPath').value=p;toast('تم حفظ اللوجو للمشروع')}
};
$('#captionSize').oninput=e=>$('#captionSizeValue').textContent=e.target.value;

$('#applyCommand').onclick=()=>{
  const c=$('#command').value.trim();if(!c)return;const applied=[];
  if(/ريل|عمود|9:16/.test(c)){state.format='9:16';applied.push('Reels 9:16')}
  if(/افقي|أفقي|16:9|يوتيوب/.test(c)){state.format='16:9';applied.push('16:9')}
  if(/مربع|1:1/.test(c)){state.format='1:1';applied.push('1:1')}
  if(/شيل.*سكوت|احذف.*سكوت|نظف.*سكوت/.test(c)){$('#removeSilence').checked=true;applied.push('حذف السكوت')}
  if(/من غير.*سكوت|سيب.*سكوت/.test(c)){$('#removeSilence').checked=false;applied.push('الحفاظ على السكوت')}
  if(/شيل.*تكرار|لخبط|غلط/.test(c)){$('#removeSemantic').checked=true;applied.push('تنظيف التكرار')}
  if(/زوم|zoom/i.test(c)){$('#autoZoom').checked=true;applied.push('Auto Zoom')}
  if(/من غير.*زوم/.test(c)){$('#autoZoom').checked=false;applied.push('إلغاء Zoom')}
  if(/كابتشن|ترجمه|ترجمة|subtitle/i.test(c)){$('#captions').checked=!/من غير|شيل/.test(c);applied.push($('#captions').checked?'Captions':'بدون Captions')}
  if(/صوت|ضوضاء|نويز/.test(c)){$('#cleanAudio').checked=true;applied.push('تنظيف الصوت')}
  $$('.format').forEach(b=>b.classList.toggle('active',b.dataset.format===state.format));
  $('#commandResult').textContent=applied.length?'تم: '+applied.join(' · '):'مفيش إعداد مباشر مطابق للأمر ده في النسخة الحالية.';
  toast('تم تطبيق الأمر');
};

$('#createReels').onclick=async()=>{
  if(!state.analysis)return;
  const folder=await window.safir.pickFolder();if(!folder)return;
  try{
    const outs=await window.safir.createReels({analysis:state.analysis,settings:currentSettings(),folder});
    toast(`تم إنشاء ${outs.length} Reels`);if(outs[0])window.safir.revealFile(outs[0]);
  }catch(e){toast('تعذر إنشاء الريلز: '+e.message)}
};

$('#saveProject').onclick=async()=>{
  const timeline=window.safirTimeline?.getState?.()||null;
  const p=await window.safir.saveProject({...state,settings:currentSettings(),timeline});
  if(p)toast('تم حفظ المشروع');
};

$('#openProject').onclick=async()=>{
  const p=await window.safir.openProject();if(!p)return;
  state={...state,...p};
  if(state.video)loadVideo(state.video);
  if(p.settings){
    const s=p.settings;state.format=s.format||'9:16';
    $('#removeSilence').checked=s.removeSilence!==false;$('#removeSemantic').checked=s.removeSemantic!==false;
    $('#autoZoom').checked=s.autoZoom!==false;$('#cleanAudio').checked=s.cleanAudio!==false;
    $('#captions').checked=s.captions!==false;$('#quality').value=s.quality||'balanced';
    $('#fontName').value=s.fontName||'FF Shamel Family';$('#captionSize').value=s.captionSize||74;
    $('#captionSizeValue').textContent=s.captionSize||74;
  }
  if(p.analysis){state.analysis=p.analysis;renderAnalysis();$('#results').classList.remove('hidden');$('#exportBtn').disabled=false;$('#exportBtn2').disabled=false}
  if(p.timeline) setTimeout(()=>window.safirTimeline?.restore?.(p.timeline),0);
  else if(p.analysis) setTimeout(()=>window.dispatchEvent(new CustomEvent('safir-analysis-ready',{detail:{analysis:p.analysis,video:p.video,settings:p.settings||currentSettings()}})),0)
  toast('تم فتح المشروع');
};

window.safirApp={
  getState:()=>state,
  getSettings:()=>currentSettings(),
  toast,
  sec,
  loadVideo,
  renderAnalysis
};