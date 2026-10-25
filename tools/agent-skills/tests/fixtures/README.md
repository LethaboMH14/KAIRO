# Generated safety fixtures

test_harness.py builds offline synthetic ZIP fixtures inside temporary directories. It never runs an external tool or third-party script. Cases include altered archive/stage/registry hashes, mismatched tickets, disallowed shell scripts, ZIP path traversal and drive names, ZIP and sandbox symlinks, expansion bombs, target overwrite and unapproved execution permission. Refusal is not a licence or execution approval.
