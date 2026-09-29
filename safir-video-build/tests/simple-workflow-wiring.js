const fs = require('fs');

const main = fs.readFileSync('app/main.js','utf8');
const preload = fs.readFileSync('app/preload.js','utf8');
const ui = fs.readFileSync('app/simple.js','utf8');
const html = fs.readFileSync('app/simple.html','utf8');
const engine = fs.readFileSync('app/engine.js','utf8');

const required = [
  [main.includes("loadFile(path.join(__dirname, 'simple.html'))"), 'simple.html is not the startup UI'],
  [main.includes("ipcMain.handle('simple-process'"), 'simple-process IPC missing'],
  [preload.includes("simpleProcess: (payload) => ipcRenderer.invoke('simple-process', payload)"), 'simpleProcess preload bridge missing'],
  [ui.includes("window.safir.pickVideo()"), 'video picker is not wired'],
  [ui.includes("window.safir.simpleProcess({video:videoPath})"), 'one-click process button is not wired'],
  [html.includes('id="processBtn"'), 'process button missing'],
  [engine.includes("async function processSimpleVideo"), 'simple engine function missing'],
  [engine.includes("transitionDuration:.12"), 'automatic transition setting missing'],
  [engine.includes("fontName:'FF Shamel Family'"), 'FF Shamel caption font missing'],
  [engine.includes("captionMode:'sentence'"), 'simple Arabic caption mode missing']
];
for (const [ok,msg] of required) if(!ok) throw new Error(msg);
console.log('SIMPLE_WORKFLOW_WIRING_PASS');