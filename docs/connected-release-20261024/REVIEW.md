# Integration review

Root independently read the delivered source UI, repository, contextual coach, evidence curation and account-boundary tests. Shared router/provider ownership remained with root. Delivery checks alone did not count as integration acceptance.

Corrections made during review:

- Repository identity validation now rejects control characters and invalid UID lengths; hashing preserves the actual UID rather than silently trimming it. Stored records require object payloads.
- Coach links now resolve to public primary references rather than local documentation routes. Coaching remains authored and does not reveal a hidden pump fault.
- Account boundary tests reproduced real late hydration/save writes after unmount. Root added liveness/abort guards after awaited responses, then retained both regression tests. Two other empty-render failures were corrected in the test harness by exposing its real React tree.
- Upload cancellation is only presented as confirmed after server acknowledgement. Jobs persist across reloads; reopening a result preserves an unsaved pasted passage.
- Interrupted imports recover an already-created matching source without running extraction twice. Cancellation removes an uncommitted source belonging to that same import. A dedicated actual-router test covers this boundary.
- OCR checks rendered page dimensions before allocation, caps image pixels and has bounded pages/time. This does not establish diagram understanding.
- Cloud health now exposes the actual cloud-generation configuration needed by the lesson view. Private account material never mounts the old global local workspace.
- Native browser learning storage is scoped before the provider and page state initialize. The all-account snapshot write uses conditional versions; a device conflict does not silently overwrite either copy.

Verification: full installed suite 635/635; additional import recovery 1/1; production TypeScript/Vite build successful. An initial sandboxed run could not connect to localhost and is not acceptance evidence. The authorised full run is recorded in `full-tests-authorized.txt`. One earlier resource-contention extraction timeout did not recur in that complete two-worker test run.

Live APIs were tested using two temporary synthetic accounts: source/lesson/progress/job privacy, review, generation, editable draft conflict handling, durable import, original integrity and revoked-session rejection. Google generation and speech used only a small synthetic public passage. Both temporary accounts were deleted.

No browser observation, visual inspection, screenshots or device/accessibility acceptance occurred. Claude's historic registrations do not establish receipt of current work. No watcher or deleted schedule was activated.
