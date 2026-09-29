const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

let ffmpegPath = null;
let ffprobePath = null;
try { ffmpegPath = require('ffmpeg-static'); } catch (_) {}
try { ffprobePath = require('ffprobe-static').path; } catch (_) {}

function unpacked(p) { return p && p.replace('app.asar', 'app.asar.unpacked'); }
function bin(name) {
  if (name === 'ffmpeg') return unpacked(ffmpegPath) || 'ffmpeg';
  return unpacked(ffprobePath) || 'ffprobe';
}
function notify(cb, phase, progress, text) { if (cb) cb({ phase, progress, text }); }

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, windowsHide: true });
    let out = '', err = '';
    child.stdout.on('data', d => { const s=d.toString(); out += s; if(opts.onData) opts.onData(s,false); });
    child.stderr.on('data', d => { const s=d.toString(); err += s; if(opts.onData) opts.onData(s,true); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve({out,err}) : reject(new Error(`${path.basename(cmd)} exited ${code}\n${err.slice(-4500)}`)));
  });
}

function parseFps(s) {
  const p=String(s||'30/1').split('/').map(Number);
  return p.length===2 && p[1] ? p[0]/p[1] : Number(s)||30;
}

async function probe(video) {
  const {out}=await run(bin('ffprobe'),['-v','error','-print_format','json','-show_format','-show_streams',video]);
  const j=JSON.parse(out);
  const v=j.streams.find(s=>s.codec_type==='video')||{};
  const a=j.streams.find(s=>s.codec_type==='audio')||{};
  return {
    duration:Number(j.format?.duration||v.duration||0),
    width:Number(v.width||0),
    height:Number(v.height||0),
    fps:parseFps(v.avg_frame_rate||v.r_frame_rate),
    hasAudio:!!a.codec_type,
    videoCodec:v.codec_name||'',
    audioCodec:a.codec_name||'',
    size:Number(j.format?.size||0)
  };
}

async function detectSilence(video,duration,cb) {
  notify(cb,'silence',14,'اكتشاف السكوت والوقفات...');
  const args=['-hide_banner','-i',video,'-af','silencedetect=noise=-34dB:d=0.48','-f','null','-'];
  let stderr='';
  try { await run(bin('ffmpeg'),args,{onData:(d,isErr)=>{if(isErr)stderr+=d;}}); }
  catch(e){ stderr+='\n'+e.message; }
  const starts=[],ends=[];
  for(const line of stderr.split(/\r?\n/)){
    let m=line.match(/silence_start:\s*([0-9.]+)/); if(m)starts.push(Number(m[1]));
    m=line.match(/silence_end:\s*([0-9.]+)/); if(m)ends.push(Number(m[1]));
  }
  const out=[];
  for(let i=0;i<starts.length;i++){
    const s=starts[i], e=ends[i]??duration;
    if(e-s<.48)continue;
    const pad=Math.min(.17,(e-s)*.19);
    const rs=s+pad,re=e-pad;
    if(re-rs>.16)out.push({start:rs,end:re,reason:'سكوت طويل',kind:'silence',confidence:.98});
  }
  return out;
}

function mergeIntervals(items,gap=.05){
  const a=items.filter(x=>Number.isFinite(x.start)&&Number.isFinite(x.end)&&x.end>x.start).sort((x,y)=>x.start-y.start);
  const out=[];
  for(const x of a){
    const last=out[out.length-1];
    if(last&&x.start<=last.end+gap)last.end=Math.max(last.end,x.end);
    else out.push({...x});
  }
  return out;
}

function subtractRanges(start,end,removals){
  let cursor=start; const out=[];
  for(const r of removals){
    if(r.end<=start||r.start>=end)continue;
    const rs=Math.max(start,r.start), re=Math.min(end,r.end);
    if(rs>cursor+.04)out.push({start:cursor,end:rs});
    cursor=Math.max(cursor,re);
  }
  if(cursor<end-.04)out.push({start:cursor,end});
  return out.filter(x=>x.end-x.start>.06);
}

function scanBroll(folder){
  if(!folder||!fs.existsSync(folder))return [];
  return fs.readdirSync(folder)
    .filter(f=>/\.(mp4|mov|mkv|webm|jpg|jpeg|png)$/i.test(f))
    .slice(0,12)
    .map((f,i)=>({file:path.join(folder,f),name:f,score:12-i,matched:['مكتبة سفير']}));
}

async function analyzeVideo(payload,cb){
  const video=payload.video;
  if(!video||!fs.existsSync(video))throw new Error('ملف الفيديو غير موجود');
  notify(cb,'probe',4,'قراءة الفيديو الخام...');
  const meta=await probe(video);
  if(!meta.duration||!meta.width||!meta.height)throw new Error('تعذر قراءة خصائص الفيديو');
  const removals=await detectSilence(video,meta.duration,cb);
  const removed=removals.reduce((n,x)=>n+(x.end-x.start),0);
  notify(cb,'plan',72,'تجهيز خطة المونتاج...');
  const broll=scanBroll(payload.brollFolder);
  notify(cb,'done',100,'التحليل الأساسي اكتمل');
  return {
    version:'2.1.0-portable',
    video,meta,
    aiAvailable:false,
    aiReason:'النسخة المحمولة تعمل بدون Python. محرك فهم الكلام سيضاف كحزمة اختيارية.',
    transcript:'',
    segments:[],
    words:[],
    hooks:[],
    highlights:[],
    face:{x:.5,y:.45,confidence:0},
    removals,
    broll,
    summary:{
      original:meta.duration,
      estimated:Math.max(.1,meta.duration-removed),
      removed,
      silences:removals.length,
      semantic:0
    }
  };
}

function outputSize(format){
  if(format==='16:9')return{w:1920,h:1080,ratio:16/9};
  if(format==='1:1')return{w:1080,h:1080,ratio:1};
  return{w:1080,h:1920,ratio:9/16};
}
function even(n){return Math.max(2,Math.floor(n/2)*2)}
function cropFor(meta,format,zoom=1){
  const target=outputSize(format),sw=meta.width,sh=meta.height;
  let cw,ch;
  if(sw/sh>target.ratio){ch=sh;cw=ch*target.ratio;} else {cw=sw;ch=cw/target.ratio;}
  cw=even(cw/zoom); ch=even(ch/zoom);
  const x=even(Math.max(0,(sw-cw)/2)), y=even(Math.max(0,(sh-ch)/2));
  return{cw,ch,x,y,...target};
}

function buildPlan(analysis,settings={}){
  const duration=analysis.meta.duration;
  const start=Math.max(0,Number(settings.rangeStart??0));
  const end=Math.min(duration,Number(settings.rangeEnd??duration));
  let removals=settings.removeSilence===false?[]:(analysis.removals||[]).filter(r=>r.kind==='silence');
  removals=mergeIntervals(removals);
  let clips=subtractRanges(start,end,removals);
  let t=0;
  clips=clips.map((c,i)=>{
    const dur=c.end-c.start;
    const zoom=settings.autoZoom&&i%3===1?1.035:1;
    const item={...c,index:i,zoom,outputStart:t,outputEnd:t+dur};t+=dur;return item;
  });
  return{clips,duration:t};
}

function concatEscape(p){return p.replace(/'/g,"'\\''");}

async function renderVideo(payload,cb){
  const {analysis,settings={},output}=payload;
  if(!analysis?.video||!fs.existsSync(analysis.video))throw new Error('حلّل الفيديو أولًا');
  if(!output)throw new Error('اختر مكان حفظ الفيديو');
  const plan=buildPlan(analysis,settings);
  if(!plan.clips.length)throw new Error('لا توجد أجزاء متبقية للتصدير');

  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'safir-video-'));
  try{
    const parts=[];
    for(let i=0;i<plan.clips.length;i++){
      const c=plan.clips[i];
      const crop=cropFor(analysis.meta,settings.format||'9:16',c.zoom);
      const out=path.join(temp,`clip-${String(i).padStart(4,'0')}.mp4`);
      const dur=Math.max(.06,c.end-c.start);
      const vf=`crop=${crop.cw}:${crop.ch}:${crop.x}:${crop.y},scale=${crop.w}:${crop.h}:flags=lanczos,setsar=1,fps=30`;
      const args=['-y','-hide_banner','-ss',c.start.toFixed(3),'-i',analysis.video,'-t',dur.toFixed(3),'-vf',vf,
        '-c:v','libx264','-preset',settings.quality==='fast'?'veryfast':'medium','-crf',settings.quality==='high'?'18':'20','-pix_fmt','yuv420p'];
      if(analysis.meta.hasAudio)args.push('-c:a','aac','-b:a','192k','-ar','48000','-ac','2');
      else args.push('-an');
      args.push('-movflags','+faststart',out);
      notify(cb,'render',60+20*(i/plan.clips.length),`تجهيز مقطع ${i+1} من ${plan.clips.length}`);
      await run(bin('ffmpeg'),args);
      parts.push(out);
    }

    const list=path.join(temp,'concat.txt');
    fs.writeFileSync(list,parts.map(p=>`file '${concatEscape(p)}'`).join('\n'),'utf8');
    const combined=path.join(temp,'combined.mp4');
    notify(cb,'render',82,'تجميع المقاطع...');
    try{
      await run(bin('ffmpeg'),['-y','-hide_banner','-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',combined]);
    }catch(_){
      const a=['-y','-hide_banner','-f','concat','-safe','0','-i',list,'-c:v','libx264','-preset','veryfast','-crf','20'];
      if(analysis.meta.hasAudio)a.push('-c:a','aac','-b:a','192k');
      else a.push('-an');
      a.push('-movflags','+faststart',combined);
      await run(bin('ffmpeg'),a);
    }

    const logo=settings.logo&&fs.existsSync(settings.logo)?settings.logo:null;
    const clean=analysis.meta.hasAudio&&settings.cleanAudio!==false;
    if(!logo&&!clean){
      fs.copyFileSync(combined,output);
    }else{
      notify(cb,'finish',90,'تحسين الصوت وإضافة الهوية...');
      const args=['-y','-hide_banner','-i',combined];
      if(logo)args.push('-loop','1','-i',logo);
      if(logo){
        args.push('-filter_complex','[1:v]scale=150:-1[lg];[0:v][lg]overlay=W-w-38:38:format=auto[v]','-map','[v]');
      }else args.push('-map','0:v');
      if(analysis.meta.hasAudio){
        args.push('-map','0:a?');
        if(clean)args.push('-af','highpass=f=75,lowpass=f=15500,afftdn=nf=-25,loudnorm=I=-16:LRA=11:TP=-1.5','-c:a','aac','-b:a','192k');
        else args.push('-c:a','copy');
      }
      args.push('-c:v','libx264','-preset',settings.quality==='fast'?'veryfast':'medium','-crf',settings.quality==='high'?'18':'19','-pix_fmt','yuv420p','-movflags','+faststart');
      if(logo)args.push('-shortest');
      args.push(output);
      await run(bin('ffmpeg'),args);
    }
    notify(cb,'done',100,'الفيديو النهائي جاهز');
    return{output,plan};
  }finally{
    try{fs.rmSync(temp,{recursive:true,force:true})}catch(_){}
  }
}

async function createReels(payload,cb){
  const {analysis,settings={},folder}=payload;
  if(!analysis?.video)throw new Error('حلّل الفيديو أولًا');
  fs.mkdirSync(folder,{recursive:true});
  const d=analysis.meta.duration;
  const reelLen=Math.min(45,d);
  const starts=d<=reelLen?[0]:[0,Math.max(0,(d-reelLen)/2),Math.max(0,d-reelLen)];
  const unique=[...new Set(starts.map(x=>Math.round(x*100)/100))].slice(0,3);
  const outputs=[];
  for(let i=0;i<unique.length;i++){
    notify(cb,'reels',Math.round(i/unique.length*100),`إنشاء Reel ${i+1} من ${unique.length}`);
    const out=path.join(folder,`ريل سفير ${i+1}.mp4`);
    await renderVideo({
      analysis,
      settings:{...settings,format:'9:16',rangeStart:unique[i],rangeEnd:Math.min(d,unique[i]+reelLen)},
      output:out
    },cb);
    outputs.push(out);
  }
  return outputs;
}

module.exports={analyzeVideo,renderVideo,createReels,buildPlan,mergeIntervals};