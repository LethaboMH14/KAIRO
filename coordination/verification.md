# Coordination verification

Recorded 21 October 2026 after executing:

```text
python -m unittest discover -s coordination -p test_bus.py -v
```

Result: exit code 0. Six tests passed in 7.065 seconds:

- blocked task retains ownership; a different owner cannot release it
- missing completion evidence fails without changing active state
- message cursors and registration checks work
- concurrent overlapping claims produce exactly one winner
- parent/child and case conflicts are detected; release permits handoff
- path escape is rejected; a root claim conflicts with a subtree

The tests use isolated temporary databases. This verifies bounded local CLI behaviour, not live Claude integration, network-drive support or filesystem enforcement. Source existence is the completion gate; evidence quality still needs review.
