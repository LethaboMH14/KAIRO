/** Proposed presentation contract v1. Root owns orchestration and validates context. */
export type KairoAction = 'teach' | 'explain' | 'test' | 'plan';
export type StudioAction = 'explain' | 'inside' | 'try' | 'practise' | 'source';
export type ScopeKind = 'selection' | 'section' | 'lesson' | 'topic';
export type SourceRef = Readonly<{ sourceId: string; revision: string }>;
export type ScopeChoice = Readonly<{ id: string; kind: ScopeKind; label: string; available: boolean; reason?: string }>;
export type InteractionContext = Readonly<{
  contextKey: string; surface: 'material' | 'lesson' | 'motor' | 'pump' | 'classroom' | 'work' | 'direction';
  lessonId?: string; sourceRefs: readonly SourceRef[]; selectedTargetId?: string;
  selectionLabel?: string; scopes: readonly ScopeChoice[]; defaultScopeId?: string;
}>;
export type ActionChoice<T extends string> = Readonly<{ id: T; label: string; available: boolean; reason?: string }>;
export type KairoActionRequest = Readonly<{ contextKey: string; action: KairoAction; scopeId: string }>;
export type NarrationState = 'stopped' | 'playing' | 'paused';
export type TeachingCardContent = Readonly<{
  id: string; contextKey: string; title: string; body: string;
  sourceLabels: readonly string[]; capability: 'prepared' | 'source-linked' | 'unavailable';
}>;
