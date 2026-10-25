// Pinned runtime assets: what the manifest says they are, and the check that the exact bytes about to run match it.
// The manifest (manifest.json) is imported into the app bundle, so assets cannot be swapped independently of it.
// The check catches corrupt, partial or stale deploys and stale caches. It cannot defend against a compromised origin.
import { SIGNING_CONTRACT } from './contract.ts';

export type Asset = { path: string; sha256: string; bytes: number };
export type WasmPair = { loader: Asset; binary: Asset };

export type Manifest = {
  contract: string;
  mode: 'tracking-only';
  runtime: { package: string; version: string; npmIntegrity: string; license: string; wasm: { simd: WasmPair; nosimd: WasmPair } };
  model: {
    id: string; variant: string; asset: Asset; source: string; md5: string; upstreamLastModified: string;
    retrieved: string; license: string; modelCard: string; limits: string[];
  };
  worker: Asset & { source: string };
  licenseFile: Asset;
};

export class IntegrityError extends Error {
  readonly asset: string;
  constructor(asset: string, message: string) {
    super(`${asset}: ${message}`);
    this.name = 'IntegrityError';
    this.asset = asset;
  }
}

const HEX = /^[0-9a-f]{64}$/;

function asAsset(value: unknown, name: string): Asset {
  const a = value as Partial<Asset> | null;
  if (!a || typeof a.path !== 'string' || !a.path || a.path.startsWith('/') || a.path.includes('..')
    || typeof a.sha256 !== 'string' || !HEX.test(a.sha256) || !Number.isInteger(a.bytes) || (a.bytes as number) <= 0) {
    throw new Error(`manifest: ${name} is not a valid asset record`);
  }
  return { path: a.path, sha256: a.sha256, bytes: a.bytes as number };
}

/** Checks the manifest's shape and returns it typed; throws when anything the loader relies on is missing or odd. */
export function parseManifest(raw: unknown): Manifest {
  const m = raw as Manifest | null;
  if (!m || m.contract !== SIGNING_CONTRACT || m.mode !== 'tracking-only') throw new Error('manifest: wrong contract or mode');
  asAsset(m.runtime?.wasm?.simd?.loader, 'wasm simd loader');
  asAsset(m.runtime.wasm.simd.binary, 'wasm simd binary');
  asAsset(m.runtime.wasm.nosimd?.loader, 'wasm nosimd loader');
  asAsset(m.runtime.wasm.nosimd.binary, 'wasm nosimd binary');
  asAsset(m.model?.asset, 'model');
  asAsset(m.worker, 'worker');
  asAsset(m.licenseFile, 'licence file');
  if (!m.runtime.version || !m.runtime.npmIntegrity) throw new Error('manifest: runtime version or integrity missing');
  return m;
}

export async function sha256Hex(bytes: ArrayBuffer | Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('Checking the tracking files needs a secure page (https or localhost).');
  const digest = await subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyBytes(name: string, bytes: ArrayBuffer, expected: Asset): Promise<void> {
  if (bytes.byteLength !== expected.bytes) throw new IntegrityError(name, `expected ${expected.bytes} bytes, got ${bytes.byteLength}`);
  const actual = await sha256Hex(bytes);
  if (actual !== expected.sha256) throw new IntegrityError(name, `checksum ${actual.slice(0, 12)}… does not match the pinned ${expected.sha256.slice(0, 12)}…`);
}

export type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; arrayBuffer(): Promise<ArrayBuffer> }>;

/** Fetches one same-origin asset and returns its bytes only if they match the pinned size and checksum. */
export async function fetchVerified(name: string, base: string, asset: Asset, fetchFn: FetchLike, signal?: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetchFn(`${base}${asset.path}`, { signal });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  await verifyBytes(name, bytes, asset);
  return bytes;
}

/** wasm-feature-detect's SIMD probe: a module that only validates where 128-bit SIMD exists. */
export const SIMD_PROBE = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);

export function simdSupported(validate: (bytes: Uint8Array) => boolean = bytes => WebAssembly.validate(bytes as BufferSource)): boolean {
  try { return validate(SIMD_PROBE); } catch { return false; }
}

export function wasmFor(manifest: Manifest, simd: boolean): WasmPair {
  return simd ? manifest.runtime.wasm.simd : manifest.runtime.wasm.nosimd;
}

/** The three buffers handed to the tracker, each already checked against the manifest. */
export type VerifiedAssets = { loader: ArrayBuffer; wasm: ArrayBuffer; model: ArrayBuffer; simd: boolean };

export async function loadVerifiedAssets(opts: { manifest: Manifest; base: string; fetchFn: FetchLike; simd: boolean; signal?: AbortSignal }): Promise<VerifiedAssets> {
  const { manifest, base, fetchFn, simd, signal } = opts;
  const pair = wasmFor(manifest, simd);
  const [loader, wasm, model] = await Promise.all([
    fetchVerified('tracker loader', base, pair.loader, fetchFn, signal),
    fetchVerified('tracker engine', base, pair.binary, fetchFn, signal),
    fetchVerified('hand model', base, manifest.model.asset, fetchFn, signal),
  ]);
  return { loader, wasm, model, simd };
}
