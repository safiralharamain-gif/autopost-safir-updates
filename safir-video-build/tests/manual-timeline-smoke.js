const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const engine = require('../app/engine');

function run(args) {
  const r = spawnSync(ffmpeg, args, { stdio: 'inherit', windowsHide: true });
  if (r.status !== 0) throw new Error('ffmpeg test command failed: ' + r.status);
}

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'safir-timeline-test-'));
  const base = path.join(dir, 'base.mp4');
  const broll = path.join(dir, 'broll.mp4');
  const music = path.join(dir, 'music.wav');
  const output = path.join(dir, 'out.mp4');

  run(['-y','-f','lavfi','-i','testsrc=size=640x360:rate=30:duration=6',
       '-f','lavfi','-i','sine=frequency=440:duration=6',
       '-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-shortest',base]);

  run(['-y','-f','lavfi','-i','color=c=blue:size=640x360:rate=30:duration=2',
       '-c:v','libx264','-pix_fmt','yuv420p',broll]);

  run(['-y','-f','lavfi','-i','sine=frequency=880:duration=2','-c:a','pcm_s16le',music]);

  const meta = await engine.probeMedia(base);
  const analysis = {
    video: base,
    meta,
    removals: [],
    segments: [],
    hooks: [],
    broll: [],
    captions: [
      { start: 0.3, end: 1.4, text: 'اختبار كابشن عربي' },
      { start: 4.2, end: 5.4, text: 'سفير الفيديو الذكي' }
    ],
    words: [
      { start: 0.3, end: 0.65, text: 'اختبار' },
      { start: 0.65, end: 1.0, text: 'كابشن' },
      { start: 1.0, end: 1.4, text: 'عربي' },
      { start: 4.2, end: 4.55, text: 'سفير' },
      { start: 4.55, end: 4.95, text: 'الفيديو' },
      { start: 4.95, end: 5.4, text: 'الذكي' }
    ],
    summary: { original: meta.duration, estimated: meta.duration, removed: 0 }
  };

  const settings = {
    format: '1:1',
    cleanAudio: false,
    captions: true,
    captionMode: 'word',
    captionWords: 4,
    captionHighlight: '#E4B75D',
    fontName: 'Arial',
    captionSize: 58,
    quality: 'fast',
    manualTimeline: {
      videoClips: [
        { source: base, start: 0, end: 2 },
        { source: base, start: 4, end: 6 }
      ],
      broll: [
        { source: broll, start: 0, end: 1.2, timelineStart: 1.0, isImage: false }
      ],
      audio: [
        { source: music, start: 0, end: 1.5, timelineStart: 0.5, volume: 0.25 }
      ]
    }
  };

  await engine.renderVideo({ analysis, settings, output });
  if (!fs.existsSync(output) || fs.statSync(output).size < 10000) throw new Error('manual timeline output missing or too small');
  const outMeta = await engine.probeMedia(output);
  if (outMeta.duration < 3.7 || outMeta.duration > 4.4) throw new Error('unexpected output duration: ' + outMeta.duration);
  if (!outMeta.hasAudio) throw new Error('audio track was not present in exported result');
  console.log('MANUAL_TIMELINE_SMOKE_PASS', outMeta);
})().catch(err => {
  console.error(err);
  process.exit(1);
});