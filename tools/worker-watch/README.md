# Scheduled worker accountability, not an autonomous coding agent

The workflow `.github/workflows/worker-watch.yml` runs on the GitHub default branch around minute 17 of each hour (GitHub scheduling is best-effort, not exact) and via manual `workflow_dispatch`. It scans ALL current open issues/PRs, with explicit tracked lanes for Engineering, Research, QA, Studio Builder #49 and Kaggle ML #50, and retrieves recent Actions failures. It writes a short GitHub job summary, a 7-day `worker-status.json` artifact and a **deduplicated** coordinator comment in Issue #11 when material attention/failures change.

The scanner's comment count/issue timestamp is **not** an exclusive task claim or a reliable signal of an active worker. Inactive chats do not wake up because GitHub ran a job. The live local SQLite bus cannot be verified from the cloud. A true task runner needs a separately reviewed agent execution adapter (#13): authenticated triggers, independent actual sandbox workers, transactional leases, project branch scope, bounded retry and spend, kill switch, consent and owner-approved conditional merge gates.

Credentials are limited to GitHub's ephemeral GITHUB_TOKEN with contents/actions read and issues write (coordinator comments only). No Kaggle/Google/Azure secrets, API inference requests, production deploys or paid resources. PR executions only test the scanner, so PR changes do not publish coordinator alerts until merged.

Runs at most hourly. First scheduled GitHub run is only expected **after the workflow is reviewed, merged and enabled on main**. Monitor real GitHub Actions in the repository; never claim the schedule is active merely because the YAML exists in a PR. GitHub may delay schedule runs.

Test offline:
```
node --test tools/worker-watch/status.test.mjs
```
