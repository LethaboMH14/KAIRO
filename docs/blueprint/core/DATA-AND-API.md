# Data, ERD semantics and API proposal

**Proposed v1, not a migration already applied.** The companion visual pack contains editable ER diagrams; this document defines constraints they must preserve. PostgreSQL is the proposed canonical store. Identity provider owns authentication secrets; KAIRO does not store password hashes unless a separately reviewed self-hosted identity service is chosen.

## Domain entities

| Aggregate | Entities / essential fields | Relations and constraints |
|---|---|---|
| Identity | `Tenant(id,type,status)`, `User(id,identitySubject,status)`, `Membership(tenantId,userId,role,status)` | Unique identity issuer+subject. Multiple memberships; institutional tutor cannot read another institution. Authorization derived server-side. |
| Learner choices | `Profile(userId,displayName,locale,studyGoal)`, `AccessibilityPreference`, `ConsentGrant` | Optional photo/CV. Versioned purposes, provider, data categories, timestamp, expiry/revocation. No inferred protected traits. |
| Curriculum | `Institution`, `ProgrammeVersion`, `ModuleVersion`, `Enrollment` | Year/edition and authoritative source URL/date. Learner confirms suggestions. Institution record is not claimed accreditation. |
| Sources | `SourceAsset(id,tenantId,ownerId,objectId,mediaType,sha256,rights,status)`, `SourceRevision`, `SourceSpan` | Source has many immutable revisions; spans carry page/time/bounding box + text hash and offsets. Reviewed revision never overwritten. File possession ≠ licence for public redistribution or training. |
| Lessons | `Lesson`, `LessonRevision`, `LessonSegment`, `Claim`, `Citation`, `SceneManifestVersion`, `SceneTarget` | Citation links claim/segment to span+revision, not a mutable URL only. Numeric parameters typed with units. Local authored examples labelled. |
| Teaching | `TeachingSession`, `Turn`, `PresentationCheckpoint`, `SpeechBundle`, `ActionEvent` | Session bound to lesson revision. Turn includes received transcript, accepted correction, generated text and heard prefix separately. Audio object hashes bind timing tracks. Unique session+eventId prevents duplicate action effects. |
| Practice | `AssessmentDefinitionVersion`, `Attempt`, `AttemptResponse`, `RubricResult`, `MasteryEstimate` | Immutable attempt evidence; regrade appends a version. Mastery records model/rule version, uncertainty and inputs. No single “employability score” field. |
| Memory | `MemoryItem(userId,kind,value,origin,confidence,expiresAt,consentVersion)` | Learner approved preferences and task summaries. Editable/revocable; summarization cannot convert a guess into fact. Raw audio off by default. |
| Work readiness | `RolePostingVersion`, `Requirement`, `EvidenceArtifact`, `EvidenceClaim`, `PortfolioShare` | Retrieval date/expiry; requirements trace to posting. Self-report, assessed and externally verified evidence have different types. Shares are explicit, scoped and expiring. |
| Tools | `Connector`, `CapabilityGrant`, `ToolIntent`, `ToolRun`, `Approval`, `Receipt` | Grant binds user, destination, action, allowed fields, document versions, expiry and uses. Pending approval cannot execute. External success requires provider receipt. |
| Operations | `Job`, `UsageReservation`, `UsageEvent`, `AuditEvent`, `OutboxEvent`, `DeletionRequest` | Idempotency keys per tenant+operation; usage append-only; job retries bounded. Logs exclude raw private documents/voice/tokens. Deletion traverses derived objects/index/cache. |

## Relational and ownership rules

- Use `tenant_id` on private roots and composite foreign keys `(tenant_id,id)` to prevent a child in one tenant linking to another tenant's source. Add database row policies where available **and** application object authorization. Background workers get a scoped service role; a superuser bypass is not a normal app role.
- Unique membership `(tenant_id,user_id)`; unique source revision `(tenant_id,source_id,revision_hash)`; unique action `(tenant_id,session_id,event_id)`; unique retry/idempotency key with request-body hash. A reused key with a different payload returns conflict.
- Check statuses via enums/check constraints; finite bounded numbers, duration ≥0, amount represented in minor units, explicit units, timestamp ordering. UTF-8 byte limits as well as character limits.
- No mutation of attempts/source revisions already used by published lessons. Use `ON DELETE RESTRICT` where preserving a reference is required; use a deletion workflow to remove/redact full dependent graphs when lawful/user-required. Do not let an incidental cascade silently break evidence.
- Object IDs do not reveal local paths/names. Private objects use short-lived scoped access, preferably server-proxied for stronger revocation. Signed URLs are bearer capabilities until expiry; do not overstate instantaneous revocation.
- Retrieval rows inherit tenant/source authorization and deletion status. Search must filter before ranking/return, not fetch global top-k and hide afterward. Cross-tenant caches are forbidden for private content.

## Initial API surface (proposal)

Prefix new versions `/api/v1`; preserve current local routes until migration adapters are tested. All private routes require verified auth, tenant membership, object permission, content type/size validation and request ID. CSRF protection applies to cookie-authenticated mutations; rate/cost quotas are per-user and per-tenant, not only process memory.

| Method / route | Contract / response |
|---|---|
| `POST /sources/uploads` | Authorized file intent, declared size/type, rights and purpose; return short-lived upload allocation with strict bounds. |
| `POST /sources/{id}/extract` | Idempotent bounded job; `202` job ID. |
| `GET /jobs/{id}` | Only owning tenant; state, progress stage, safe error; no host paths. |
| `POST /sources/{id}/revisions` | Expected previous revision + edited pages + explicit review; `409` on conflict. |
| `POST /lessons` | Reviewed revision, goal, locale, consent version, idempotency key; staged job and preview. |
| `POST /teaching-sessions` | Lesson revision, device mode, speech/mic choices, usage reservation; short session token. |
| `POST /teaching-sessions/{id}/turns` | Typed/final transcript + target/context snapshot + epoch; response stream or job. |
| `POST /teaching-sessions/{id}/interrupt` | Epoch/last heard position/committed action IDs; idempotent terminal fence. Local stop does not wait for network ack. |
| `POST /speech-bundles` | Validated text/voice/locale/revision, consent and budget; return scoped bundle reference. |
| `GET /sessions/{id}/events?after=sequence` | Authenticated resumable ordered events, bounded replay window; checkpoint reset when history expired. |
| `POST /attempts` | Task/rubric revision, response, conditions; immutable assessment result or review-needed status. |
| `PATCH /memory/{id}` / `DELETE` | Learner-owned preference/summary correction or deletion; downstream invalidation. |
| `POST /exports` / `POST /deletions` | Explicit scope and purpose; asynchronous status/receipt and expiry. |
| `POST /tool-intents` / `POST /approvals/{id}` | Preview diff, destination, fields, cost and version-bound approval; execution only after policy checks. |

Stream event envelope: `schema,sessionId,epoch,turnId,responseId,sequence,eventId,type,payload`. Allowlist types; reject unknown major version. Never trust a client-provided `userId`, `role` or `tenantId` without verifying it against the session. Browser WebSocket origin and session binding need independent checks. Avoid long-lived tokens in query strings/logs; use reviewed short-lived handshake/exchange design.

## Retention and learning memory proposal

Pilot defaults to agree before production: raw microphone frames transient; audio recording disabled; temporary processing artefacts deleted after job TTL; user-approved text transcript optional; sources and learner work retained until learner deletion/account policy; operational pseudonymous logs short-lived (proposed 30 days), backup rotation proposed 30 days. The final retention policy must identify exact legal/business purpose and deletion/restore behaviour; these numbers are design defaults, not a legal mandate.

Those defaults describe KAIRO-controlled storage. They do not establish zero retention by a speech/model provider. Record the exact service/region, contractual retention and logging/training settings, any abuse-monitoring exceptions and learner notice/consent before transmission. Provider-side deletion must be implemented and evidenced where available, with limits disclosed rather than guessed.

“Remember my progress” stores objectives, completed attempts, learner-approved preferences, unfinished task/checkpoint and evidence. Do not retain entire conversations indefinitely or train on private coursework by default. On shared devices offer guest session, clear local data, account switch isolation and explicit offline download/delete controls. Cloud sync is versioned and conflict-aware; an offline device cannot overwrite a newer assessment silently.

## Suggested migrations

1. Add schema migrations and tests against a disposable database with synthetic tenants; implement auth/session and object ownership.
2. Import only learner-selected local material with a preview, rights/purpose and explicit destination consent. No bulk upload of the developer's Desktop inventory.
3. Migrate local IDs with a mapping and content hashes; compare counts and revision/citation integrity. Preserve export/rollback copy.
4. Shadow read/compare for test accounts, then a limited opt-in pilot. Do not dual-write two canonical systems without reconciliation.
5. Verify backup restore, deletion propagation, RLS negative tests, retries and new-device resume before widening access.
