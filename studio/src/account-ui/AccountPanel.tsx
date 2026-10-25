import { useEffect, useRef, useState, type FormEvent } from 'react';

export type AccountPanelProps = {
  status: 'loading' | 'signed-out' | 'signed-in';
  email?: string;
  pending: boolean;
  notice?: string;
  error?: string;
  scopeLabel: string;
  onAuthenticate: (input: { mode: 'signin' | 'signup'; email: string; password: string }) => void | Promise<void>;
  onReset: (email: string) => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
};

const GENERIC_ERROR = 'That did not work just now. Check your details and try again.';
const RESET_NOTICE = 'If an account uses this email, reset instructions will be sent.';

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function AccountPanel({ status, email: signedInEmail, pending, notice, error, scopeLabel, onAuthenticate, onReset, onSignOut }: AccountPanelProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState(signedInEmail ?? '');
  const [password, setPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const inFlight = useRef(false);
  const emailInput = useRef<HTMLInputElement>(null);
  const locked = pending || status === 'loading' || inFlight.current;

  useEffect(() => {
    if (status === 'signed-in') setPassword('');
  }, [status]);
  useEffect(() => () => { inFlight.current = false; }, []);

  const changeMode = (next: 'signin' | 'signup') => {
    if (locked || next === mode) return;
    setMode(next);
    setPassword('');
    setResetMessage('');
    setLocalError('');
  };

  const validCurrentEmail = () => {
    const value = email.trim();
    const validity = emailInput.current?.validity;
    return value && (validity ? validity.valid : validEmail(value)) ? value : '';
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked || inFlight.current) return;
    const normalizedEmail = validCurrentEmail();
    if (!normalizedEmail || !password || (mode === 'signup' && password.length < 12)) return;
    inFlight.current = true;
    setLocalError('');
    setResetMessage('');
    try {
      await onAuthenticate({ mode, email: normalizedEmail, password });
      setPassword('');
    } catch {
      if (!error) setLocalError(GENERIC_ERROR);
    } finally {
      inFlight.current = false;
    }
  };

  const reset = async () => {
    if (locked || inFlight.current) return;
    const normalizedEmail = validCurrentEmail();
    if (!normalizedEmail) return;
    inFlight.current = true;
    setLocalError('');
    setResetMessage('');
    try {
      await onReset(normalizedEmail);
      setPassword('');
      setResetMessage(RESET_NOTICE);
    } catch {
      if (!error) setLocalError(GENERIC_ERROR);
    } finally {
      inFlight.current = false;
    }
  };

  const signOut = async () => {
    if (locked || inFlight.current) return;
    inFlight.current = true;
    setPassword('');
    setLocalError('');
    try {
      await onSignOut();
    } catch {
      if (!error) setLocalError(GENERIC_ERROR);
    } finally {
      inFlight.current = false;
    }
  };

  const shownError = error || localError;
  const busy = pending || status === 'loading' || inFlight.current;

  return <section className="kairo-account" aria-labelledby="kairo-account-title" aria-busy={busy}>
    <style>{`.kairo-account{--ka-chalk:#f5f0e6;--ka-moss:#3e5144;--ka-sage:#a7af91;--ka-ink:#252b28;box-sizing:border-box;width:min(100%,32rem);margin-inline:auto;padding:clamp(1rem,4vw,2rem);border:1px solid color-mix(in srgb,var(--ka-moss) 24%,transparent);border-radius:1rem;background:var(--ka-chalk);color:var(--ka-ink);font-family:Manrope,KairoManrope,Arial,sans-serif}.kairo-account *{box-sizing:border-box}.kairo-account h2{margin:.25rem 0 .5rem;color:var(--ka-ink);font-size:1.5rem;line-height:1.2}.kairo-account p{line-height:1.55}.kairo-account .ka-eyebrow{margin:0;color:var(--ka-moss);font-size:.78rem;font-weight:750;letter-spacing:.08em;text-transform:uppercase}.kairo-account .ka-fields{display:grid;gap:1rem;margin:1.25rem 0}.kairo-account label{display:grid;gap:.4rem;font-weight:650}.kairo-account input{width:100%;min-height:48px;padding:.75rem;border:1px solid #899381;border-radius:.55rem;background:#fffdf8;color:var(--ka-ink);font:inherit}.kairo-account button{min-height:44px;padding:.65rem .9rem;border:1px solid var(--ka-moss);border-radius:.55rem;background:var(--ka-moss);color:var(--ka-chalk);font:inherit;font-weight:700;cursor:pointer}.kairo-account button:hover:not(:disabled){background:#314238}.kairo-account button:disabled{opacity:.58;cursor:wait}.kairo-account .ka-secondary{background:transparent;color:var(--ka-moss)}.kairo-account .ka-switch{display:flex;flex-wrap:wrap;gap:.5rem;margin:.75rem 0}.kairo-account .ka-switch button[aria-pressed=true]{background:var(--ka-sage);border-color:var(--ka-sage);color:var(--ka-ink)}.kairo-account .ka-actions{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem}.kairo-account .ka-scope{padding:.8rem;border-left:3px solid var(--ka-sage);background:#fffdf8}.kairo-account :focus-visible{outline:3px solid var(--ka-moss);outline-offset:3px}.kairo-account [role=alert]{color:#7a3028;font-weight:650}.kairo-account [role=status]{color:var(--ka-moss)}@media(max-width:24rem){.kairo-account .ka-actions>*{width:100%}}`}</style>
    <p className="ka-eyebrow">KAIRO account</p>
    <h2 id="kairo-account-title">{status === 'loading' ? 'Checking your account' : status === 'signed-in' ? 'Your account' : 'Keep your progress with you'}</h2>
    {status === 'loading' ? <p role="status">Loading account details…</p> : status === 'signed-in' ? <>
      <p>Signed in as <strong>{signedInEmail || 'your account'}</strong></p>
      <p className="ka-scope">This account applies to: {scopeLabel}</p>
      {notice && <p role="status">{notice}</p>}
      {shownError && <p role="alert">{shownError}</p>}
      <button type="button" onClick={signOut} disabled={busy}>{busy ? 'Please wait…' : 'Sign out'}</button>
    </> : <>
      <p>Sign in or create an account. Account access applies to {scopeLabel}.</p>
      <div className="ka-switch" role="group" aria-label="Account option">
        <button type="button" className="ka-secondary" aria-pressed={mode === 'signin'} onClick={() => changeMode('signin')} disabled={busy}>Sign in</button>
        <button type="button" className="ka-secondary" aria-pressed={mode === 'signup'} onClick={() => changeMode('signup')} disabled={busy}>Create account</button>
      </div>
      <form onSubmit={submit} noValidate>
        <div className="ka-fields">
          <label htmlFor="kairo-account-email">Email address</label>
          <input ref={emailInput} id="kairo-account-email" name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required value={email} onChange={event => setEmail(event.currentTarget.value)} disabled={busy} />
          <label htmlFor="kairo-account-password">Password</label>
          <input id="kairo-account-password" name="password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} aria-describedby={mode === 'signup' ? 'kairo-account-password-help' : undefined} required minLength={mode === 'signup' ? 12 : undefined} value={password} onChange={event => setPassword(event.currentTarget.value)} disabled={busy} />
          {mode === 'signup' && <p id="kairo-account-password-help">Use at least 12 characters. This is a form check; the account service sets its own rules.</p>}
        </div>
        {shownError && <p role="alert">{shownError}</p>}
        {notice && <p role="status">{notice}</p>}
        {resetMessage && <p role="status">{resetMessage}</p>}
        <div className="ka-actions">
          <button type="submit" disabled={busy || !email.trim() || !password || (mode === 'signup' && password.length < 12)}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
          <button type="button" className="ka-secondary" onClick={reset} disabled={busy || !email.trim()}>Send reset instructions</button>
        </div>
      </form>
    </>}
  </section>;
}
