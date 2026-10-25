import React, { useEffect, useRef, useState } from 'react';
import './original-material.css';

type Original = { kind: 'pdf' | 'image' | 'download'; name: string } | null;
type Props = { sourceId: string; section: number; original: Original };
type ImageAsset = { sourceId: string; kind: 'image'; blob: Blob };
type PdfAsset = { sourceId: string; kind: 'pdf'; bytes: ArrayBuffer };
type Asset = ImageAsset | PdfAsset;
type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export const isOriginalSourceId = (value: string) => /^[a-f0-9]{24}$/.test(value);

export function originalEndpoint(sourceId: string) {
  return isOriginalSourceId(sourceId) ? `/api/workspace/source/${sourceId}/original` : null;
}

export function sectionToOriginalPage(section: number) {
  if (!Number.isSafeInteger(section) || section < 0) return 1;
  return Math.min(4, section + 1);
}

export function originalPageLimit(pageCount: number) {
  return Number.isSafeInteger(pageCount) && pageCount > 0 ? Math.min(4, pageCount) : 0;
}

export function boundOriginalPage(page: number, pageCount: number) {
  const limit = originalPageLimit(pageCount);
  return limit ? Math.max(1, Math.min(limit, Number.isSafeInteger(page) ? page : 1)) : 0;
}

export const MAX_PDF_CANVAS_DIMENSION = 4096;
export const MAX_PDF_CANVAS_PIXELS = 12_000_000;

export function boundedPdfCanvasSize(width: number, height: number, containerWidth: number) {
  if (![width, height, containerWidth].every(Number.isFinite) || width <= 0 || height <= 0 || containerWidth <= 0) {
    throw new Error('This PDF page has invalid dimensions. Use the extracted text instead.');
  }
  const pixelScale = Math.sqrt(MAX_PDF_CANVAS_PIXELS / width) / Math.sqrt(height);
  const scale = Math.min(1.6, containerWidth / width, MAX_PDF_CANVAS_DIMENSION / width, MAX_PDF_CANVAS_DIMENSION / height, pixelScale);
  const canvasWidth = Math.ceil(width * scale);
  const canvasHeight = Math.ceil(height * scale);
  if (!Number.isFinite(scale) || scale <= 0 || canvasWidth <= 0 || canvasHeight <= 0 ||
      canvasWidth > MAX_PDF_CANVAS_DIMENSION || canvasHeight > MAX_PDF_CANVAS_DIMENSION ||
      canvasWidth * canvasHeight > MAX_PDF_CANVAS_PIXELS) {
    throw new Error('This PDF page is too large to display safely. Use the extracted text instead.');
  }
  return { scale, width: canvasWidth, height: canvasHeight };
}

export async function fetchOriginalAsset(
  sourceId: string,
  kind: 'pdf' | 'image',
  options: { signal?: AbortSignal; fetcher?: Fetcher } = {},
): Promise<Asset> {
  const url = originalEndpoint(sourceId);
  if (!url) throw new TypeError('Original page is unavailable for this source.');
  const fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  const response = await fetcher(url, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'error',
    signal: options.signal,
  });
  if (!response.ok) throw new Error('The original could not be loaded. Try again.');
  const actualType = (response.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase();
  const expectedTypes = kind === 'pdf' ? ['application/pdf'] : ['image/png', 'image/jpeg'];
  if (!expectedTypes.includes(actualType)) throw new Error('The saved file is not a supported original page. Use the extracted text instead.');
  return kind === 'pdf'
    ? { sourceId, kind, bytes: await response.arrayBuffer() }
    : { sourceId, kind, blob: await response.blob() };
}

type PdfjsModule = typeof import('pdfjs-dist');
type PdfLoadingTask = ReturnType<PdfjsModule['getDocument']>;
type PdfDocument = Awaited<PdfLoadingTask['promise']>;
type PdfPageSession = { ready: Promise<{ pageCount: number; pageNumber: number } | null>; dispose: () => void };
type PdfLoader = () => Promise<PdfjsModule>;

const loadPdfJs: PdfLoader = async () => {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
};

export function createPdfPageSession(
  data: ArrayBuffer,
  requestedPage: number,
  canvas: HTMLCanvasElement,
  loadPdf: PdfLoader = loadPdfJs,
): PdfPageSession {
  let cancelled = false;
  let loadingTask: PdfLoadingTask | null = null;
  let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;

  const ready = (async () => {
    const pdfjs = await loadPdf();
    if (cancelled) return null;
    const parameters = { data: new Uint8Array(data.slice(0)), isEvalSupported: false } as Parameters<PdfjsModule['getDocument']>[0];
    loadingTask = pdfjs.getDocument(parameters);
    const document = await loadingTask.promise;
    if (cancelled) return null;
    const pageCount = originalPageLimit(document.numPages);
    if (!pageCount) throw new Error('This PDF has no readable pages. Use the extracted text instead.');
    const pageNumber = boundOriginalPage(requestedPage, pageCount);
    const page = await document.getPage(pageNumber);
    if (cancelled) return null;
    const baseViewport = page.getViewport({ scale: 1 });
    const containerWidth = canvas.parentElement?.clientWidth || 960;
    const { scale, width, height } = boundedPdfCanvasSize(baseViewport.width, baseViewport.height, containerWidth);
    const viewport = page.getViewport({ scale });
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('This device cannot display the PDF page. Use the extracted text instead.');
    canvas.width = width;
    canvas.height = height;
    const activeRenderTask = page.render({ canvas, canvasContext: context, viewport });
    renderTask = activeRenderTask;
    await activeRenderTask.promise;
    if (cancelled) return null;
    return { pageCount, pageNumber };
  })().catch(error => {
    if (cancelled) return null;
    throw error;
  });

  const dispose = () => {
    if (cancelled) return;
    cancelled = true;
    try { renderTask?.cancel(); } catch { /* A completed render task needs no further action. */ }
    if (loadingTask) void loadingTask.destroy();
    const context = canvas.getContext('2d');
    context?.clearRect(0, 0, canvas.width, canvas.height);
  };

  return { ready, dispose };
}

export default function OriginalMaterial({ sourceId, section, original }: Props) {
  const [opened, setOpened] = useState<{ sourceId: string; kind: NonNullable<Original>['kind'] } | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [pageSelection, setPageSelection] = useState<{ sourceId: string; section: number; page: number } | null>(null);
  const [pageCountBySource, setPageCountBySource] = useState<{ sourceId: string; count: number } | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const url = originalEndpoint(sourceId);
  const isOpen = !!original && opened?.sourceId === sourceId && opened.kind === original.kind;
  const currentAsset = asset?.sourceId === sourceId && asset.kind === original?.kind ? asset : null;
  const requestedPage = pageSelection?.sourceId === sourceId && pageSelection.section === section
    ? pageSelection.page
    : sectionToOriginalPage(section);
  const pageCount = pageCountBySource?.sourceId === sourceId ? pageCountBySource.count : 0;

  useEffect(() => {
    if (!isOpen || !url || original?.kind === 'download' || !original) return;
    const controller = new AbortController();
    let activeObjectUrl: string | null = null;
    setStatus(original.kind === 'pdf' ? 'Loading the original page…' : 'Loading the original image…');
    setError('');
    void fetchOriginalAsset(sourceId, original.kind, { signal: controller.signal }).then(nextAsset => {
      if (controller.signal.aborted) return;
      if (nextAsset.kind === 'image') {
        activeObjectUrl = URL.createObjectURL(nextAsset.blob);
        objectUrlRef.current = activeObjectUrl;
      }
      setAsset(nextAsset);
      setStatus(nextAsset.kind === 'image' ? 'Original image ready.' : 'Preparing the original page…');
    }).catch(() => {
      if (!controller.signal.aborted) {
        setError('The original could not be displayed. Use the extracted text instead.');
        setStatus('');
      }
    });
    return () => {
      controller.abort();
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl);
        if (objectUrlRef.current === activeObjectUrl) objectUrlRef.current = null;
      }
    };
  }, [isOpen, original, sourceId, url]);

  useEffect(() => {
    if (!isOpen || !original || original.kind !== 'pdf' || currentAsset?.kind !== 'pdf' || !canvasRef.current) return;
    const session = createPdfPageSession(currentAsset.bytes, requestedPage, canvasRef.current);
    setStatus('Preparing the original page…');
    setError('');
    void session.ready.then(result => {
      if (!result) return;
      setPageCountBySource({ sourceId, count: result.pageCount });
      setPageSelection({ sourceId, section, page: result.pageNumber });
      setStatus(`Original page ${result.pageNumber} ready.`);
    }).catch(() => {
      setError('This PDF page could not be displayed. Use the extracted text instead.');
      setStatus('');
    });
    return () => session.dispose();
  }, [currentAsset, isOpen, original?.kind, requestedPage, section, sourceId]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const open = () => {
    if (!url || !original) return;
    setOpened({ sourceId, kind: original.kind });
    setError('');
    setStatus(original.kind === 'download' ? 'Download option ready.' : 'Loading original material…');
  };

  if (!original) return <div className="omv"><p className="omv__unavailable" role="status">No saved original is available. Review the extracted text instead.</p></div>;
  if (!url) return <div className="omv"><p className="omv__unavailable" role="status">Original comparison is unavailable for this source.</p></div>;

  return <section className="omv" aria-label="Original material comparison">
    {!isOpen && <button type="button" className="omv__open" onClick={open}>
      {original.kind === 'pdf' ? 'Open original page' : original.kind === 'image' ? 'Show original image' : 'Show download option'}
    </button>}
    {isOpen && original.kind === 'download' && <div className="omv__download" role="status">
      <p>Page preview is not available for this file. Reading the extracted text remains available.</p>
      <a className="omv__download-link" href={url} download={original.name}>Download original file</a>
    </div>}
    {isOpen && original.kind === 'image' && currentAsset?.kind === 'image' && objectUrlRef.current && <figure className="omv__figure">
      <img className="omv__image" src={objectUrlRef.current} alt={`Original source image for section ${section + 1}: ${original.name}`} />
      <figcaption>{original.name} · source image</figcaption>
    </figure>}
    {isOpen && original.kind === 'pdf' && <div className="omv__pdf">
      <div className="omv__canvas-frame"><canvas ref={canvasRef} aria-label={`Original PDF page ${requestedPage}`} /></div>
      {pageCount > 0 && <div className="omv__pager" role="group" aria-label="Original PDF page controls">
        <button type="button" disabled={requestedPage <= 1} onClick={() => setPageSelection({ sourceId, section, page: boundOriginalPage(requestedPage - 1, pageCount) })}>Previous page</button>
        <span>Page {requestedPage} of {pageCount}</span>
        <button type="button" disabled={requestedPage >= pageCount} onClick={() => setPageSelection({ sourceId, section, page: boundOriginalPage(requestedPage + 1, pageCount) })}>Next page</button>
      </div>}
    </div>}
    {status && <p className="omv__status" role="status">{status}</p>}
    {error && <p className="omv__error" role="alert">{error}</p>}
  </section>;
}
