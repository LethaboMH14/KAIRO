"""Bounded live checks. OAuth token remains in memory and is never printed or saved."""
import base64
import json
import shutil
import subprocess
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECT = 'kairo-access-20261021'
MODEL = 'gemini-3.5-flash-lite'


def main():
    command = shutil.which('gcloud')
    if command is None:
        raise RuntimeError('gcloud is not installed')
    auth = subprocess.run([command, 'auth', 'print-access-token', '--project=' + PROJECT],
                          capture_output=True, text=True, timeout=45)
    if auth.returncode or not auth.stdout.strip():
        raise RuntimeError('Existing gcloud session could not obtain an access token; sign-in is required')
    token = auth.stdout.strip()

    def request(url, body):
        req = urllib.request.Request(url, data=json.dumps(body).encode(), method='POST', headers={
            'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json',
            'x-goog-user-project': PROJECT})
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                return {'ok': True, 'data': json.load(response)}
        except urllib.error.HTTPError as error:
            try:
                payload = json.loads(error.read()).get('error', {})
                message = payload.get('message', 'Provider rejected request')
            except Exception:
                message = 'Provider rejected request'
            return {'ok': False, 'httpStatus': error.code, 'message': message}

    status = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'project': PROJECT}
    vertex = request(f'https://aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/global/publishers/google/models/{MODEL}:generateContent', {
        'contents': [{'role': 'user', 'parts': [{'text': 'Reply only READY.'}]}],
        'generationConfig': {'maxOutputTokens': 32, 'temperature': 0},
    })
    if vertex['ok']:
        content = vertex.pop('data')
        vertex.update(model=MODEL, text=''.join(part.get('text', '') for candidate in content.get('candidates', [])
                                             for part in candidate.get('content', {}).get('parts', [])),
                      usage=content.get('usageMetadata', {}))
    status['vertex'] = vertex
    speech = request('https://texttospeech.googleapis.com/v1/text:synthesize', {
        'input': {'text': 'Welcome to KAIRO. Let us explore how a request works.'},
        'voice': {'languageCode': 'en-US', 'name': 'en-US-Standard-C'},
        'audioConfig': {'audioEncoding': 'MP3'},
    })
    if speech['ok']:
        content = speech.pop('data')
        path = ROOT / 'assets/generated/kairo-voice-check.mp3'
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(base64.b64decode(content['audioContent']))
        speech.update(voice='en-US-Standard-C', file='assets/generated/kairo-voice-check.mp3', bytes=path.stat().st_size)
    status['speech'] = speech
    (ROOT / 'tools/cloud-status.local.json').write_text(json.dumps(status, indent=2), encoding='utf-8')
    print(json.dumps(status, indent=2))


if __name__ == '__main__':
    main()
