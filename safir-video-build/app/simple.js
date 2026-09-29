const $=s=>document.querySelector(s);
let videoPath=null,resultPath=null;

function showError(msg){
  const e=$('#error');e.textContent=msg;e.classList.remove('hidden');
}
function clearError(){$('#error').classList.add('hidden')}
function setProgress(p,t){
  $('#progressWrap').classList.remove('hidden');
  $('#progressBar').style.width=Math.max(0,Math.min(100,p))+'%';
  $('#progressPercent').textContent=Math.round(p)+'%';
  $('#progressText').textContent=t||'جاري التجهيز...';
}
window.safir.onProgress(x=>setProgress(x.progress||0,x.text||''));

function fileUrl(p){return 'file:///'+String(p).replace(/\\/g,'/')}
function loadVideo(p){
  clearError();videoPath=p;resultPath=null;
  $('#dropZone').classList.add('hidden');
  $('#work').classList.remove('hidden');
  $('#done').classList.add('hidden');
  $('#preview').src=fileUrl(p);
  $('#fileName').textContent=p.split(/[\\/]/).pop();
  $('#processBtn').disabled=false;
  $('#progressWrap').classList.add('hidden');
}
async function chooseVideo(){
  try{
    const p=await window.safir.pickVideo();
    if(p)loadVideo(p);
  }catch(e){showError('تعذر فتح الفيديو: '+e.message)}
}
$('#pickVideo').onclick=chooseVideo;
const dz=$('#dropZone');
dz.ondragover=e=>{e.preventDefault();dz.classList.add('drag')};
dz.ondragleave=()=>dz.classList.remove('drag');
dz.ondrop=e=>{
  e.preventDefault();dz.classList.remove('drag');
  const f=e.dataTransfer.files?.[0];if(!f)return;
  const p=window.safir.getFilePath?.(f);if(p)loadVideo(p);
};

$('#processBtn').onclick=async()=>{
  if(!videoPath)return;
  clearError();$('#processBtn').disabled=true;
  try{
    const r=await window.safir.simpleProcess({video:videoPath});
    resultPath=r.output;
    setProgress(100,'تم تجهيز الفيديو');
    $('#doneText').textContent='تم الحفظ تلقائيًا بجوار الفيديو الأصلي: '+r.output.split(/[\\/]/).pop();
    $('#done').classList.remove('hidden');
  }catch(e){
    showError(e.message||String(e));
  }finally{
    $('#processBtn').disabled=false;
  }
};
$('#openFolder').onclick=()=>resultPath&&window.safir.revealFile(resultPath);
$('#newVideo').onclick=()=>{
  videoPath=null;resultPath=null;$('#preview').pause();$('#preview').removeAttribute('src');$('#preview').load();
  $('#work').classList.add('hidden');$('#done').classList.add('hidden');$('#dropZone').classList.remove('hidden');clearError();
};