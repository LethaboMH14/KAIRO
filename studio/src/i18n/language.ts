import { useEffect, useState } from 'react';
import { catalogue as en } from './catalogues/en';
import { catalogue as af } from './catalogues/af';
import { catalogue as zu } from './catalogues/zu';

export const catalogues = { en, af, zu } as const;
export type LanguageCode = keyof typeof catalogues;
export type MessageKey = keyof typeof en.strings;
const STORAGE_KEY = 'kairo.uiLanguage';
const listeners = new Set<() => void>();

function reviewedCode(value: string | null): LanguageCode {
  return value && value in catalogues && catalogues[value as LanguageCode].meta.reviewed
    ? value as LanguageCode
    : 'en';
}

function readStoredLanguage(): LanguageCode {
  try {
    return typeof window === 'undefined' ? 'en' : reviewedCode(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'en';
  }
}

function readPreviewLanguage(): LanguageCode | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('preview-language');
  return value === 'af' || value === 'zu' ? value : null;
}

let selectedLanguage = readStoredLanguage();
const previewLanguage = readPreviewLanguage();
const notify = () => listeners.forEach(listener => listener());

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY || event.key === null) {
      selectedLanguage = reviewedCode(event.key === null ? null : event.newValue);
      notify();
    }
  });
}

export function subscribeLanguage(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLanguageSnapshot(): LanguageCode {
  return previewLanguage || selectedLanguage;
}

export function getLanguageServerSnapshot(): LanguageCode {
  return 'en';
}

export function getLanguagePreferenceSnapshot(): LanguageCode {
  return selectedLanguage;
}

export function useLanguage(): LanguageCode {
  return useStoreValue(getLanguageSnapshot);
}

export function useLanguagePreference(): LanguageCode {
  return useStoreValue(getLanguagePreferenceSnapshot);
}

export function setLanguagePreference(value: string) {
  if (previewLanguage) return;
  const next = reviewedCode(value);
  selectedLanguage = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Keep the current-page choice usable when browser storage is unavailable.
  }
  notify();
}

export function hasLanguagePreview(): boolean {
  return previewLanguage !== null;
}

// State plus subscription (not the external-store hook): the studio test renderer lacks that hook.
function useStoreValue(read: () => LanguageCode): LanguageCode {
  const [value, setValue] = useState<LanguageCode>(read);
  useEffect(() => { setValue(read()); const unsubscribe = subscribeLanguage(() => setValue(read())); return () => { unsubscribe(); }; }, [read]);
  return value;
}
