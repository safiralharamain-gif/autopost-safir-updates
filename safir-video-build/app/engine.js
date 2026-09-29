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
function aiPath(name) {
  return unpacked(path.join(__dirname, '..', 'ai', name));
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

async function probeMedia(file) {
  if (!file || !fs.existsSync(file)) throw new Error('ملف الوسائط غير موجود');
  if (/\.(jpg|jpeg|png|webp)$/i.test(file)) return {duration:5,width:0,height:0,hasAudio:false,isImage:true};
  return probe(file);
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

function srtTimeToSeconds(s){
  const m=String(s||'').trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if(!m)return 0;
  return Number(m[1])*3600+Number(m[2])*60+Number(m[3])+Number(m[4].padEnd(3,'0').slice(0,3))/1000;
}
function parseSrt(text){
  const blocks=String(text||'').replace(/\r/g,'').trim().split(/\n{2,}/);
  const out=[];
  for(const block of blocks){
    const lines=block.split('\n').filter(Boolean);
    const timing=lines.findIndex(x=>x.includes('-->'));
    if(timing<0)continue;
    const m=lines[timing].match(/(.+?)\s*-->\s*(.+)/); if(!m)continue;
    const body=lines.slice(timing+1).join(' ').replace(/<[^>]+>/g,'').trim();
    if(!body)continue;
    out.push({id:out.length+1,start:srtTimeToSeconds(m[1]),end:srtTimeToSeconds(m[2]),text:body,importance:0.45});
  }
  return out;
}
function parseWhisperJson(input){
  const j=typeof input==='string'?JSON.parse(input):input;
  const segments=[];
  const words=[];
  const tx=Array.isArray(j?.transcription)?j.transcription:[];
  for(const seg of tx){
    const start=Number(seg?.offsets?.from||0)/1000;
    const end=Number(seg?.offsets?.to||0)/1000;
    const text=String(seg?.text||'').trim();
    if(text)segments.push({id:segments.length+1,start,end,text,importance:0.45});
    const toks=Array.isArray(seg?.tokens)?seg.tokens:[];
    let current=null, made=0;
    const flush=()=>{
      if(current&&current.text){
        current.text=current.text.trim();
        if(current.text&&!/^<\|.*\|>$/.test(current.text)){
          current.id=words.length+1;
          words.push(current);made++;
        }
      }
      current=null;
    };
    for(const tok of toks){
      const raw=String(tok?.text||'');
      if(!raw||/^<\|.*\|>$/.test(raw.trim()))continue;
      const piece=raw.trim();
      if(!piece)continue;
      const ts=Number(tok?.offsets?.from)/1000, te=Number(tok?.offsets?.to)/1000;
      if(!Number.isFinite(ts)||!Number.isFinite(te)||te<=ts)continue;
      const punct=/^[،؛؟.!?,:…]+$/u.test(piece);
      const startsNew=/^\s/u.test(raw);
      if(punct&&current){
        current.text+=piece;current.end=Math.max(current.end,te);continue;
      }
      if(!current||startsNew){
        flush();
        current={text:piece,start:ts,end:te,confidence:Number(tok?.p||0)};
      }else{
        current.text+=piece;
        current.end=Math.max(current.end,te);
        current.confidence=Math.max(current.confidence,Number(tok?.p||0));
      }
    }
    flush();
    if(made===0&&text){
      const ws=text.split(/\s+/u).filter(Boolean);
      const dur=Math.max(.08,end-start);
      const totalChars=Math.max(1,ws.reduce((n,w)=>n+w.length,0));
      let cur=start;
      for(const w of ws){
        const wd=Math.max(.08,dur*(w.length/totalChars));
        const we=Math.min(end,cur+wd);
        words.push({id:words.length+1,text:w,start:cur,end:we,confidence:.5});
        cur=we;
      }
      if(words.length)words[words.length-1].end=end;
    }
  }
  return {segments,words,transcript:segments.map(x=>x.text).join(' ')};
}
function normalizeArabic(s){
  return String(s||'')
    .replace(/[\u064B-\u065F\u0670]/g,'')
    .replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')
    .replace(/[^\u0600-\u06FF0-9a-zA-Z ]/g,' ')
    .replace(/\s+/g,' ').trim().toLowerCase();
}
function semanticRemovalsFromSegments(segments){
  const out=[], fillers=new Set(['اه','آه','امم','اممم','يعني','طيب','تمام','اوك','اوكي','ممم']);
  for(let i=0;i<segments.length;i++){
    const s=segments[i], n=normalizeArabic(s.text), prev=i?normalizeArabic(segments[i-1].text):'';
    const words=n.split(' ').filter(Boolean);
    if((s.end-s.start)<=1.8 && words.length<=2 && words.every(w=>fillers.has(w))){
      out.push({start:s.start,end:s.end,kind:'semantic',reason:'كلمة حشو قصيرة',confidence:.9});
      continue;
    }
    if(prev && n && (n===prev || (n.length>10 && prev.includes(n)) || (prev.length>10 && n.includes(prev)))){
      out.push({start:s.start,end:s.end,kind:'semantic',reason:'تكرار قريب',confidence:.82});
    }
  }
  return out;
}
function scoreHooks(segments){
  return segments.map(s=>{
    const t=String(s.text||'');
    let score=.25;
    if(/[؟?]/.test(t))score+=.2;
    if(/\d/.test(t))score+=.12;
    if(/خلي بالك|مهم|لازم|قبل ما|سر|غلط|ممنوع|أفضل|ازاي|إزاي|ليه/.test(t))score+=.2;
    if(t.length>=18&&t.length<=85)score+=.15;
    score+=Math.max(0,.08-Math.min(.08,s.start/120));
    return {...s,score:Math.min(.99,score)};
  }).sort((a,b)=>b.score-a.score).slice(0,5);
}
function splitKeptRanges(kept,segments){
  const out=[];
  for(const r of kept){
    let cuts=[r.start,r.end];
    for(const s of segments||[]){
      if(s.start>r.start+.8&&s.start<r.end-.45)cuts.push(s.start);
    }
    cuts=[...new Set(cuts.map(x=>Math.round(x*100)/100))].sort((a,b)=>a-b);
    let last=cuts[0];
    for(let i=1;i<cuts.length;i++){
      const end=cuts[i];
      if(end-last<.7 && i<cuts.length-1)continue;
      out.push({start:last,end});last=end;
    }
    if(r.end-last>.08)out.push({start:last,end:r.end});
  }
  return out.filter(x=>x.end-x.start>.08);
}
async function transcribeArabic(video,cb){
  const cli=aiPath('whisper-cli.exe'),model=aiPath('ggml-base.bin');
  if(!fs.existsSync(cli)||!fs.existsSync(model))return {available:false,reason:'محرك الكلام المحلي غير موجود',segments:[],words:[]};
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'safir-whisper-'));
  try{
    const wav=path.join(temp,'speech.wav'), outBase=path.join(temp,'result');
    notify(cb,'speech',28,'تحويل الصوت وتحليل الكلام العربي...');
    await run(bin('ffmpeg'),['-y','-hide_banner','-i',video,'-vn','-ac','1','-ar','16000','-c:a','pcm_s16le',wav]);
    notify(cb,'speech',40,'تحديد توقيت كل كلمة...');
    await run(cli,['-m',model,'-f',wav,'-l','ar','-ojf','-osrt','-sow','-of',outBase,'-np','-t',String(Math.max(2,Math.min(8,os.cpus().length-1)))]);
    const jsonFile=outBase+'.json';
    if(fs.existsSync(jsonFile)){
      const parsed=parseWhisperJson(fs.readFileSync(jsonFile,'utf8'));
      return {available:true,...parsed};
    }
    const srt=outBase+'.srt';
    if(!fs.existsSync(srt))return {available:false,reason:'محرك الكلام لم ينتج نصًا',segments:[],words:[]};
    const segments=parseSrt(fs.readFileSync(srt,'utf8'));
    const words=[];
    for(const s of segments){
      const ws=s.text.split(/\s+/u).filter(Boolean),dur=Math.max(.08,s.end-s.start),slice=dur/Math.max(1,ws.length);
      ws.forEach((w,i)=>words.push({id:words.length+1,text:w,start:s.start+i*slice,end:i===ws.length-1?s.end:s.start+(i+1)*slice,confidence:.5}));
    }
    return {available:true,segments,words,transcript:segments.map(x=>x.text).join(' ')};
  }catch(e){
    return {available:false,reason:'تعذر تحليل الكلام: '+e.message.split('\n')[0],segments:[],words:[]};
  }finally{
    try{fs.rmSync(temp,{recursive:true,force:true})}catch(_){}
  }
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
  const silence=await detectSilence(video,meta.duration,cb);
  const speech=meta.hasAudio ? await transcribeArabic(video,cb) : {available:false,reason:'الفيديو بدون صوت',segments:[]};
  const segments=speech.segments||[];
  const semantic=speech.available ? semanticRemovalsFromSegments(segments) : [];
  const removals=[...silence,...semantic];
  const effectiveRemovals=removals.filter(r=>{
    if(r.kind==='silence')return payload.settings?.removeSilence!==false;
    if(r.kind==='semantic')return payload.settings?.removeSemantic!==false;
    return true;
  });
  const kept=subtractRanges(0,meta.duration,mergeIntervals(effectiveRemovals,.04));
  const autoClips=splitKeptRanges(kept,segments);
  const removed=effectiveRemovals.reduce((n,x)=>n+(x.end-x.start),0);
  const hooks=speech.available?scoreHooks(segments):[];
  const broll=scanBroll(payload.brollFolder);
  notify(cb,'plan',82,'تجهيز التقطيع والكابشن...');
  notify(cb,'done',100,speech.available?'التحليل والكابشن اكتمل':'التحليل الأساسي اكتمل');
  return {
    version:'2.2.0-arabic-ai',
    video,meta,
    aiAvailable:speech.available,
    aiReason:speech.available?'تحليل الكلام العربي يعمل محليًا على جهازك':speech.reason,
    transcript:speech.transcript||'',
    segments,
    captions:segments.map(x=>({start:x.start,end:x.end,text:x.text})),
    words:speech.words||[],
    hooks,
    highlights:hooks.slice(0,3),
    face:{x:.5,y:.45,confidence:0},
    removals,
    autoClips,
    broll,
    summary:{
      original:meta.duration,
      estimated:Math.max(.1,meta.duration-removed),
      removed,
      silences:silence.length,
      semantic:semantic.length,
      captions:segments.length,
      clips:autoClips.length
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
  const manual=settings.manualTimeline;
  if(manual?.videoClips?.length){
    let t=0;
    const clips=manual.videoClips
      .filter(c=>c&&Number(c.end)>Number(c.start))
      .map((c,i)=>{
        const dur=Number(c.end)-Number(c.start);
        const item={source:c.source||analysis.video,start:Number(c.start),end:Number(c.end),index:i,zoom:1,outputStart:t,outputEnd:t+dur};
        t+=dur;return item;
      });
    return{clips,duration:t,manual:true,broll:manual.broll||[],audio:manual.audio||[]};
  }
  const duration=analysis.meta.duration;
  const start=Math.max(0,Number(settings.rangeStart??0));
  const end=Math.min(duration,Number(settings.rangeEnd??duration));
  let removals=(analysis.removals||[]).filter(r=>{
    if(r.kind==='silence')return settings.removeSilence!==false;
    if(r.kind==='semantic')return settings.removeSemantic!==false;
    return false;
  });
  removals=mergeIntervals(removals);
  let clips;
  if(start===0&&end===duration&&Array.isArray(analysis.autoClips)&&analysis.autoClips.length&&settings.removeSilence!==false){
    clips=analysis.autoClips.map(x=>({start:x.start,end:x.end}));
  }else{
    clips=subtractRanges(start,end,removals);
  }
  let t=0;
  clips=clips.map((c,i)=>{
    const dur=c.end-c.start;
    const zoom=settings.autoZoom&&i%3===1?1.035:1;
    const item={source:analysis.video,...c,index:i,zoom,outputStart:t,outputEnd:t+dur};t+=dur;return item;
  });
  return{clips,duration:t,manual:false,broll:[],audio:[]};
}

function concatEscape(p){return p.replace(/'/g,"'\\''");}

async function applyBroll(base,items,target,totalDuration,temp,settings,cb){
  let current=base;
  for(let i=0;i<(items||[]).length;i++){
    const x=items[i];
    if(!x?.source||!fs.existsSync(x.source))continue;
    const start=Math.max(0,Number(x.timelineStart||0));
    const dur=Math.max(.12,Number(x.end||0)-Number(x.start||0));
    if(start>=totalDuration)continue;
    const end=Math.min(totalDuration,start+dur);
    const realDur=end-start;
    const out=path.join(temp,`broll-${String(i).padStart(3,'0')}.mp4`);
    const args=['-y','-hide_banner','-i',current];
    const isImage=!!x.isImage||/\.(jpg|jpeg|png|webp)$/i.test(x.source);
    if(isImage) args.push('-loop','1','-framerate','30','-i',x.source);
    else args.push('-ss',Number(x.start||0).toFixed(3),'-t',realDur.toFixed(3),'-i',x.source);
    const fc=`[1:v]scale=${target.w}:${target.h}:force_original_aspect_ratio=increase,crop=${target.w}:${target.h},setsar=1,setpts=PTS-STARTPTS+${start.toFixed(3)}/TB[ov];[0:v][ov]overlay=0:0:eof_action=pass:enable='between(t,${start.toFixed(3)},${end.toFixed(3)})'[v]`;
    args.push('-filter_complex',fc,'-map','[v]','-map','0:a?','-c:v','libx264','-preset',settings.quality==='fast'?'veryfast':'medium','-crf','19','-pix_fmt','yuv420p','-c:a','copy','-t',totalDuration.toFixed(3),'-movflags','+faststart',out);
    notify(cb,'broll',84+Math.min(5,4*i/Math.max(1,items.length)),`تركيب B-roll ${i+1}`);
    await run(bin('ffmpeg'),args);
    current=out;
  }
  return current;
}

function remapCaptions(captions,plan,analysisVideo){
  const out=[];
  for(const clip of plan.clips){
    if((clip.source||analysisVideo)!==analysisVideo)continue;
    for(const cap of captions||[]){
      const s=Math.max(Number(cap.start),Number(clip.start)), e=Math.min(Number(cap.end),Number(clip.end));
      if(e-s<.06)continue;
      out.push({
        start:Number(clip.outputStart)+(s-Number(clip.start)),
        end:Number(clip.outputStart)+(e-Number(clip.start)),
        text:String(cap.text||'').trim(),
        confidence:Number(cap.confidence||0)
      });
    }
  }
  return out;
}
function assColor(hex,fallback='&H005DB7E4'){
  const m=String(hex||'').trim().match(/^#?([0-9a-f]{6})$/i);
  if(!m)return fallback;
  const h=m[1],r=h.slice(0,2),g=h.slice(2,4),b=h.slice(4,6);
  return '&H00'+b+g+r;
}
function buildWordHighlightEvents(words,groupSize=4,highlight='&H005DB7E4'){
  const out=[];
  for(let i=0;i<words.length;i++){
    const w=words[i];
    const gs=Math.floor(i/groupSize)*groupSize, ge=Math.min(words.length,gs+groupSize);
    const group=words.slice(gs,ge);
    const parts=group.map((x,j)=>{
      const active=(gs+j)===i;
      const color=active?highlight:'&H00FFFFFF';
      const weight=active?'\\b1':'\\b0';
      return `{\\c${color}${weight}}${assEscape(x.text)}`;
    });
    out.push({start:w.start,end:w.end,text:parts.join(' ')});
  }
  return out;
}
function assTime(sec){
  sec=Math.max(0,Number(sec)||0);
  const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60),cs=Math.floor((sec-Math.floor(sec))*100);
  return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
}
function assEscape(s){return String(s||'').replace(/\\/g,'\\\\').replace(/\{/g,'\\{').replace(/\}/g,'\\}').replace(/\n/g,'\\N')}
function ffFilterPath(p){return String(p).replace(/\\/g,'/').replace(/:/g,'\\:').replace(/'/g,"\\'")}
async function applyCaptions(base,analysis,plan,temp,settings,cb){
  if(settings.captions===false)return base;
  const useWords=settings.captionMode!=='sentence'&&Array.isArray(analysis.words)&&analysis.words.length;
  const sourceItems=useWords?analysis.words:(analysis.captions||analysis.segments||[]);
  if(!sourceItems?.length)return base;
  const mapped=remapCaptions(sourceItems,plan,analysis.video);
  if(!mapped.length)return base;
  const target=outputSize(settings.format||'9:16');
  const ass=path.join(temp,'captions.ass'),out=path.join(temp,'captioned.mp4');
  const font=String(settings.fontName||'FF Shamel Family').replace(/,/g,' ').trim()||'Arial';
  const size=Math.max(38,Math.min(110,Number(settings.captionSize||74)));
  const marginV=settings.format==='9:16'?155:70;
  const highlight=assColor(settings.captionHighlight||'#E4B75D');
  const events=useWords?buildWordHighlightEvents(mapped,Math.max(2,Math.min(6,Number(settings.captionWords||4))),highlight):mapped.map(x=>({...x,text:assEscape(x.text)}));
  let txt='[Script Info]\nScriptType: v4.00+\nPlayResX='+target.w+'\nPlayResY='+target.h+'\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n';
  txt+='[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\n';
  txt+=`Style: Safir,${font},${size},&H00FFFFFF,${highlight},&H00130F09,&H78000000,-1,0,0,0,100,100,0,0,1,6,1,2,70,70,${marginV},1\n\n`;
  txt+='[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n';
  for(const x of events)txt+=`Dialogue: 0,${assTime(x.start)},${assTime(x.end)},Safir,,0,0,0,,${useWords?x.text:assEscape(x.text)}\n`;
  fs.writeFileSync(ass,txt,'utf8');
  notify(cb,'captions',92,useWords?'تركيب الكابشن كلمة بكلمة...':'تركيب الكابشن العربي...');
  await run(bin('ffmpeg'),['-y','-hide_banner','-i',base,'-vf',`ass='${ffFilterPath(ass)}'`,'-map','0:v','-map','0:a?','-c:v','libx264','-preset',settings.quality==='fast'?'veryfast':'medium','-crf','19','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',out]);
  return out;
}

async function applyAudio(base,items,totalDuration,temp,cb,hasBaseAudio){
  let current=base,hasAudio=hasBaseAudio;
  for(let i=0;i<(items||[]).length;i++){
    const x=items[i];
    if(!x?.source||!fs.existsSync(x.source))continue;
    const at=Math.max(0,Number(x.timelineStart||0));
    const dur=Math.max(.12,Math.min(totalDuration-at,Number(x.end||0)-Number(x.start||0)));
    if(dur<=.1||at>=totalDuration)continue;
    const out=path.join(temp,`audio-${String(i).padStart(3,'0')}.mp4`);
    const args=['-y','-hide_banner','-i',current,'-ss',Number(x.start||0).toFixed(3),'-t',dur.toFixed(3),'-i',x.source];
    const delay=Math.max(0,Math.round(at*1000)),vol=Math.max(0,Math.min(2,Number(x.volume??.45)));
    const baseAudio=hasAudio?'[0:a]anull':'anullsrc=r=48000:cl=stereo,atrim=0:'+totalDuration.toFixed(3);
    const fc=`${baseAudio}[basea];[1:a]volume=${vol.toFixed(3)},adelay=${delay}|${delay}[adda];[basea][adda]amix=inputs=2:duration=first:dropout_transition=0[a]`;
    args.push('-filter_complex',fc,'-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-t',totalDuration.toFixed(3),'-movflags','+faststart',out);
    notify(cb,'audio',89+Math.min(4,3*i/Math.max(1,items.length)),`خلط الصوت ${i+1}`);
    await run(bin('ffmpeg'),args);
    current=out;hasAudio=true;
  }
  return{file:current,hasAudio};
}

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
      const source=c.source||analysis.video;
      if(!fs.existsSync(source)) throw new Error('ملف مقطع غير موجود: '+source);
      const crop=cropFor(analysis.meta,settings.format||'9:16',c.zoom);
      const out=path.join(temp,`clip-${String(i).padStart(4,'0')}.mp4`);
      const dur=Math.max(.06,c.end-c.start);
      const vf=`crop=${crop.cw}:${crop.ch}:${crop.x}:${crop.y},scale=${crop.w}:${crop.h}:flags=lanczos,setsar=1,fps=30`;
      const args=['-y','-hide_banner','-ss',c.start.toFixed(3),'-i',source,'-t',dur.toFixed(3),'-vf',vf,
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

    const target=outputSize(settings.format||'9:16');
    let working=combined;
    if(plan.manual&&plan.broll?.length) working=await applyBroll(working,plan.broll,target,plan.duration,temp,settings,cb);
    let hasAudio=analysis.meta.hasAudio;
    if(plan.manual&&plan.audio?.length){
      const mixed=await applyAudio(working,plan.audio,plan.duration,temp,cb,hasAudio);
      working=mixed.file;hasAudio=mixed.hasAudio;
    }
    working=await applyCaptions(working,analysis,plan,temp,settings,cb);

    const logo=settings.logo&&fs.existsSync(settings.logo)?settings.logo:null;
    const clean=hasAudio&&settings.cleanAudio!==false;
    if(!logo&&!clean){
      fs.copyFileSync(working,output);
    }else{
      notify(cb,'finish',94,'تحسين الصوت وإضافة الهوية...');
      const args=['-y','-hide_banner','-i',working];
      if(logo)args.push('-loop','1','-i',logo);
      if(logo){
        args.push('-filter_complex','[1:v]scale=150:-1[lg];[0:v][lg]overlay=W-w-38:38:format=auto[v]','-map','[v]');
      }else args.push('-map','0:v');
      if(hasAudio){
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

module.exports={analyzeVideo,renderVideo,createReels,buildPlan,mergeIntervals,probeMedia,parseSrt,parseWhisperJson,transcribeArabic,buildWordHighlightEvents};