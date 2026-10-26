import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ReasoningCapture from './ReasoningCapture';
import type { ConfirmedReasoning } from './reasoning';

const options = [
  { id: 'slower', label: 'Synchronous speed falls.' },
  { id: 'faster', label: 'Synchronous speed rises.' },
  { id: 'same', label: 'Synchronous speed stays the same.' },
];
const root = document.getElementById('root');
if (!root) throw new Error('Preview root is missing.');

function Preview() {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedReasoning | null>(null);
  return <main style={{ maxWidth: 1000, margin: '0 auto', padding: 24, fontFamily: 'Manrope, Arial, sans-serif' }}>
    <div style={{ marginBottom: 18, padding: '13px 16px', border: '1px solid #bd9654', borderRadius: 10, background: '#fff3d8', color: '#55401e', lineHeight: 1.55 }}>
      <strong>Synthetic preview only.</strong> This sample motor question is not connected to a reviewed lesson. The transcript callback is a fixture and sends nothing over the network.
    </div>
    <ReasoningCapture
      questionId="preview-motor-q1"
      question="If supply frequency stays the same and pole count increases, what happens to synchronous speed?"
      options={options}
      selectedOptionId={selectedOptionId}
      onSelectionChange={setSelectedOptionId}
      providerLabel="synthetic preview fixture"
      transcribe={async () => ({ text: 'Synthetic transcript fixture; this is not speech recognition.', provider: 'Preview only', model: 'fixture' })}
      onConfirm={setConfirmed}
    />
    {confirmed && <p role="status" style={{ marginTop: 14, color: '#355c47' }}>Confirmed: answer “{options.find(option => option.id === confirmed.selectedOptionId)?.label}” · {confirmed.method} · confidence {confirmed.confidence ?? 'not provided'}.</p>}
  </main>;
}

createRoot(root).render(<Preview />);
