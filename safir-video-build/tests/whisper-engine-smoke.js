const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const engine = require('../app/engine');

const fixture = {
  transcription: [{
    offsets: { from: 0, to: 1400 },
    text: ' رحلة تليق',
    tokens: [
      { text: ' رحلة', offsets: { from: 100, to: 650 }, p: 0.91 },
      { text: ' تليق', offsets: { from: 650, to: 1200 }, p: 0.93 }
    ]
  }]
};
const parsedFixture = engine.parseWhisperJson(fixture);
if (parsedFixture.words.length !== 2) throw new Error('word timestamp parser failed');
if (parsedFixture.words[0].text !== 'رحلة' || parsedFixture.words[1].text !== 'تليق') throw new Error('word merge failed');
const events = engine.buildWordHighlightEvents(parsedFixture.words, 4, '&H005DB7E4');
if (events.length !== 2 || !events[0].text.includes('رحلة')) throw new Error('highlight event builder failed');

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'safir-whisper-smoke-'));
  const wav = path.join(dir, 'tone.wav');
  const r = spawnSync(ffmpeg, ['-y','-f','lavfi','-i','sine=frequency=440:duration=1.2','-ac','1','-ar','16000','-c:a','pcm_s16le',wav], {stdio:'inherit', windowsHide:true});
  if (r.status !== 0) throw new Error('could not make whisper smoke wav');
  const result = await engine.transcribeArabic(wav);
  if (!result || result.available !== true) throw new Error('local whisper engine failed: ' + (result?.reason || 'unknown'));
  console.log('WHISPER_LOCAL_ENGINE_PASS', {segments:(result.segments||[]).length});
})().catch(err => {
  console.error(err);
  process.exit(1);
});