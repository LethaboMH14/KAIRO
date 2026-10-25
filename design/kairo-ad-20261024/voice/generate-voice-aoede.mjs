// Final KAIRO narration in the app's own voice (Google Chirp 3 HD Aoede, en-GB) — run by the user, not by an agent.
//
// Needs the user's own gcloud login (no keys in files):  gcloud auth login
// PowerShell, from the project root:
//   $env:KAIRO_AUTH_MODE='gcloud'; node design/kairo-ad-20261024/voice/generate-voice-aoede.mjs
//   python design/kairo-ad-20261024/make.py --from audio
//
// Five public advert lines (about 140 characters), one request each, no retries, capped at 400 characters.
// The student's thoughts are NOT generated here: they belong to the entrant or a cast/consenting actor.
// Writes voice/aoede/*.wav (48 kHz LINEAR16) and repoints voice/takes.json at them, keeping the chorus takes.
import {writeFile, readFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {getToken} from '../../../studio/server/google.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(here, '..');
const timeline = JSON.parse(await readFile(path.join(project, 'timeline.json'), 'utf8'));
const lines = timeline.voice.kairo;
const chars = lines.reduce((n, l) => n + l.tts_text.length, 0);
if (chars > 400) throw new Error('Character cap exceeded; refusing to call the API.');
const token = await getToken();
await mkdir(path.join(here, 'aoede'), {recursive: true});
const takes = JSON.parse(await readFile(path.join(here, 'takes.json'), 'utf8'));
const kept = takes.lines.filter(l => l.group !== 'kairo');
const made = [];
for (const l of lines) {
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST', signal: AbortSignal.timeout(45000),
    headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-goog-user-project': 'kairo-access-20261021'},
    body: JSON.stringify({input: {text: l.tts_text}, voice: {languageCode: 'en-GB', name: 'en-GB-Chirp3-HD-Aoede'},
      audioConfig: {audioEncoding: 'LINEAR16', sampleRateHertz: 48000}}),
  });
  if (!res.ok) throw new Error(`Voice request for ${l.id} failed (HTTP ${res.status}); nothing retried.`);
  const audio = Buffer.from((await res.json()).audioContent, 'base64');
  const file = path.join(here, 'aoede', `${l.id}.wav`);
  await writeFile(file, audio);
  made.push({id: l.id, group: 'kairo', text: l.text, tts_text: l.tts_text, voice: 'en-GB-Chirp3-HD-Aoede', speed: 1,
    file: `voice/aoede/${l.id}.wav`, rate: 48000, sha256: createHash('sha256').update(audio).digest('hex')});
}
takes.kind = 'KAIRO: Google Chirp 3 HD Aoede (synthetic; the app default voice). Student thoughts: see chorus takes.';
takes.lines = [...made, ...kept];
takes.aoede = {characters: chars, requests: made.length, list_rate_estimate_usd: +(chars * 30 / 1e6).toFixed(5),
  note: 'List-rate estimate at $30 per million characters before any free tier or credits; not a billing record.'};
await writeFile(path.join(here, 'takes.json'), JSON.stringify(takes, null, 1));
console.log(JSON.stringify({voice: 'en-GB-Chirp3-HD-Aoede', characters: chars, requests: made.length}));
