const fs = require('fs');
const renderer = fs.readFileSync('app/renderer.js','utf8');
const preload = fs.readFileSync('app/preload.js','utf8');

if (/(^|[^$])\$\('\.format'\)\.forEach/m.test(renderer)) {
  throw new Error("Broken selector found: $('.format').forEach blocks renderer startup");
}
if (!renderer.includes("$('#pickVideo').onclick=chooseVideo")) {
  throw new Error('Video import button is not wired');
}
if (!renderer.includes("window.safir.pickVideo()")) {
  throw new Error('Video import dialog call missing');
}
if (!preload.includes("pickVideo: () => ipcRenderer.invoke('pick-video')")) {
  throw new Error('pickVideo bridge missing');
}
if (!preload.includes("webUtils.getPathForFile")) {
  throw new Error('Drag-drop file path bridge missing');
}
console.log('IMPORT_WIRING_SMOKE_PASS');
