// Plays a pre-generated speech sample and publishes an AudioInput ref (energy from Web Audio, playback time and,
// when chosen, Rhubarb viseme timings for that exact file). No network synthesis happens here.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioInput, Viseme } from './types.ts';
import { voiceAudio, voiceVisemes, type VoiceId } from './lesson.ts';

export type SpeechStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
export type LipMode = 'visemes' | 'amplitude';

export function useSpeechSample() {
  const signal = useRef<AudioInput>({ energy: 0, playing: false, paused: false, time: 0 });
  const audio = useRef<HTMLAudioElement | null>(null);
  const context = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const frame = useRef(0);
  const visemeCache = useRef(new Map<string, Viseme[]>());
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [shape, setShape] = useState<string | null>(null);

  const tick = useCallback(() => {
    const el = audio.current;
    const node = analyser.current;
    const s = signal.current;
    if (el && node) {
      const data = new Uint8Array(node.fftSize);
      node.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) { const x = (v - 128) / 128; sum += x * x; }
      s.energy = el.paused ? 0 : Math.min(1, Math.sqrt(sum / data.length) * 3.2);
      s.time = el.currentTime;
      if (s.visemes) {
        let current: string | null = null;
        for (const v of s.visemes) { if (v.at <= s.time) current = v.shape; else break; }
        setShape(prev => (prev === current ? prev : current));
      }
    }
    frame.current = requestAnimationFrame(tick);
  }, []);

  const stop = useCallback(() => {
    const el = audio.current;
    if (el) { el.pause(); el.currentTime = 0; }
    Object.assign(signal.current, { energy: 0, playing: false, paused: false, time: 0 });
    setShape(null);
    setStatus(s => (s === 'idle' ? s : 'idle'));
  }, []);

  const play = useCallback(async (voice: VoiceId, lipMode: LipMode) => {
    stop();
    setStatus('loading');
    try {
      if (!context.current) {
        context.current = new AudioContext();
        analyser.current = context.current.createAnalyser();
        analyser.current.fftSize = 1024;
        analyser.current.connect(context.current.destination);
      }
      await context.current.resume();
      let visemes = visemeCache.current.get(voice);
      if (!visemes) {
        const response = await fetch(voiceVisemes(voice));
        if (!response.ok) throw new Error(`viseme timings unavailable (${response.status})`);
        visemes = (await response.json()).visemes as Viseme[];
        visemeCache.current.set(voice, visemes);
      }
      const el = new Audio(voiceAudio(voice));
      el.preload = 'auto';
      context.current.createMediaElementSource(el).connect(analyser.current!);
      el.addEventListener('ended', () => {
        Object.assign(signal.current, { playing: false, paused: false, energy: 0 });
        setShape(null);
        setStatus('ended');
      });
      el.addEventListener('error', () => setStatus('error'));
      audio.current = el;
      signal.current.visemes = lipMode === 'visemes' ? visemes : undefined;
      await el.play();
      Object.assign(signal.current, { playing: true, paused: false });
      setStatus('playing');
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(tick);
    } catch {
      Object.assign(signal.current, { playing: false, paused: false, energy: 0 });
      setStatus('error');
    }
  }, [stop, tick]);

  const pause = useCallback(() => {
    if (!audio.current || audio.current.paused) return;
    audio.current.pause();
    Object.assign(signal.current, { paused: true, energy: 0 });
    setStatus('paused');
  }, []);

  const resume = useCallback(async () => {
    if (!audio.current || !signal.current.paused) return;
    await audio.current.play();
    signal.current.paused = false;
    setStatus('playing');
  }, []);

  useEffect(() => () => {
    cancelAnimationFrame(frame.current);
    audio.current?.pause();
    void context.current?.close();
  }, []);

  return { signal, status, shape, play, pause, resume, stop };
}
