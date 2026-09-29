const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const engine = require('./engine');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#F6F1E7',
    title: 'سفير الفيديو الذكي',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('pick-video', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'اختر الفيديو الخام',
    properties: ['openFile'],
    filters: [{ name: 'Video', extensions: ['mp4','mov','mkv','avi','m4v','webm'] }]
  });
  return res.canceled ? null : res.filePaths[0];
});

ipcMain.handle('pick-broll', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'اختر مكتبة B-roll',
    properties: ['openDirectory']
  });
  return res.canceled ? null : res.filePaths[0];
});

ipcMain.handle('pick-folder', async () => {
  const res = await dialog.showOpenDialog(mainWindow, { title: 'اختر مجلد الحفظ', properties: ['openDirectory','createDirectory'] });
  return res.canceled ? null : res.filePaths[0];
});

ipcMain.handle('pick-logo', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'اختر اللوجو',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png','jpg','jpeg','webp'] }]
  });
  return res.canceled ? null : res.filePaths[0];
});

ipcMain.handle('pick-export', async (_, suggested) => {
  const res = await dialog.showSaveDialog(mainWindow, {
    title: 'حفظ الفيديو النهائي',
    defaultPath: suggested || 'فيديو سفير النهائي.mp4',
    filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]
  });
  return res.canceled ? null : res.filePath;
});

ipcMain.handle('analyze-video', async (event, payload) => {
  return engine.analyzeVideo(payload, (msg) => event.sender.send('engine-progress', msg));
});
ipcMain.handle('render-video', async (event, payload) => {
  return engine.renderVideo(payload, (msg) => event.sender.send('engine-progress', msg));
});
ipcMain.handle('create-reels', async (event, payload) => {
  return engine.createReels(payload, (msg) => event.sender.send('engine-progress', msg));
});

ipcMain.handle('save-project', async (_, payload) => {
  const res = await dialog.showSaveDialog(mainWindow, {
    title: 'حفظ مشروع سفير',
    defaultPath: 'مشروع سفير فيديو.safirvideo.json',
    filters: [{ name: 'Safir Video Project', extensions: ['safirvideo.json'] }]
  });
  if (res.canceled) return null;
  fs.writeFileSync(res.filePath, JSON.stringify(payload, null, 2), 'utf8');
  return res.filePath;
});

ipcMain.handle('open-project', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'فتح مشروع سفير',
    properties: ['openFile'],
    filters: [{ name: 'Safir Video Project', extensions: ['json'] }]
  });
  if (res.canceled) return null;
  return JSON.parse(fs.readFileSync(res.filePaths[0], 'utf8'));
});

ipcMain.handle('reveal-file', async (_, p) => {
  if (p) shell.showItemInFolder(p);
});