(() => {
  const $=s=>document.querySelector(s);
  const tl={
    analysis:null, video:null, settings:null,
    videoClips:[], broll:[], audio:[],
    selected:null, cursor:0, total:0, seq:1, previewClipId:null
  };
  const id=(p='c')=>p+'_'+Date.now().toString(36)+'_'+(tl.seq++);
  const fmt=x=>window.safirApp?.sec?.(x)||String(Math.round(x*10)/10);
  const toast=t=>window.safirApp?.toast?.(t);

  function merge(items){
    return [...items].sort((a,b)=>a.start-b.start).reduce((out,x)=>{
      const last=out[out.length-1];
      if(last&&x.start<=last.end+.03)last.end=Math.max(last.end,x.end);
      else out.push({...x});
      return out;
    },[]);
  }
  function subtract(start,end,removals){
    let cur=start,out=[];
    for(const r of merge(removals||[])){
      if(r.end<=start||r.start>=end)continue;
      const s=Math.max(start,r.start),e=Math.min(end,r.end);
      if(s>cur+.04)out.push({start:cur,end:s});
      cur=Math.max(cur,e);
    }
    if(cur<end-.04)out.push({start:cur,end});
    return out.filter(x=>x.end-x.start>.06);
  }
  function duration(c){return Math.max(.01,Number(c.end)-Number(c.start))}
  function recalc(){
    let t=0;
    tl.videoClips.forEach((c,i)=>{c.outputStart=t;c.outputEnd=t+duration(c);c.order=i;t=c.outputEnd});
    tl.total=Math.max(.01,t);
    tl.cursor=Math.min(tl.cursor,tl.total);
  }
  function initFromAuto(detail,force=false){
    if(!detail?.analysis)return;
    tl.analysis=detail.analysis;tl.video=detail.video||detail.analysis.video;tl.settings=detail.settings||{};
    if(!force&&tl.videoClips.length&&tl.video===tl.analysis.video){render();return}
    const removals=tl.settings.removeSilence===false?[]:(tl.analysis.removals||[]).filter(r=>r.kind==='silence');
    const kept=subtract(0,tl.analysis.meta.duration,removals);
    tl.videoClips=kept.map((x,i)=>({id:id('v'),source:tl.video,start:x.start,end:x.end,label:`مقطع ${i+1}`,kind:'video'}));
    tl.broll=[];tl.audio=[];tl.selected=tl.videoClips[0]?{type:'video',id:tl.videoClips[0].id}:null;tl.cursor=0;
    recalc();render();showWorkspace();
  }
  function showWorkspace(){
    $('#timelineEmpty')?.classList.add('hidden');
    $('#timelineWorkspace')?.classList.remove('hidden');
    const p=$('#timelinePreview');
    if(p&&tl.video&&!p.src){p.src=fileUrl(tl.video)}
    if($('#timelineExport'))$('#timelineExport').disabled=!tl.videoClips.length;
  }
  function fileUrl(p){return 'file:///'+String(p||'').replace(/\\/g,'/')}
  function selectedObj(){
    if(!tl.selected)return null;
    const arr=tl.selected.type==='video'?tl.videoClips:tl.selected.type==='broll'?tl.broll:tl.audio;
    return arr.find(x=>x.id===tl.selected.id)||null;
  }
  function select(type,clip,seek=true){
    tl.selected=clip?{type,id:clip.id}:null;
    if(type==='video'&&clip&&seek) seekOutput(clip.outputStart||0);
    render();
  }
  function locate(t){
    t=Math.max(0,Math.min(tl.total-.001,t));
    let accum=0;
    for(let i=0;i<tl.videoClips.length;i++){
      const c=tl.videoClips[i],d=duration(c);
      if(t<=accum+d||i===tl.videoClips.length-1)return{clip:c,index:i,outputStart:accum,sourceTime:c.start+(t-accum)};
      accum+=d;
    }
    return null;
  }
  function seekOutput(t,play=false){
    if(!tl.videoClips.length)return;
    tl.cursor=Math.max(0,Math.min(tl.total,Number(t)||0));
    const loc=locate(Math.min(tl.cursor,tl.total-.001));
    if(!loc)return;
    const p=$('#timelinePreview');
    if(p.src!==fileUrl(loc.clip.source))p.src=fileUrl(loc.clip.source);
    tl.previewClipId=loc.clip.id;
    try{p.currentTime=Math.max(loc.clip.start,Math.min(loc.clip.end-.02,loc.sourceTime))}catch(_){}
    if(play)p.play().catch(()=>{});
    updateCursorUI();
  }
  function updateCursorUI(){
    const slider=$('#tlCursor'); if(slider){slider.max=tl.total;slider.value=tl.cursor}
    if($('#tlCursorLabel'))$('#tlCursorLabel').textContent=fmt(tl.cursor);
    if($('#tlTime'))$('#tlTime').textContent=`${fmt(tl.cursor)} / ${fmt(tl.total)}`;
    const ph=$('#tlPlayhead');
    if(ph)ph.style.left=`calc(118px + (100% - 130px) * ${tl.total?tl.cursor/tl.total:0})`;
  }
  function clipHtml(c,type){
    const sel=tl.selected?.type===type&&tl.selected?.id===c.id?' selected':'';
    const d=duration(c);
    const name=(c.label||String(c.source).split(/[\\/]/).pop()||type).replace(/[<>&]/g,'');
    return `<div class="tl-clip ${type}${sel}" data-type="${type}" data-id="${c.id}" draggable="${type==='video'}" title="${name}\n${fmt(d)}"><b>${name}</b><small>${fmt(d)}</small></div>`;
  }
  function renderRuler(){
    const el=$('#tlRuler');if(!el)return;
    const ticks=8;let s='';
    for(let i=0;i<=ticks;i++){const t=tl.total*i/ticks;s+=`<span style="left:${i/ticks*100}%">${fmt(t)}</span>`}
    el.innerHTML=s;
  }
  function render(){
    recalc();showWorkspace();renderRuler();
    const vt=$('#tlVideoTrack');
    if(vt){
      vt.innerHTML=tl.videoClips.map(c=>clipHtml(c,'video')).join('');
      [...vt.querySelectorAll('.tl-clip')].forEach((el,i)=>{
        const c=tl.videoClips[i];el.style.width=`${Math.max(3,duration(c)/tl.total*100)}%`;
        el.onclick=()=>select('video',c);
        el.ondragstart=e=>{e.dataTransfer.setData('text/plain',c.id);el.classList.add('dragging')};
        el.ondragend=()=>el.classList.remove('dragging');
        el.ondragover=e=>e.preventDefault();
        el.ondrop=e=>{e.preventDefault();const from=e.dataTransfer.getData('text/plain');reorderTo(from,c.id)};
      });
    }
    renderAbsoluteTrack($('#tlBrollTrack'),tl.broll,'broll');
    renderAbsoluteTrack($('#tlAudioTrack'),tl.audio,'audio');
    renderInspector();updateCursorUI();
    if($('#timelineExport'))$('#timelineExport').disabled=!tl.videoClips.length;
  }
  function renderAbsoluteTrack(el,arr,type){
    if(!el)return;el.innerHTML='';
    arr.forEach(c=>{
      const wrap=document.createElement('div');
      wrap.innerHTML=clipHtml(c,type);
      const node=wrap.firstChild, start=Math.max(0,c.timelineStart||0), dur=Math.min(duration(c),Math.max(.01,tl.total-start));
      node.style.position='absolute';node.style.left=`${start/tl.total*100}%`;node.style.width=`${Math.max(4,dur/tl.total*100)}%`;
      node.onclick=()=>select(type,c,false);el.appendChild(node);
    });
  }
  function reorderTo(fromId,toId){
    if(fromId===toId)return;
    const a=tl.videoClips.findIndex(x=>x.id===fromId),b=tl.videoClips.findIndex(x=>x.id===toId);
    if(a<0||b<0)return;
    const [m]=tl.videoClips.splice(a,1);tl.videoClips.splice(b,0,m);recalc();render();toast('تم تغيير ترتيب المقاطع');
  }
  function renderInspector(){
    const x=selectedObj(),body=$('#tlInspectorBody'),title=$('#tlInspectorTitle');
    if(!body||!title)return;
    if(!x){title.textContent='اختر مقطعًا';body.className='inspector-body empty-state';body.textContent='اضغط على أي مقطع في التراكات لتعديل تفاصيله.';return}
    body.className='inspector-body';
    const type=tl.selected.type;
    title.textContent=type==='video'?'مقطع الفيديو':type==='broll'?'B‑roll / صورة':'صوت / موسيقى';
    if(type==='video'){
      body.innerHTML=`<div class="inspect-grid"><label>من المصدر<b>${fmt(x.start)}</b></label><label>إلى<b>${fmt(x.end)}</b></label><label>المدة<b>${fmt(duration(x))}</b></label><label>مكانه في الناتج<b>${fmt(x.outputStart)}</b></label></div><p class="inspect-path">${x.source}</p>`;
      return;
    }
    const vol=type==='audio'?Number(x.volume??.45):null;
    body.innerHTML=`
      <div class="inspect-grid editable">
        <label>موضع البداية<input id="insStart" type="number" min="0" max="${tl.total}" step=".1" value="${Number(x.timelineStart||0).toFixed(2)}"></label>
        <label>المدة<input id="insDur" type="number" min=".2" step=".1" value="${duration(x).toFixed(2)}"></label>
        ${type==='audio'?`<label>الصوت %<input id="insVol" type="number" min="0" max="200" step="5" value="${Math.round(vol*100)}"></label>`:''}
        <label>من الملف<b>${fmt(x.start)}</b></label>
      </div>
      <p class="inspect-path">${x.source}</p>
      <button id="insRemove" class="danger">حذف من التراك</button>`;
    $('#insStart').onchange=e=>{x.timelineStart=Math.max(0,Math.min(tl.total-.05,Number(e.target.value)||0));render()};
    $('#insDur').onchange=e=>{const d=Math.max(.2,Number(e.target.value)||.2);x.end=x.start+d;render()};
    if(type==='audio')$('#insVol').onchange=e=>{x.volume=Math.max(0,Math.min(2,Number(e.target.value)/100));render()};
    $('#insRemove').onclick=()=>removeSelected();
  }
  function splitSelected(){
    if(tl.selected?.type!=='video')return toast('اختار مقطع من V1 الأول');
    const idx=tl.videoClips.findIndex(x=>x.id===tl.selected.id);if(idx<0)return;
    const c=tl.videoClips[idx],loc=locate(tl.cursor);
    if(!loc||loc.clip.id!==c.id)return toast('حرك المؤشر داخل المقطع اللي عايز تقسّمه');
    const at=loc.sourceTime;
    if(at-c.start<.12||c.end-at<.12)return toast('اختار نقطة أبعد شوية عن طرف المقطع');
    const a={...c,id:id('v'),end:at,label:c.label+' أ'};
    const b={...c,id:id('v'),start:at,label:c.label+' ب'};
    tl.videoClips.splice(idx,1,a,b);tl.selected={type:'video',id:b.id};recalc();render();toast('تم تقسيم المقطع');
  }
  function removeSelected(){
    if(!tl.selected)return;
    const type=tl.selected.type,arr=type==='video'?tl.videoClips:type==='broll'?tl.broll:tl.audio;
    const ix=arr.findIndex(x=>x.id===tl.selected.id);if(ix<0)return;
    if(type==='video'&&arr.length===1)return toast('لازم يفضل مقطع فيديو واحد على الأقل');
    arr.splice(ix,1);tl.selected=null;recalc();render();toast('تم حذف المقطع');
  }
  function moveMain(dir){
    if(tl.selected?.type!=='video')return toast('اختار مقطع من V1');
    const ix=tl.videoClips.findIndex(x=>x.id===tl.selected.id),nx=ix+dir;
    if(ix<0||nx<0||nx>=tl.videoClips.length)return;
    [tl.videoClips[ix],tl.videoClips[nx]]=[tl.videoClips[nx],tl.videoClips[ix]];
    recalc();render();toast('تم تغيير ترتيب المقطع');
  }
  async function addMedia(type){
    if(!tl.analysis)return toast('حلّل الفيديو الأول');
    const p=await window.safir.pickMedia(type==='audio'?'audio':'media');if(!p)return;
    const meta=await window.safir.probeMedia(p);
    const isImage=/\.(jpg|jpeg|png|webp)$/i.test(p);
    const maxLeft=Math.max(.2,tl.total-tl.cursor);
    const d=isImage?Math.min(5,maxLeft):Math.min(Number(meta.duration||5),Math.min(6,maxLeft));
    const item={id:id(type==='audio'?'a':'b'),source:p,start:0,end:Math.max(.2,d),timelineStart:Math.min(tl.cursor,Math.max(0,tl.total-.2)),label:p.split(/[\\/]/).pop(),kind:type,isImage,volume:type==='audio'?.45:undefined};
    (type==='audio'?tl.audio:tl.broll).push(item);tl.selected={type,id:item.id};render();toast(type==='audio'?'تمت إضافة الصوت':'تمت إضافة B-roll');
  }
  async function exportTimeline(){
    if(!tl.analysis||!tl.videoClips.length)return;
    const out=await window.safir.pickExport('فيديو سفير - تعديل يدوي.mp4');if(!out)return;
    const btn=$('#timelineExport');btn.disabled=true;
    try{
      const settings={...(window.safirApp?.getSettings?.()||{}),manualTimeline:getState()};
      const r=await window.safir.renderVideo({analysis:tl.analysis,settings,output:out});
      toast('تم تصدير تعديلات التراكات');window.safir.revealFile(r.output);
    }catch(e){toast('فشل التصدير: '+e.message)}
    finally{btn.disabled=false}
  }
  function getState(){
    return {
      version:1,video:tl.video,videoClips:tl.videoClips,broll:tl.broll,audio:tl.audio,
      cursor:tl.cursor,selected:tl.selected,total:tl.total
    };
  }
  function restore(saved){
    const app=window.safirApp?.getState?.();
    if(!saved||!app?.analysis)return;
    tl.analysis=app.analysis;tl.video=saved.video||app.video;tl.settings=window.safirApp?.getSettings?.()||{};
    tl.videoClips=(saved.videoClips||[]).map(x=>({...x}));
    tl.broll=(saved.broll||[]).map(x=>({...x}));
    tl.audio=(saved.audio||[]).map(x=>({...x}));
    tl.cursor=Number(saved.cursor||0);tl.selected=saved.selected||null;recalc();showWorkspace();render();seekOutput(tl.cursor);
  }

  window.addEventListener('safir-analysis-ready',e=>initFromAuto(e.detail,true));

  $('#timelineResetAuto').onclick=()=>{
    const app=window.safirApp?.getState?.();
    if(!app?.analysis)return toast('حلّل الفيديو الأول');
    initFromAuto({analysis:app.analysis,video:app.video,settings:window.safirApp.getSettings()},true);toast('تمت إعادة التراكات من نتيجة Auto');
  };
  $('#timelineExport').onclick=exportTimeline;
  $('#tlSplit').onclick=splitSelected;
  $('#tlDelete').onclick=removeSelected;
  $('#tlLeft').onclick=()=>moveMain(-1);
  $('#tlRight').onclick=()=>moveMain(1);
  $('#tlAddBroll').onclick=()=>addMedia('broll');
  $('#tlAddAudio').onclick=()=>addMedia('audio');
  $('#tlCursor').oninput=e=>seekOutput(Number(e.target.value)||0);
  $('#tlPlay').onclick=()=>{
    const p=$('#timelinePreview');if(p.paused)seekOutput(tl.cursor,true);else p.pause();
  };
  $('#tlPrev').onclick=()=>{
    const loc=locate(tl.cursor),i=Math.max(0,(loc?.index||0)-1);seekOutput(tl.videoClips[i]?.outputStart||0);
  };
  $('#tlNext').onclick=()=>{
    const loc=locate(tl.cursor),i=Math.min(tl.videoClips.length-1,(loc?.index||0)+1);seekOutput(tl.videoClips[i]?.outputStart||0);
  };
  $('#timelinePreview').addEventListener('timeupdate',()=>{
    const p=$('#timelinePreview'),c=tl.videoClips.find(x=>x.id===tl.previewClipId);if(!c||p.seeking)return;
    let outStart=0;for(const x of tl.videoClips){if(x.id===c.id)break;outStart+=duration(x)}
    tl.cursor=Math.max(outStart,Math.min(outStart+duration(c),outStart+(p.currentTime-c.start)));
    updateCursorUI();
    if(!p.paused&&p.currentTime>=c.end-.035){
      const ix=tl.videoClips.findIndex(x=>x.id===c.id);
      if(ix<tl.videoClips.length-1){seekOutput(tl.videoClips[ix+1].outputStart,true)}
      else p.pause();
    }
  });

  window.safirTimeline={getState,restore,reset:()=>{const a=window.safirApp?.getState?.();if(a?.analysis)initFromAuto({analysis:a.analysis,video:a.video,settings:window.safirApp.getSettings()},true)}};
})();