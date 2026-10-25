// KAIRO original educational model; concepts referenced from official Nand2Tetris Project 1.
// This is NOT a hardware timing, transistor, or professional circuit simulator.
export const SOURCE = Object.freeze({
  title: 'Nand2Tetris — Project 1: Boolean Logic',
  url: 'https://www.nand2tetris.org/project01',
  conceptRevision: 'project01-reviewed-2026-10-25',
  modelRevision: 'kairo-nand-trace-v1',
});
export const CIRCUITS = Object.freeze([
  { id: 'not', name: 'NOT A', description: 'Invert input A using NAND(A, A).', nodes: [
    { id: 'g1', a: 'a', b: 'a' },
  ], output: 'g1' },
  { id: 'and', name: 'A AND B', description: 'Invert the NAND of A and B.', nodes: [
    { id: 'g1', a: 'a', b: 'b' }, { id: 'g2', a: 'g1', b: 'g1' },
  ], output: 'g2' },
  { id: 'or', name: 'A OR B', description: 'Invert both inputs, then NAND them.', nodes: [
    { id: 'g1', a: 'a', b: 'a' }, { id: 'g2', a: 'b', b: 'b' },
    { id: 'g3', a: 'g1', b: 'g2' },
  ], output: 'g3' },
  { id: 'xor', name: 'A XOR B', description: 'Output 1 only when A and B differ.', nodes: [
    { id: 'g1', a: 'a', b: 'b' }, { id: 'g2', a: 'a', b: 'g1' },
    { id: 'g3', a: 'b', b: 'g1' }, { id: 'g4', a: 'g2', b: 'g3' },
  ], output: 'g4' },
  { id: 'mux', name: 'MUX(A, B, select)', description: 'Select A when select is 0, otherwise B.', nodes: [
    { id: 'g1', a: 'sel', b: 'sel' }, { id: 'g2', a: 'a', b: 'g1' },
    { id: 'g3', a: 'b', b: 'sel' }, { id: 'g4', a: 'g2', b: 'g3' },
  ], output: 'g4' },
]);
const bit = value => value === 0 || value === 1;
const requireBits = input => {
  if (!input || typeof input !== 'object' || !['a', 'b', 'sel'].every(k => bit(input[k])))
    throw new TypeError('A, B and select must be exact binary 0/1 values');
  return { a: input.a, b: input.b, sel: input.sel };
};
export function validateCircuit(circuit) {
  if (!circuit || !Array.isArray(circuit.nodes) || circuit.nodes.length < 1 || circuit.nodes.length > 12)
    throw new TypeError('A circuit must have 1–12 ordered NAND gates');
  const known = new Set(['a', 'b', 'sel']);
  for (const gate of circuit.nodes) {
    if (!gate || typeof gate.id !== 'string' || !/^g[1-9][0-9]*$/.test(gate.id) ||
        known.has(gate.id) || !known.has(gate.a) || !known.has(gate.b))
      throw new TypeError('Gate IDs must be unique; gate inputs must refer to earlier signals');
    known.add(gate.id);
  }
  if (!known.has(circuit.output) || ['a', 'b', 'sel'].includes(circuit.output))
    throw new TypeError('Circuit output must reference a computed gate');
  return true;
}
export function evaluateCircuit(circuitId, input) {
  const circuit = CIRCUITS.find(c => c.id === circuitId);
  if (!circuit) throw new RangeError('Unknown reviewed circuit');
  validateCircuit(circuit);
  const values = { ...requireBits(input) };
  const trace = [];
  for (const gate of circuit.nodes) {
    const left = values[gate.a], right = values[gate.b];
    const result = left === 1 && right === 1 ? 0 : 1;
    values[gate.id] = result;
    trace.push(Object.freeze({ gate: gate.id, leftSignal: gate.a, left,
      rightSignal: gate.b, right, output: result }));
  }
  return Object.freeze({ output: values[circuit.output], trace: Object.freeze(trace),
    circuitId, sourceRevision: SOURCE.conceptRevision, modelRevision: SOURCE.modelRevision });
}
// Deliberately independent oracle: no use of the NAND netlist to calculate expected results.
export function truthOracle(circuitId, input) {
  const { a, b, sel } = requireBits(input);
  switch (circuitId) {
    case 'not': return a === 0 ? 1 : 0;
    case 'and': return a === 1 && b === 1 ? 1 : 0;
    case 'or': return a === 1 || b === 1 ? 1 : 0;
    case 'xor': return a !== b ? 1 : 0;
    case 'mux': return sel === 0 ? a : b;
    default: throw new RangeError('Unknown reviewed circuit');
  }
}
export function newSession() { return Object.freeze({ attempts: Object.freeze([]) }); }
export function submitPrediction(session, { circuitId, inputs, prediction }) {
  if (!session || !Array.isArray(session.attempts) || session.attempts.length > 2)
    throw new TypeError('Invalid local attempt session');
  if (!bit(prediction)) throw new TypeError('Prediction must be binary 0 or 1');
  if (session.attempts.length >= 2) throw new RangeError('Two-attempt learning round is complete');
  const safe = requireBits(inputs);
  const key = [circuitId, safe.a, safe.b, safe.sel].join(':');
  if (session.attempts.some(a => a.key === key)) throw new RangeError('Change circuit or inputs for a distinct attempt');
  const result = evaluateCircuit(circuitId, safe);
  if (result.output !== truthOracle(circuitId, safe)) throw new Error('Circuit differs from independent truth oracle');
  const attempt = Object.freeze({
    id: 'local-' + (session.attempts.length + 1), key, circuitId, inputs: Object.freeze(safe),
    prediction, observed: result.output, correct: prediction === result.output,
    sourceRevision: SOURCE.conceptRevision, modelRevision: SOURCE.modelRevision,
    verification: 'local-unverified',
  });
  return Object.freeze({ session: Object.freeze({
    attempts: Object.freeze([...session.attempts, attempt]),
  }), attempt, trace: result.trace });
}
