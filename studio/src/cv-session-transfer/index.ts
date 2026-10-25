import {
  createCvDraft,
  CvDraftInputError,
  type CvDraftInput,
  type CvFactInput,
  type CvSection,
  type TargetRoleInput,
} from '../cv-draft/model.ts';

export const CV_SESSION_TRANSFER_LIMITS = { fileBytes: 128 * 1024 } as const;

export type CvSessionV1 = {
  format: 'kairo-cv-session';
  version: 1;
  session: CvDraftInput;
};

const envelopeKeys = ['format', 'version', 'session'];
const sessionKeys = ['facts', 'targetRoleRequirements'];
const factKeys = ['id', 'section', 'text', 'providedBy', 'confirmation'];
const targetKeys = ['label', 'requirements'];
const encoder = new TextEncoder();

function fail(code: string, message: string): never {
  throw new CvDraftInputError(code, message);
}

function ownDataRecord(value: unknown, keys: string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    fail('INVALID_SESSION_OBJECT', `${label} must be a plain object.`);
  }
  const object = value as Record<string, unknown>;
  const ownKeys = Reflect.ownKeys(object);
  if (ownKeys.some(key => typeof key !== 'string' || !keys.includes(key))) {
    fail('INVALID_SESSION_FIELD', `${label} contains an unsupported field.`);
  }
  for (const key of ownKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) {
      fail('INVALID_SESSION_OBJECT', `${label} fields must be enumerable data values.`);
    }
  }
  return object;
}

function ownArray(value: unknown, maximum: number, label: string): unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > maximum) {
    fail('INVALID_SESSION_ARRAY', `${label} must be a plain list with at most ${maximum} items.`);
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some(key => key !== 'length' && (typeof key !== 'string' || !/^(0|[1-9][0-9]*)$/u.test(key) || Number(key) >= value.length))) {
    fail('INVALID_SESSION_ARRAY', `${label} cannot contain extra properties.`);
  }
  const result: unknown[] = [];
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) {
      fail('INVALID_SESSION_ARRAY', `${label} cannot contain missing or accessor items.`);
    }
    result.push(descriptor.value);
  }
  if (keys.length !== value.length + 1) fail('INVALID_SESSION_ARRAY', `${label} cannot contain missing items.`);
  return result;
}

/** Copies only the documented v1 data fields, rejecting accessors and custom prototypes. */
function projectSession(value: unknown): CvDraftInput {
  const session = ownDataRecord(value, sessionKeys, 'CV session');
  if (!Object.hasOwn(session, 'facts')) fail('INVALID_SESSION_FIELD', 'CV session must include facts.');
  const rawFacts = ownArray(session.facts, 80, 'Facts');
  const facts: CvFactInput[] = rawFacts.map((rawFact, index) => {
    const fact = ownDataRecord(rawFact, factKeys, `Fact ${index + 1}`);
    if (factKeys.some(key => !Object.hasOwn(fact, key))) fail('INVALID_SESSION_FIELD', `Fact ${index + 1} is missing a required field.`);
    return {
      id: fact.id as string,
      section: fact.section as CvSection,
      text: fact.text as string,
      providedBy: fact.providedBy as 'applicant',
      confirmation: fact.confirmation as 'confirmed' | 'unconfirmed',
    };
  });

  if (!Object.hasOwn(session, 'targetRoleRequirements')) return { facts };
  const target = ownDataRecord(session.targetRoleRequirements, targetKeys, 'Target-role requirements');
  if (targetKeys.some(key => !Object.hasOwn(target, key))) fail('INVALID_SESSION_FIELD', 'Target-role requirements are incomplete.');
  const rawRequirements = ownArray(target.requirements, 40, 'Target-role requirements');
  const targetRoleRequirements: TargetRoleInput = {
    label: target.label as string,
    requirements: rawRequirements.map(item => item as string),
  };
  return { facts, targetRoleRequirements };
}

function validateInput(input: unknown): CvDraftInput {
  const projection = projectSession(input);
  // The model applies the authoritative field, text, count and aggregate-size checks.
  // It receives only our fresh plain-data projection, so caller hooks cannot run.
  createCvDraft(projection);
  return projection;
}

function assertFileSize(text: string): void {
  if (text.length > CV_SESSION_TRANSFER_LIMITS.fileBytes) {
    fail('SESSION_TOO_LARGE', 'CV session file exceeds the 128 KiB limit.');
  }
  if (encoder.encode(text).byteLength > CV_SESSION_TRANSFER_LIMITS.fileBytes) {
    fail('SESSION_TOO_LARGE', 'CV session file exceeds the 128 KiB limit.');
  }
}

export function createCvSessionFile(input: CvDraftInput): string {
  const session = validateInput(input);
  const envelope: CvSessionV1 = { format: 'kairo-cv-session', version: 1, session };
  const jsonText = JSON.stringify(envelope);
  assertFileSize(jsonText);
  return jsonText;
}

export function parseCvSessionFile(jsonText: string): CvDraftInput {
  if (typeof jsonText !== 'string') fail('INVALID_SESSION_TEXT', 'CV session content must be text.');
  assertFileSize(jsonText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText) as unknown;
  } catch {
    fail('INVALID_SESSION_JSON', 'CV session file is not valid JSON.');
  }

  const envelope = ownDataRecord(parsed, envelopeKeys, 'CV session file');
  if (envelope.format !== 'kairo-cv-session' || envelope.version !== 1) {
    fail('UNSUPPORTED_SESSION_VERSION', 'CV session file format or version is not supported.');
  }
  if (!Object.hasOwn(envelope, 'session')) fail('INVALID_SESSION_FIELD', 'CV session file must include a session.');
  return validateInput(envelope.session);
}
