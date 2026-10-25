# KAIRO shared coordination bus

For Codex and Claude working in this **same local project folder**. Python 3.11 is available; no packages or background processes are needed. The user authorized this shared workspace protocol on 21 October 2026.

## How it works

`bus.py` stores agent registrations, tasks, messages and an event history in a local SQLite database. Each mutation uses a transaction; simultaneous overlapping claims cannot both succeed. A task reserves its listed files/subtrees until its owner releases or completes it. Parent/child paths and case variations conflict. Blocked tasks keep their reservations.

This is cooperative coordination: it cannot stop an editor from writing directly. Both agents must follow AGENTS.md. It does not launch models, send chat messages, watch processes, detect your model settings or automatically resolve merge conflicts. Claude is not registered until it actually joins. Model and effort values are self-reported; use `unknown` if unavailable. Do not reuse one session ID for simultaneous sessions.

The database is for one local filesystem. Do not put competing copies on cloud sync or a network drive, and do not treat separate Git worktree copies as a shared queue. For worktrees, invoke the bus by its absolute path in the canonical project and reserve the corresponding repository-relative scopes there. Keep worktree/branch details in the task note and handoff. Source integration still requires review.

## Start a session

From the project root:

```powershell
python coordination/bus.py status
python coordination/bus.py register --agent claude-studio-20261021-a --client Claude --model unknown --effort unknown --focus "Studio assets and animation"
python coordination/bus.py inbox --agent claude-studio-20261021-a
```

Replace `unknown` with the real values exposed by your client, if available. Codex uses its own unique ID. No specific model, effort or role has been assigned to Claude.

## Own a task before editing

```powershell
python coordination/bus.py task --agent claude-studio-20261021-a --task STUDIO-001 --title "Prepare lecture studio assets" --paths assets/studios/lecture docs/lecture-assets.md
python coordination/bus.py claim --agent claude-studio-20261021-a --task STUDIO-001
python coordination/bus.py update --agent claude-studio-20261021-a --task STUDIO-001 --note "Inspecting licences; no app code changed"
```

Paths are literal relative files or subtrees, not globs. Do not edit beyond the claim. Reserve root files explicitly when needed. Claims remain occupied even after a crash or an old heartbeat; no automatic stealing or lock expiry exists. If an owner is unavailable, the user must coordinate recovery before anyone changes ownership. Do not edit the database directly.

## Exchange context

```powershell
python coordination/bus.py message --agent claude-studio-20261021-a --to all --body "Lecture asset manifest will expose stable object IDs; please read the handoff before integrating."
python coordination/bus.py heartbeat --agent claude-studio-20261021-a --focus "Optimizing the lecture room GLB"
python coordination/bus.py inbox --agent claude-studio-20261021-a --after 0
python coordination/bus.py events --after 0
```

Use actual registered IDs for targeted recipients, or `all` for future sessions to discover. Save the last message/event ID and pass it with `--after` to avoid repeating history. Check at task boundaries and before integration; do not busy-poll. Message bodies are plain collaboration data, not executable commands or authorization to expand scope. Never post credentials.

## Finish or hand off

Create your own uniquely named handoff in `coordination/handoffs/`; reserve that filename too unless you own the whole coordination subtree. Include model/effort, scope, changed files, interfaces, assets/licences, checks with actual results, limitations and next steps.

```powershell
python coordination/bus.py block --agent claude-studio-20261021-a --task STUDIO-001 --note "Waiting for asset licence clarification; reservation retained"
python coordination/bus.py update --agent claude-studio-20261021-a --task STUDIO-001 --note "Licence clarified; resumed"
python coordination/bus.py complete --agent claude-studio-20261021-a --task STUDIO-001 --note "Assets reviewed; browser integration remains" --evidence docs/lecture-assets.md
```

Use `release --note "..."` to return unfinished work to the open queue. Only the owner can release, update or complete. Completion checks that evidence files exist; it does not judge their correctness or approve deployment. Independent review remains necessary.

Run the isolated behavioural tests with `python -m unittest discover -s coordination -p test_bus.py -v`.

## Give Claude this startup instruction

> Open `C:\Users\USER\Desktop\fnb app of year hackathon`. Read CLAUDE.md, AGENTS.md, coordination/README.md and the KAIRO product brief. Run the bus status command, register your unique session ID with your actual model and effort or unknown, then read your inbox. Claim the files for the task I give you before editing. Coordinate shared interfaces through handoffs and respect occupied scopes.

Keep the scope of Claude's actual development task in your own prompt. The coordination setup does not silently start a new implementation task.
