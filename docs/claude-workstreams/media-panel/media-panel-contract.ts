/**
 * PROPOSAL ONLY (C3-MEDIA-PANEL). Not imported by studio/src. Codex owns integration.
 * Fits beside studio/src/workspace/types.ts: Chapter.citationIds -> Evidence.id.
 * A panel entry is a view over existing Evidence, or over an external or generated item.
 */

/** Who supplies the thing shown. Always rendered as a visible badge. */
export type ProviderKind =
  | "learner-source" // learner's reviewed source (Source/Evidence in workspace/types.ts)
  | "youtube" // official YouTube iframe embed only
  | "artifact" // KAIRO-authored or generated artifact
  | "web-link"; // link-out only, never embedded or fetched

export interface ProviderIdentity {
  kind: ProviderKind;
  label: string; // badge text, e.g. "YouTube", "Your uploaded notes"
  creator?: string; // channel/author/file name as supplied, never inferred
  canonicalUrl?: string; // page the learner can open themselves
  checkedAt?: string; // ISO date a person last confirmed the item
  attribution: string; // e.g. "Video from YouTube"
}

/** Tri-state: never claim "yes" without evidence. */
export type Availability = "yes" | "no" | "unknown";

export interface CaptionInfo {
  availability: Availability;
  basis: "author-confirmed" | "source-file" | "player-request" | "none"; // "none" only with "unknown"
  language?: string; // BCP-47
  kind?: "human" | "auto" | "unknown";
  transcriptEvidenceId?: string; // learner-owned text fallback
}

/** Why a clip starts where it does. Required for any timed media. */
export interface TimestampProvenance {
  startSeconds: number; // integer >= 0
  endSeconds?: number; // integer > start
  reason: string; // one sentence shown to the learner
  chosenBy: "lesson-author" | "learner" | "model-suggested";
  confirmedBy?: "lesson-author" | "learner"; // model suggestions stay "unconfirmed" until set
  evidenceId?: string; // lesson passage this clip supports
  chapterIndex?: number;
  transcriptQuote?: string; // from the learner's own transcript, never scraped
}

export interface SourcePassageItem {
  type: "passage";
  evidenceId: string; // Evidence.id
  sourceId: string;
  locator: string; // Evidence.locator
  quote: string;
  edited: boolean; // mirrors Evidence.edited; show "edited by learner"
}

export interface VideoItem {
  type: "video";
  videoId: string; // /^[A-Za-z0-9_-]{11}$/
  title: string; // as supplied by the author
  provenance: TimestampProvenance;
  captions: CaptionInfo;
  embed: { host: "www.youtube-nocookie.com"; enableJsApi: boolean; origin: string };
}

export interface ArtifactItem {
  type: "artifact";
  artifactId: string;
  title: string;
  altText: string; // required text alternative
  generated: boolean; // true => labelled "generated", never "verified"
}

export type PanelItem = SourcePassageItem | VideoItem | ArtifactItem;

export interface MediaPanelEntry {
  id: string;
  provider: ProviderIdentity;
  item: PanelItem;
  relevance: string; // why this sits beside this chapter
}

export type PanelStatus =
  | "idle"
  | "needs-consent" // provider script/iframe not loaded yet
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "ended"
  | "blocked" // embedding refused, region, or network
  | "error";

export interface MediaPanelProps {
  entry: MediaPanelEntry;
  status: PanelStatus;
  returnTo: { lessonId: string; chapterIndex: number; scrollKey?: string };
  onConsentLoadProvider(): void; // learner clicked "Load YouTube player"
  onPause(): void;
  onReturnToLesson(): void; // pauses media, restores returnTo, moves focus there
  onOpenSource?(evidenceId: string): void;
  onOpenExternal?(url: string): void; // user-initiated link-out
}

/** Rules an implementation must enforce (see research note and HANDOFF.md). */
export const MEDIA_PANEL_RULES = {
  noOverlayOnPlayer: true, // controls live outside the iframe rectangle
  minPlayerPx: { w: 200, h: 200 },
  noNetworkBeforeConsent: true,
  noDownloadProxyOrScrape: true,
  captionsDefaultUnknown: true,
  modelTimestampsNeedConfirmation: true,
} as const;
